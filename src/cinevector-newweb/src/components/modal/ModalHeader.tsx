import { Film, X } from "lucide-react";
import type { MovieDetail } from "../../types/movie";
import { Badge } from "../common/Badge";

export function ModalHeader({ movie, onClose }: { movie: MovieDetail; onClose: () => void }) {
  return (
    <div className="glass-card sticky top-0 z-20 flex items-center justify-between gap-4 rounded-t-2xl border-b border-white/5 px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
          <Film size={16} className="text-slate-950" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="modalMovieTitle" className="truncate text-lg font-bold tracking-tight text-ink">
              {movie.title}
            </h2>
            <Badge tone="cyan">{movie.clusterLabel}</Badge>
            {movie.qualityBadges.map((badge) => (
              <Badge key={badge}>{badge}</Badge>
            ))}
            <Badge tone="amber">★ {movie.rating.toFixed(1)}/10</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            Regia di {movie.director} · {movie.year || "anno sconosciuto"} · {movie.runtimeMinutes} min
          </p>
        </div>
      </div>
      <button onClick={onClose} aria-label="Chiudi" className="glass-pill shrink-0 rounded-full p-2 text-slate-300 hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}
