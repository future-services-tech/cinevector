# cinevector-newweb

Frontend di CineVector: React 19, Vite, TypeScript, Tailwind CSS 4, React Router, TanStack Query e Three.js (`@react-three/fiber`). Legge i dati dall'API `CineVector.Api`.

La documentazione completa del progetto, compreso il deploy, è nel [README principale](../../README.md).

## Sviluppo

```bash
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:5080
npm install
npm run dev              # http://localhost:5174
```

Il dev server ascolta su `5174` con `strictPort`, anche su IPv4 `127.0.0.1`: serve al redirect OAuth di Spotify, che accetta solo l'indirizzo loopback IPv4.

## Variabile d'ambiente

| Variabile | Effetto |
|---|---|
| `VITE_API_BASE_URL` | Base URL dell'API, letta **a build time**. Vuota = URL relativi (`/api/...`), come in produzione dietro Traefik. Se non definita, il fallback è `http://localhost:5080`. |

## Pagine

| Rotta | Pagina |
|---|---|
| `/` e `/movie/:id` | Esplora Galassia 3D (sfera, cluster, catalogo, sfera film) e dettaglio film |
| `/catalogo` | Catalogo con ricerca ibrida e filtri |
| `/sources` | Gestione delle fonti |
| `/crawler` | Avvio e controllo dei crawl |
| `/metrics` | Metriche, analisi di ricerca, log, embedding |
| `/music` | Ricerca musicale Spotify |
| `/callback` | Ritorno dal login Spotify |

## Build di produzione

Il build viene fatto da `infrastructure/docker/Frontend.Dockerfile` e servito da nginx (`infrastructure/docker/nginx.frontend.conf`), con `VITE_API_BASE_URL` vuoto.
