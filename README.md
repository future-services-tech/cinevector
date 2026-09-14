# Movie Knowledge Base V3

Catalogo cinematografico e motore di ricerca avanzata sui metadati dei film (titolo, trama, cast, regia, generi, poster). Nessuna funzionalità di streaming, download o estrazione di URL video: il link "Apri sulla piattaforma" porta sempre e solo alla pagina pubblica della fonte (es. TMDb).

Stato attuale: **Fasi 1-5 completate** (solution .NET 10, dominio, PostgreSQL/EF Core, CRUD film, full-text search con filtri strutturati e facet, frontend React con ricerca, crawler TMDb con deduplicazione e tracciamento CrawlJob, embedding semantici con pgvector/HNSW, ranking ibrido a tre segnali, ricerca in linguaggio naturale, film simili). Le fasi successive (Redis/worker, dashboard admin, sicurezza/osservabilità di produzione) sono descritte in fondo a questo file.

## Prerequisiti

- .NET SDK 10
- Node.js 22+
- Docker Desktop (per PostgreSQL/Redis)
- Un account [TMDb](https://www.themoviedb.org/settings/api) per la API key (usata dal crawler in Fase 3)

## 0. Crawler TMDb (Fase 3)

Il crawler usa l'API ufficiale TMDb (mai scraping HTML), tramite `TmdbSourceAdapter` (`src/CineVector.Infrastructure/Sources/Tmdb`). Per usarlo:

1. Ottieni un **Read Access Token v4** da https://www.themoviedb.org/settings/api e mettilo in `.env` come `TMDB_API_KEY`.
2. Crea la fonte (una sola volta):
   ```bash
   curl -X POST http://localhost:5080/api/sources -H "Content-Type: application/json" \
     -d '{"name":"TMDb","baseUrl":"https://www.themoviedb.org","enabled":true,"adapterType":"Tmdb"}'
   ```
3. Avvia un crawl:
   ```bash
   curl -X POST http://localhost:5080/api/crawl/{sourceId}/start
   curl http://localhost:5080/api/crawl/jobs/{jobId}   # stato/avanzamento
   curl -X POST http://localhost:5080/api/crawl/{sourceId}/cancel
   ```

Note tecniche:
- `Tmdb:BaseUrl` in `appsettings.json` (mai `Source.BaseUrl`, modificabile da un admin) è l'unico endpoint contattato: evita che una fonte manomessa diventi un vettore SSRF.
- `Tmdb:DiscoverPages` limita quante pagine di `/discover/movie` scaricare per esecuzione (20 film/pagina).
- Deduplicazione: chiave primaria (SourceId, ExternalId); un film esistente viene riscritto solo se l'hash dei metadati cambia (altrimenti si aggiorna solo `LastSeenAt`). Un titolo+anno coincidente su un'altra fonte viene loggato come possibile duplicato, mai unito automaticamente.
- La cancellazione (`/cancel`) usa un registro di `CancellationTokenSource` in-process: funziona con una singola istanza API. Il coordinamento cross-istanza via Redis arriva in Fase 6.

## 0b. Ricerca semantica ed embedding (Fase 4)

Il provider di embedding è configurabile (`Embedding:Provider`); di default usa **OmniRouter** (schema compatibile OpenAI) con il modello `gemini/gemini-embedding-001`.

- L'output nativo del modello è 3072 dimensioni; pgvector non supporta indici HNSW/IVFFlat oltre le 2000, quindi il vettore viene **troncato a `Embedding:Dimensions` (384) e rinormalizzato (L2)** — tecnica Matryoshka ufficialmente supportata da questo modello.
- L'embedding si rigenera solo quando il testo derivato dai metadati (`EmbeddingText`, sezione titolo/generi/trama/cast/registi/keyword) cambia, o se non esiste ancora — mai ad ogni richiesta.
- Il crawler genera automaticamente gli embedding mancanti al termine di ogni esecuzione. Per film esistenti/creati manualmente, o per un primo backfill:
  ```bash
  curl -X POST "http://localhost:5080/api/embeddings/backfill?batchSize=50"
  ```
- Ricerca semantica: aggiungi `semantic=true` a `/api/search` insieme a `query`:
  ```bash
  curl "http://localhost:5080/api/search?query=un+industriale+che+salva+vite+durante+la+persecuzione+nazista&semantic=true"
  ```
  Si combina con i filtri strutturati (`genres`, `yearFrom`, ecc.): `mode` nella risposta indica `semantic`, `semantic+structured`, `fulltext`, `fulltext+structured` o `structured`. Se la generazione dell'embedding fallisce (provider non raggiungibile), la ricerca ripiega automaticamente su full-text/strutturata.

## 0c. Ranking ibrido, ricerca in linguaggio naturale, film simili (Fase 5)

**Ranking ibrido**: ogni risultato combina fino a tre segnali tramite `ISearchRankingService` (pesi in `Search:FullTextWeight/SemanticWeight/MetadataWeight`, rinormalizzati sui soli segnali presenti):
- full-text (`ts_rank`, compresso a [0,1])
- semantico (similarità coseno, solo se `semantic=true`)
- "qualità" (rating normalizzato 0-1), sempre presente se il film ha un voto

**Ricerca in linguaggio naturale**: aggiungi `naturalLanguage=true` a `/api/search` — un parser rule-based (`RuleBasedSearchIntentParser`, sostituibile in futuro con un LLM) estrae da `query` generi, intervallo di anni, soglia di rating, regista, attore e nazione, lasciando come `query` residua solo il testo libero (cercato semanticamente):
```bash
curl "http://localhost:5080/api/search?query=film+di+fantascienza+dal+2020+al+2025&naturalLanguage=true"
curl "http://localhost:5080/api/search?query=commedie+romantiche+sulla+seconda+possibilit%C3%A0&naturalLanguage=true"
```
I filtri passati esplicitamente (es. `genres=...`) hanno sempre priorità su quelli dedotti dal testo.

**Film simili**: `GET /api/movies/{id}/similar?maxResults=20&minSimilarity=0.3` — similarità coseno sull'embedding con un piccolo re-ranking additivo per generi condivisi e vicinanza d'anno (pesi in `SimilarMovies:*`). Richiede che il film abbia già un embedding (vedi backfill in Fase 4).

## 1. Configurazione ambiente

```bash
cp .env.example .env
```

Compila `.env` con le tue credenziali (password PostgreSQL, `TMDB_API_KEY`, `OMNIROUTER_API_KEY` per l'embedding provider). Il file `.env` non viene mai committato.

## 2. Avvio di PostgreSQL e Redis

```bash
docker compose up -d postgres redis
```

PostgreSQL (immagine `pgvector/pgvector:pg16`, con l'estensione `vector` già disponibile) è esposto sulla porta host `5433` per evitare conflitti con eventuali installazioni PostgreSQL locali sulla 5432. Redis è sulla `6380`.

## 3. Migration del database

```bash
dotnet tool update --global dotnet-ef   # se non già installato/aggiornato
dotnet ef database update \
  --project src/CineVector.Infrastructure \
  --startup-project src/CineVector.Api
```

La connection string di default (`appsettings.json`) punta a `localhost:5433`. Per sviluppo locale fuori Docker, crea un `src/CineVector.Api/appsettings.Local.json` (ignorato da git) con la password reale e avvia con `ASPNETCORE_ENVIRONMENT=Local`.

## 4. Avvio dell'API

```bash
dotnet run --project src/CineVector.Api
```

- Swagger/OpenAPI: `http://localhost:5080/openapi/v1.json` (in ambiente Development)
- Health check: `GET /health`, `/health/live`, `/health/ready`
- CRUD film: `GET|POST /api/movies`, `GET|PUT|DELETE /api/movies/{id}`
- CRUD fonti: `GET|POST /api/sources`, `GET|PUT|DELETE /api/sources/{id}`
- Crawler: `GET /api/crawl/jobs`, `GET /api/crawl/jobs/{id}`, `POST /api/crawl/start`, `POST /api/crawl/{sourceId}/start`, `POST /api/crawl/{sourceId}/cancel`
- Embedding: `POST /api/embeddings/backfill?batchSize=50`
- Film simili: `GET /api/movies/{id}/similar?maxResults=20&minSimilarity=0.3`
- Ricerca: `GET|POST /api/search?query=...&genres=...&actors=...&directors=...&yearFrom=...&yearTo=...&ratingFrom=...&ratingTo=...&language=...&sort=...&page=...&pageSize=...`
  - Full-text PostgreSQL (`tsvector` con pesi: titolo A, generi/regia B, cast/keyword C, trama D; `unaccent` per gli accenti), filtri strutturati, o entrambi combinati (`mode`: `fulltext` / `structured` / `fulltext+structured`)
  - Risposta include `facets` (generi/anni/lingue) calcolate sul set filtrato

## 5. Avvio del frontend

```bash
cd src/moviecatalog-web
cp .env.example .env
npm install
npm run dev
```

Apri `http://localhost:5173`. La lista film e la pagina di dettaglio leggono dall'API su `VITE_API_BASE_URL` (default `http://localhost:5080`).

## 6. Avvio full stack via Docker Compose

```bash
docker compose up -d --build
```

Avvia `postgres`, `redis`, `api` (porta 5080), `worker` (nessun endpoint HTTP, per ora inattivo), `frontend` (porta 5173, servito da Nginx). Il profilo opzionale `dev` aggiunge `pgadmin` (porta 5050):

```bash
docker compose --profile dev up -d
```

## 7. Dati di esempio

Non è ancora presente uno script di seed automatico (arriverà con la Fase 3, insieme al crawler TMDb). Nel frattempo un film si crea così:

```bash
curl -X POST http://localhost:5080/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "sourceName": "TMDb",
    "externalId": "157336",
    "title": "Interstellar",
    "year": 2014,
    "rating": 8.4,
    "platformUrl": "https://www.themoviedb.org/movie/157336",
    "genres": ["Science Fiction", "Drama"],
    "directors": ["Christopher Nolan"]
  }'
```

## 8. Test

```bash
dotnet test
```

`CineVector.SearchTests` usa [Testcontainers](https://testcontainers.com/) per avviare un vero PostgreSQL (`pgvector/pgvector:pg16`) durante i test: richiede Docker attivo.

## Struttura della solution

```text
src/
├── CineVector.Api/            API ASP.NET Core (controller, Program.cs, appsettings)
├── CineVector.Application/    Servizi applicativi, validazione, DTO mapping
├── CineVector.Domain/         Entità di dominio (Movie, Person, Genre, Source, CrawlJob, ...)
├── CineVector.Infrastructure/ EF Core, PostgreSQL/pgvector, repository, migration
├── CineVector.Worker/         Background worker (crawler/embedding, dalla Fase 3)
├── CineVector.Search/         Motore di ricerca ibrido (dalla Fase 2)
├── CineVector.Contracts/      DTO condivisi tra Application e Api
└── moviecatalog-web/            Frontend React + Vite + TypeScript

tests/
├── CineVector.UnitTests/
├── CineVector.IntegrationTests/
└── CineVector.SearchTests/

infrastructure/docker/           Dockerfile di Api, Worker, Frontend
```

## Roadmap (fasi successive)

- **Fase 6** — Redis (cache, lock crawler), dashboard admin/crawler, statistiche.
- **Fase 7** — Sicurezza (SSRF guard, allowlist host), osservabilità (Serilog + correlation id), ottimizzazione indici, test di integrazione/ricerca, Docker di produzione.
