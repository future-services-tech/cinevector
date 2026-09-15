import { Heart, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClusterById, getMovieById, getTopNeighbors } from "../../data";
import { useFilters } from "../../state/FilterContext";
import { useSelection } from "../../state/SelectionContext";
import { useWatchlist } from "../../state/WatchlistContext";
import { Chip } from "../common/Chip";

export function RightDetailPanel() {
  const { selectedId, select } = useSelection();
  const { isolateCluster } = useFilters();
  const { isSaved, toggle } = useWatchlist();
  const navigate = useNavigate();

  const movie = selectedId ? getMovieById(selectedId) : null;
  const cluster = movie ? getClusterById(movie.clusterId) : null;
  const neighbors = movie ? getTopNeighbors(movie.id, 4) : [];

  return (
    <aside data-purpose="right-details-panel" className="scrollbar-thin flex w-84 shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-space-850/60 md:w-96">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">◆ Dettaglio Nodo Selezionato</span>
        {movie && <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] text-cyan-300">{movie.vectorId}</span>}
      </div>

      {!movie && (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-500">
          Seleziona un nodo sulla sfera per esplorarne i dettagli semantici.
        </div>
      )}

      {movie && cluster && (
        <div className="space-y-5 p-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip>{cluster.name}</Chip>
              <Chip>{movie.year}</Chip>
              <Chip>★ {movie.rating.toFixed(1)}</Chip>
            </div>
            <h2 className="text-xl font-extrabold text-white">{movie.title}</h2>
            <p className="text-xs text-slate-400">Regia di {movie.director}</p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Affinità Semantica Media</span>
              <span className="font-mono font-bold text-cyan-300">{movie.affinity.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-space-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${movie.affinity}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Sinossi Semantica</div>
            <p className="text-xs leading-relaxed text-slate-300">
              Film del cluster {cluster.name}, con affinità semantica {movie.affinity.toFixed(1)}% rispetto ai nodi vicini più rilevanti.
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tag Concettuali AI</div>
            <div className="flex flex-wrap gap-1.5">
              {movie.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          </div>

          {neighbors.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Nodi Più Vicini</span>
                <span>{neighbors.length} collegamenti</span>
              </div>
              <div className="space-y-1.5">
                {neighbors.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => select(n.id)}
                    className="glass-pill glass-card-hover flex w-full items-center justify-between rounded-lg px-3 py-2 text-left"
                  >
                    <span className="truncate text-xs text-slate-200">{n.title}</span>
                    <span className="ml-2 shrink-0 font-mono text-[11px] text-cyan-300">{n.matchPercent}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-neon-cyan"
            >
              Apri Scheda Completa
            </button>
            <button
              onClick={() => isolateCluster(movie.clusterId)}
              className="glass-pill flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold text-slate-200 hover:text-cyan-200"
            >
              <Layers size={14} /> Isola questo sub-cluster
            </button>
            <button
              onClick={() => toggle(movie.id)}
              className={`glass-pill flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold ${
                isSaved(movie.id) ? "text-pink-300" : "text-slate-200 hover:text-pink-200"
              }`}
            >
              <Heart size={14} fill={isSaved(movie.id) ? "currentColor" : "none"} />
              {isSaved(movie.id) ? "Salvato nella Watchlist" : "Salva nella Watchlist Semantica"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
