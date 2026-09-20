import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Film, LayoutGrid, List, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { searchMovies, type SearchSort } from "../api/search";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { TopHeader } from "../components/layout/TopHeader";
import { MovieDetailModal } from "../components/modal/MovieDetailModal";
import { PosterCard } from "../components/common/PosterCard";
import { pushNotification } from "../lib/notificationStore";

const PAGE_SIZE = 20;

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

export function CatalogPage() {
  const [query, setQuery] = useState("");
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-search", query, genre, yearFrom, yearTo, ratingFrom, actor, director, language, semantic, naturalLanguage, sort, page],
    queryFn: () =>
      searchMovies({
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
  const isSearchActive = query.trim().length > 0;

  // Notifica solo per ricerche testuali effettive (non per il semplice cambio pagina/filtro senza testo),
  // altrimenti la campanella si riempirebbe di "ricerca completata" ad ogni interazione con i filtri.
  useEffect(() => {
    if (!data || !isSearchActive) return;
    pushNotification("success", `Ricerca completata: ${data.total} film trovati per "${query}".`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section className="scrollbar-thin flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-neon-cyan">
              <Film size={16} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink">Catalogo</h1>
              <p className="text-xs text-slate-400">Ricerca ibrida: full-text, filtri strutturati combinabili e similarità semantica sugli embedding.</p>
            </div>
          </div>

          <div className="glass-card mb-4 space-y-3 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Motore di ricerca</div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="glass-pill flex min-w-[260px] flex-1 items-center gap-2 rounded-full px-4 py-2">
                <Search size={14} className="text-cyan-300" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetToFirstPage();
                  }}
                  placeholder="Cerca per titolo, trama, regista, attore o concetto semantico..."
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={semantic}
                  onChange={(e) => {
                    setSemantic(e.target.checked);
                    resetToFirstPage();
                  }}
                  className="accent-cyan-400"
                />
                Ricerca semantica AI
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={naturalLanguage}
                  onChange={(e) => {
                    setNaturalLanguage(e.target.checked);
                    resetToFirstPage();
                  }}
                  className="accent-cyan-400"
                />
                Interpreta linguaggio naturale
              </label>
            </div>

            <p className="text-[11px] text-slate-500">Prompt di esempio (linguaggio naturale):</p>
            <div className="flex flex-wrap gap-1.5">
              {NL_EXAMPLES.map((example) => (
                <button key={example} onClick={() => runExample(example)} className="glass-pill rounded-full px-2.5 py-1 text-[11px] text-slate-300 hover:text-cyan-200">
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card mb-4 space-y-3 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Filtri combinabili</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Genere</label>
                <select
                  value={genre ?? ""}
                  onChange={(e) => {
                    setGenre(e.target.value || null);
                    resetToFirstPage();
                  }}
                  className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="" className="bg-space-900">Tutti i generi</option>
                  {data?.facets.genres.map((f) => (
                    <option key={f.value} value={f.value} className="bg-space-900">
                      {f.value} ({f.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Range anno</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    placeholder="Da"
                    value={yearFrom ?? ""}
                    onChange={(e) => {
                      setYearFrom(e.target.value ? Number(e.target.value) : undefined);
                      resetToFirstPage();
                    }}
                    className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="A"
                    value={yearTo ?? ""}
                    onChange={(e) => {
                      setYearTo(e.target.value ? Number(e.target.value) : undefined);
                      resetToFirstPage();
                    }}
                    className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rating minimo</label>
                <select
                  value={ratingFrom ?? ""}
                  onChange={(e) => {
                    setRatingFrom(e.target.value ? Number(e.target.value) : undefined);
                    resetToFirstPage();
                  }}
                  className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="" className="bg-space-900">Qualsiasi</option>
                  {[9, 8, 7, 6].map((r) => (
                    <option key={r} value={r} className="bg-space-900">{r}+</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Attore</label>
                <input
                  type="text"
                  placeholder="Es. Tom Hanks"
                  value={actor}
                  onChange={(e) => {
                    setActor(e.target.value);
                    resetToFirstPage();
                  }}
                  className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Regista</label>
                <input
                  type="text"
                  placeholder="Es. Christopher Nolan"
                  value={director}
                  onChange={(e) => {
                    setDirector(e.target.value);
                    resetToFirstPage();
                  }}
                  className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Lingua</label>
                <select
                  value={language ?? ""}
                  onChange={(e) => {
                    setLanguage(e.target.value || undefined);
                    resetToFirstPage();
                  }}
                  className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none"
                >
                  <option value="" className="bg-space-900">Tutte le lingue</option>
                  {data?.facets.languages.map((f) => (
                    <option key={f.value} value={f.value} className="bg-space-900">
                      {f.value} ({f.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ordinamento</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SearchSort)}
                  className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs text-slate-100 outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-space-900">{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button onClick={resetFilters} className="glass-pill w-full rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-200 hover:text-ink">
                  Reimposta filtri
                </button>
              </div>
            </div>
          </div>

          {isLoading && <p className="text-xs text-slate-500">Ricerca in corso...</p>}
          {isError && <p className="text-xs text-rose-400">Errore nella ricerca.</p>}

          {data && (
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {data.total} film trovati {data.mode !== "structured" && `· modalità: ${data.mode}`}
              </p>
              <div className="glass-card flex gap-1 rounded-lg p-1">
                <button onClick={() => setView("grid")} className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${view === "grid" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-cyan-200"}`}>
                  <LayoutGrid size={12} /> Griglia
                </button>
                <button onClick={() => setView("list")} className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${view === "list" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-cyan-200"}`}>
                  <List size={12} /> Lista
                </button>
              </div>
            </div>
          )}

          {data && data.results.length === 0 && <p className="text-xs text-slate-500">Nessun film trovato per questa ricerca.</p>}

          {view === "grid" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {data?.results.map((movie) => (
                <PosterCard
                  key={movie.id}
                  movie={{ ...movie, matchScore: isSearchActive ? (movie.similarity ?? movie.relevance) : undefined }}
                  onClick={() => setSelectedId(String(movie.id))}
                />
              ))}
            </div>
          )}

          {view === "list" && (
            <div className="glass-card rounded-xl p-4">
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-2 py-2">Titolo</th>
                      <th className="px-2 py-2">Anno</th>
                      <th className="px-2 py-2">Generi</th>
                      <th className="px-2 py-2">Rating</th>
                      <th className="px-2 py-2">Match</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data?.results.map((movie) => {
                      const match = isSearchActive ? (movie.similarity ?? movie.relevance) : undefined;
                      return (
                        <tr key={movie.id} className="border-b border-white/5">
                          <td className="px-2 py-2.5 font-semibold text-slate-100">{movie.title}</td>
                          <td className="px-2 py-2.5 text-slate-400">{movie.year ?? "—"}</td>
                          <td className="px-2 py-2.5 text-slate-400">{movie.genres.slice(0, 3).join(", ")}</td>
                          <td className="px-2 py-2.5">{movie.rating != null ? `★ ${movie.rating.toFixed(1)}` : "—"}</td>
                          <td className="px-2 py-2.5">{match != null ? `${Math.round(match * 100)}%` : "—"}</td>
                          <td className="px-2 py-2.5">
                            <button onClick={() => setSelectedId(String(movie.id))} className="glass-pill rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-cyan-200">
                              Dettagli
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data && data.total > 0 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-xs">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="glass-pill rounded-lg px-3 py-1.5 font-semibold text-slate-200 hover:text-cyan-200 disabled:opacity-30">
                Precedente
              </button>
              <span className="text-slate-400">
                Pagina {page} di {totalPages} · {data.total} risultati
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="glass-pill rounded-lg px-3 py-1.5 font-semibold text-slate-200 hover:text-cyan-200 disabled:opacity-30">
                Successiva
              </button>
            </div>
          )}
        </section>
      </main>

      {selectedId && <MovieDetailModal movieId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
