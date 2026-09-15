import { Bell, Settings, SlidersHorizontal, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCount } from "../../lib/format";
import { useMovieData } from "../../state/MovieDataContext";
import { useSelection } from "../../state/SelectionContext";
import { SearchBar } from "../common/SearchBar";

export function TopHeader() {
  const { select } = useSelection();
  const navigate = useNavigate();
  const { movies } = useMovieData();

  return (
    <header data-purpose="main-header" className="glass-card z-20 flex h-16 shrink-0 items-center gap-4 border-b border-white/5 px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-neon-cyan">
          <Sparkles size={18} className="text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wide text-white">CineSphere 3D</span>
            <span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300">
              V1.0 VECTOR
            </span>
          </div>
        </div>
      </div>

      <SearchBar
        onSelect={(result) => {
          const id = String(result.id);
          select(id);
          navigate(`/movie/${id}`);
        }}
      />

      <button className="glass-pill hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs text-slate-300 hover:text-cyan-200 sm:flex">
        <SlidersHorizontal size={14} />
        Filtri
      </button>

      <span className="glass-pill hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-mono text-emerald-300 md:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        {formatCount(movies.length)} Film Mappati
      </span>

      <div className="flex items-center gap-2.5 text-slate-400">
        <Bell size={18} className="hidden cursor-pointer hover:text-cyan-300 sm:block" />
        <Settings size={18} className="hidden cursor-pointer hover:text-cyan-300 sm:block" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-xs font-bold text-white">
          CV
        </div>
      </div>
    </header>
  );
}
