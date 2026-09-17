import { Film } from "lucide-react";
import { useSettings } from "../../state/SettingsContext";

export interface PosterCardData {
  id: number | string;
  title: string;
  year?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  genres?: string[];
  matchScore?: number | null;
}

/** Card poster riusabile — carosello "Rete" e pagina "Catalogo". Nessun <Link>: il chiamante decide cosa fare
 * al click (di solito aprire il modal di dettaglio in overlay, senza toccare l'URL). */
export function PosterCard({ movie, onClick }: { movie: PosterCardData; onClick?: () => void }) {
  const { settings } = useSettings();
  const hoverEnabled = settings.animationsEnabled && settings.cardHoverEffects;
  return (
    <button
      onClick={onClick}
      className={`glass-card group w-full overflow-hidden rounded-xl text-left transition ${hoverEnabled ? "glass-card-hover" : ""}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-space-950">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-300 ${hoverEnabled ? "group-hover:scale-105" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">
            <Film size={28} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-1.5">
          {movie.matchScore != null ? (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200 backdrop-blur-sm">
              {Math.round(movie.matchScore * 100)}%
            </span>
          ) : (
            <span />
          )}
          {movie.rating != null && (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-200 backdrop-blur-sm">
              ★ {movie.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-ink">{movie.title}</p>
        <p className="truncate text-[10px] text-slate-400">
          {movie.year ?? "—"}
          {movie.genres && movie.genres.length > 0 ? ` · ${movie.genres.slice(0, 2).join(", ")}` : ""}
        </p>
      </div>
    </button>
  );
}
