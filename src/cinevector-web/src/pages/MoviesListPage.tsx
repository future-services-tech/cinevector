import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { search, type SearchSort } from "../api/search";
import { MovieCard } from "../components/MovieCard";
import { MovieCarousel } from "../components/MovieCarousel";
import { useSettings } from "../lib/settings";

const PAGE_SIZE = 8;

const NL_EXAMPLES = [
  "film di fantascienza dal 2020 al 2025",
  "film con Tom Hanks ambientati in Italia",
  "thriller psicologici con valutazione superiore a 7",
  "un film diretto da Christopher Nolan",
];

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "Relevance", label: "Rilevanza" },
  { value: "RatingDesc", label: "Rating (alto → basso)" },
  { value: "YearDesc", label: "Anno (recente → vecchio)" },
  { value: "YearAsc", label: "Anno (vecchio → recente)" },
  { value: "TitleAsc", label: "Titolo (A → Z)" },
];

export function MoviesListPage() {
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [genre, setGenre] = useState<string | null>(null);
  const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
  const [yearTo, setYearTo] = useState<number | undefined>(undefined);
  const [ratingFrom, setRatingFrom] = useState<number | undefined>(undefined);
  const [actor, setActor] = useState("");
  const [director, setDirector] = useState("");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [semantic, setSemantic] = useState(false);
  const [naturalLanguage, setNaturalLanguage] = useState(false);
  const [sort, setSort] = useState<SearchSort>("Relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["search", query, genre, yearFrom, yearTo, ratingFrom, actor, director, language, semantic, naturalLanguage, sort, page, PAGE_SIZE],
    queryFn: () =>
      search({
        query: query || undefined,
        genres: genre ? [genre] : undefined,
        actors: actor ? [actor] : undefined,
        directors: director ? [director] : undefined,
        yearFrom,
        yearTo,
        ratingFrom,
        language,
        semantic,
        naturalLanguage,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  // Relevance degenera al solo punteggio rating (metadataScore) quando non c'è una query testuale:
  // mostriamo il badge "match" solo quando esiste un vero segnale di ricerca (testo libero), per non
  // far passare un semplice browsing per un risultato di similarità.
  const isSearchActive = query.trim().length > 0;
  // Senza alcun filtro/query, "risultati" e "sfoglia il catalogo" mostrerebbero esattamente gli stessi film
  // nello stesso ordine (entrambi paginano il catalogo non filtrato): il carosello di navigazione libera ha
  // senso solo in questo stato "vuoto", altrimenti duplicherebbe la griglia dei risultati sotto.
  const hasAnyFilter =
    isSearchActive ||
    genre !== null ||
    yearFrom !== undefined ||
    yearTo !== undefined ||
    ratingFrom !== undefined ||
    actor.trim().length > 0 ||
    director.trim().length > 0 ||
    language !== undefined ||
    semantic ||
    naturalLanguage;

  function resetToFirstPage() {
    setPage(1);
  }

  function resetFilters() {
    setGenre(null);
    setYearFrom(undefined);
    setYearTo(undefined);
    setRatingFrom(undefined);
    setActor("");
    setDirector("");
    setLanguage(undefined);
    resetToFirstPage();
  }

  function runExample(text: string) {
    setQuery(text);
    setNaturalLanguage(true);
    resetToFirstPage();
  }

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Esplora &amp; Ricerca Semantica</h2>
          <p>Ricerca ibrida: full-text, filtri strutturati e similarità semantica sugli embedding.</p>
        </div>
      </div>

      {settings.carouselEnabled && !hasAnyFilter && <MovieCarousel />}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="panel-title">Motore di ricerca</div>
        <div className="search-bar" style={{ marginTop: "0.6rem" }}>
          <input
            type="search"
            placeholder="Cerca per titolo, trama, regista, attore o concetto semantico..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetToFirstPage();
            }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={semantic}
              onChange={(e) => {
                setSemantic(e.target.checked);
                resetToFirstPage();
              }}
            />
            Ricerca semantica AI
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={naturalLanguage}
              onChange={(e) => {
                setNaturalLanguage(e.target.checked);
                resetToFirstPage();
              }}
            />
            Interpreta linguaggio naturale
          </label>
        </div>

        <p className="muted" style={{ fontSize: 11, marginBottom: "0.4rem" }}>
          Prompt di esempio (linguaggio naturale):
        </p>
        <div className="facet-list" style={{ marginBottom: 0 }}>
          {NL_EXAMPLES.map((example) => (
            <button key={example} className="facet-chip" onClick={() => runExample(example)}>
              "{example}"
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="panel-title">Filtri parametrici</div>
        <div className="filter-grid" style={{ marginTop: "0.6rem" }}>
          <div className="filter-field">
            <label>Genere</label>
            <select
              value={genre ?? ""}
              onChange={(e) => {
                setGenre(e.target.value || null);
                resetToFirstPage();
              }}
            >
              <option value="">Tutti i generi</option>
              {data?.facets.genres.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.value} ({f.count})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Range anno</label>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <input
                type="number"
                placeholder="Da"
                value={yearFrom ?? ""}
                onChange={(e) => {
                  setYearFrom(e.target.value ? Number(e.target.value) : undefined);
                  resetToFirstPage();
                }}
              />
              <input
                type="number"
                placeholder="A"
                value={yearTo ?? ""}
                onChange={(e) => {
                  setYearTo(e.target.value ? Number(e.target.value) : undefined);
                  resetToFirstPage();
                }}
              />
            </div>
          </div>

          <div className="filter-field">
            <label>Rating minimo</label>
            <select
              value={ratingFrom ?? ""}
              onChange={(e) => {
                setRatingFrom(e.target.value ? Number(e.target.value) : undefined);
                resetToFirstPage();
              }}
            >
              <option value="">Qualsiasi</option>
              <option value="9">9+</option>
              <option value="8">8+</option>
              <option value="7">7+</option>
              <option value="6">6+</option>
            </select>
          </div>

          <div className="filter-field">
            <label>Attore</label>
            <input
              type="text"
              placeholder="Es. Tom Hanks"
              value={actor}
              onChange={(e) => {
                setActor(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>

          <div className="filter-field">
            <label>Regista</label>
            <input
              type="text"
              placeholder="Es. Christopher Nolan"
              value={director}
              onChange={(e) => {
                setDirector(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>

          <div className="filter-field">
            <label>Lingua</label>
            <select
              value={language ?? ""}
              onChange={(e) => {
                setLanguage(e.target.value || undefined);
                resetToFirstPage();
              }}
            >
              <option value="">Tutte le lingue</option>
              {data?.facets.languages.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.value} ({f.count})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Ordinamento</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SearchSort)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field filter-field--action">
            <button className="btn btn--ghost" onClick={resetFilters}>
              Reimposta filtri
            </button>
          </div>
        </div>
      </div>

      {isLoading && <p className="muted">Ricerca in corso...</p>}
      {isError && <p className="muted">Errore nella ricerca: {(error as Error).message}</p>}

      {data && (
        <div className="section-heading">
          <p className="muted">
            {data.total} film trovati {data.mode !== "structured" && `· modalità: ${data.mode}`}
          </p>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button className={view === "grid" ? "filter-chip" : "facet-chip"} onClick={() => setView("grid")}>
              Griglia
            </button>
            <button className={view === "list" ? "filter-chip" : "facet-chip"} onClick={() => setView("list")}>
              Lista
            </button>
          </div>
        </div>
      )}

      {data && data.results.length === 0 && <div className="panel empty-state">Nessun film trovato per questa ricerca.</div>}

      {view === "grid" && (
        <div className="grid grid--movies">
          {data?.results.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              matchScore={isSearchActive ? movie.similarity ?? movie.relevance : undefined}
            />
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="panel panel--tight">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titolo</th>
                <th>Anno</th>
                <th>Generi</th>
                <th>Rating</th>
                <th>Match</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.results.map((movie) => {
                const match = isSearchActive ? movie.similarity ?? movie.relevance : undefined;
                return (
                  <tr key={movie.id}>
                    <td>{movie.title}</td>
                    <td className="muted">{movie.year ?? "—"}</td>
                    <td className="muted">{movie.genres.slice(0, 3).join(", ")}</td>
                    <td>{movie.rating != null ? `★ ${movie.rating.toFixed(1)}` : "—"}</td>
                    <td>{match != null ? `${Math.round(match * 100)}%` : "—"}</td>
                    <td>
                      <Link className="btn btn--ghost btn--sm" to={`/movies/${movie.id}`}>
                        Dettagli
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Precedente
          </button>
          <span>
            Pagina {page} di {totalPages} &middot; {data.total} risultati
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Successiva
          </button>
        </div>
      )}
    </div>
  );
}
