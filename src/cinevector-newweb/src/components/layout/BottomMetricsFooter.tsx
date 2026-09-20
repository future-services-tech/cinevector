import { useNavigate } from "react-router-dom";
import { getAverageRating, getDailyPick, getDensestCluster } from "../../lib/movieSelectors";
import { useMovieData } from "../../state/MovieDataContext";

export function BottomMetricsFooter() {
  const navigate = useNavigate();
  const { movies, clusters } = useMovieData();
  const densest = getDensestCluster(clusters);
  const avgRating = getAverageRating(movies);
  const dailyPick = getDailyPick(movies);

  return (
    <footer data-purpose="footer-metrics" className="glass-card z-20 flex h-12 shrink-0 items-center justify-between gap-4 overflow-x-auto border-t border-white/5 px-5 text-[11px] text-slate-400">
      {densest && (
        <span>
          <span className="text-slate-500">Cluster Più Denso:</span>{" "}
          <span className="font-semibold text-cyan-300">
            {densest.name} ({densest.count} nodi)
          </span>
        </span>
      )}
      <span>
        <span className="text-slate-500">Valutazione Media Cluster:</span>{" "}
        <span className="font-mono font-semibold text-amber-300">{avgRating.toFixed(2)}</span>
      </span>
      {dailyPick && (
        <button onClick={() => navigate(`/movie/${dailyPick.id}`)} className="hidden truncate hover:text-cyan-200 sm:block">
          <span className="text-slate-500">Consiglio del Giorno:</span> <span className="font-semibold">{dailyPick.title}</span>
        </button>
      )}
      <span className="hidden font-mono md:block">
        Motore Vettoriale: <span className="text-slate-300">pgvector HNSW</span>
      </span>
      <span className="hidden font-mono lg:flex lg:items-center lg:gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> API Live
      </span>
    </footer>
  );
}
