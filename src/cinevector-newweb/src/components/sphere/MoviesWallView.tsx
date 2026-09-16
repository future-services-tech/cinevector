import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMovies } from "../../api/movies";
import { PosterCard } from "../common/PosterCard";
import { MovieDetailModal } from "../modal/MovieDetailModal";

const ROWS = 4;
const MOVIES_PER_ROW = 15;
const ROW_DURATIONS = [55, 70, 60, 80]; // secondi — velocità leggermente diverse per riga, più naturale

/** Sostituisce il bottone "Rete" (mai stato collegato a un grafo di rete): un "muro" di poster reali su più
 * righe in scorrimento continuo (direzione alternata), la stessa idea del vecchio carosello di cinevector-web
 * ma con animazione CSS invece di paginazione JS — più fluido, nessun avanzamento a scatti. */
export function MoviesWallView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["movies-wall"],
    queryFn: () => getMovies(1, ROWS * MOVIES_PER_ROW),
  });

  const movies = data?.items ?? [];
  const rows = Array.from({ length: ROWS }, (_, i) => movies.slice(i * MOVIES_PER_ROW, (i + 1) * MOVIES_PER_ROW)).filter((row) => row.length > 0);

  return (
    <div className="flex h-full flex-col overflow-hidden p-6 pt-24">
      <div className="mb-4 shrink-0">
        <h2 className="text-sm font-bold text-white">Catalogo in Movimento</h2>
        <p className="text-xs text-slate-400">
          Sfoglia il catalogo reale in scorrimento continuo — passa il mouse su una riga per fermarla, clicca un film per il dettaglio.
        </p>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Caricamento catalogo...</p>}

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto">
        {rows.map((row, i) => (
          <div key={i} className="group overflow-hidden">
            <div
              className={`marquee-row flex w-max gap-3 group-hover:[animation-play-state:paused] ${i % 2 === 1 ? "marquee-row--reverse" : ""}`}
              style={{ animationDuration: `${ROW_DURATIONS[i % ROW_DURATIONS.length]}s` }}
            >
              {[...row, ...row].map((movie, j) => (
                <div key={`${movie.id}-${j}`} className="w-28 shrink-0">
                  <PosterCard movie={movie} onClick={() => setSelectedId(String(movie.id))} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedId && <MovieDetailModal movieId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
