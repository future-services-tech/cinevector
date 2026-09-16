import { Activity, Bot, Clock, Compass, Database, Film, Heart, Music, Orbit, User } from "lucide-react";
import type { ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFilters } from "../../state/FilterContext";
import { useMovieData } from "../../state/MovieDataContext";
import { RangeSlider } from "../common/RangeSlider";
import { SidebarClusterItem } from "./SidebarClusterItem";

interface NavItem {
  label: string;
  icon: ComponentType<{ size?: number }>;
  to: string | null;
}

const EXPLORE_ITEMS: NavItem[] = [
  { label: "Esplora Galassia 3D", icon: Orbit, to: "/" },
  { label: "Catalogo", icon: Film, to: "/catalogo" },
  { label: "Musica", icon: Music, to: "/music" },
  { label: "Generi & Cluster", icon: Compass, to: null },
  { label: "Registi & Autori", icon: User, to: null },
  { label: "Timeline Storica", icon: Clock, to: null },
  { label: "I Miei Preferiti", icon: Heart, to: null },
];

const OPERATIONS_ITEMS: NavItem[] = [
  { label: "Sorgenti", icon: Database, to: "/sources" },
  { label: "Crawler & Sync", icon: Bot, to: "/crawler" },
  { label: "Metriche & Log", icon: Activity, to: "/metrics" },
];

function NavRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const clickable = item.to !== null;
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-200"
          : clickable
            ? "cursor-pointer text-slate-400 hover:bg-white/5 hover:text-slate-200"
            : "text-slate-600"
      }`}
    >
      <Icon size={16} />
      {item.label}
    </div>
  );
}

export function LeftSidebar() {
  const { clusters } = useMovieData();
  const { activeClusterIds, toggleCluster, similarityThreshold, setSimilarityThreshold, yearRange, setYearRange } = useFilters();
  const location = useLocation();
  const navigate = useNavigate();

  const isSphereRoute = location.pathname === "/" || location.pathname.startsWith("/movie/");

  return (
    <aside data-purpose="left-navigation" className="scrollbar-thin flex w-72 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/5 bg-space-850/60 p-4">
      <div className="space-y-6">
        <div>
          <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Esplorazione</div>
          <nav className="space-y-1">
            {EXPLORE_ITEMS.map((item) => (
              <NavRow key={item.label} item={item} active={item.to === location.pathname} onClick={() => item.to && navigate(item.to)} />
            ))}
          </nav>
        </div>

        <div>
          <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Operatività</div>
          <nav className="space-y-1">
            {OPERATIONS_ITEMS.map((item) => (
              <NavRow key={item.label} item={item} active={item.to === location.pathname} onClick={() => item.to && navigate(item.to)} />
            ))}
          </nav>
        </div>

        {isSphereRoute && (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cluster Tematici</span>
              </div>
              <div className="space-y-1.5">
                {clusters.map((cluster) => (
                  <SidebarClusterItem
                    key={cluster.id}
                    cluster={cluster}
                    active={activeClusterIds.has(cluster.id)}
                    onToggle={() => toggleCluster(cluster.id)}
                  />
                ))}
              </div>
            </div>

            <div className="glass-card space-y-4 rounded-xl p-3.5">
              <RangeSlider label="Soglia Similarità Vettoriale" value={similarityThreshold} min={0} max={100} suffix="%" onChange={setSimilarityThreshold} />
              <div>
                <div className="mb-2 text-[11px] font-medium text-slate-300">Arco Temporale</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={yearRange[0]}
                    min={1900}
                    max={yearRange[1]}
                    onChange={(e) => setYearRange([Number(e.target.value), yearRange[1]])}
                    className="glass-pill w-full rounded-md px-2 py-1.5 text-center font-mono text-[11px] text-slate-200 outline-none"
                  />
                  <span className="text-slate-500">—</span>
                  <input
                    type="number"
                    value={yearRange[1]}
                    min={yearRange[0]}
                    max={new Date().getFullYear()}
                    onChange={(e) => setYearRange([yearRange[0], Number(e.target.value)])}
                    className="glass-pill w-full rounded-md px-2 py-1.5 text-center font-mono text-[11px] text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="glass-card mt-6 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-400">
        <span className="mb-1 block font-semibold text-cyan-300">Cluster Semantico AI</span>
        I film vicini nello spazio 3D condividono trope narrativi, stili visivi e filosofie tematiche simili.
      </div>
    </aside>
  );
}
