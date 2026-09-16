import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getMovies } from "../../api/movies";
import { useSettings } from "../../state/SettingsContext";
import { PosterCard } from "../common/PosterCard";
import { MovieDetailModal } from "../modal/MovieDetailModal";

const ROWS = 4;
const MOVIES_PER_ROW = 15;
const ROW_SPEED_OFFSETS = [0, 15, 5, 25]; // secondi — variazione per riga rispetto alla velocità base scelta nelle Impostazioni

/** Sostituisce il bottone "Rete" (mai stato collegato a un grafo di rete): un "muro" di poster reali su più
 * righe in scorrimento continuo (direzione alternata), la stessa idea del vecchio carosello di cinevector-web
 * ma con animazione CSS invece di paginazione JS — più fluido, nessun avanzamento a scatti. */
export function MoviesWallView() {
  const { settings } = useSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["movies-wall"],
    queryFn: () => getMovies(1, ROWS * MOVIES_PER_ROW),
  });

  const movies = data?.items ?? [];
  const rows = Array.from({ length: ROWS }, (_, i) => movies.slice(i * MOVIES_PER_ROW, (i + 1) * MOVIES_PER_ROW)).filter((row) => row.length > 0);

  return (
    <div className="flex h-full flex-col overflow-hidden p-6 pt-24">
      <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Catalogo in Movimento</h2>
          <p className="text-xs text-slate-400">
            Sfoglia il catalogo reale in scorrimento continuo — passa il mouse su una riga per fermarla, clicca un film per il dettaglio.
          </p>
        </div>
        <Link to="/catalogo" className="glass-pill flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-cyan-200">
          Apri il catalogo completo <ArrowRight size={12} />
        </Link>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Caricamento catalogo...</p>}

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto">
        {settings.carouselEnabled
          ? rows.map((row, i) => (
              <div key={i} className="group overflow-hidden">
                <div
                  className={`marquee-row flex w-max gap-3 group-hover:[animation-play-state:paused] ${i % 2 === 1 ? "marquee-row--reverse" : ""}`}
                  style={{ animationDuration: `${settings.carouselSpeedSec + ROW_SPEED_OFFSETS[i % ROW_SPEED_OFFSETS.length]}s` }}
                >
                  {[...row, ...row].map((movie, j) => (
                    <div key={`${movie.id}-${j}`} className="w-28 shrink-0">
                      <PosterCard movie={movie} onClick={() => setSelectedId(String(movie.id))} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          : rows.map((row, i) => (
              <div key={i} className="flex flex-wrap gap-3">
                {row.map((movie) => (
                  <div key={movie.id} className="w-28 shrink-0">
                    <PosterCard movie={movie} onClick={() => setSelectedId(String(movie.id))} />
                  </div>
                ))}
              </div>
            ))}
      </div>

      {selectedId && <MovieDetailModal movieId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
