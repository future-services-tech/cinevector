import { Clock, Compass, Heart, Orbit, User } from "lucide-react";
import { clusters } from "../../data";
import { useFilters } from "../../state/FilterContext";
import { RangeSlider } from "../common/RangeSlider";
import { SidebarClusterItem } from "./SidebarClusterItem";

const NAV_ITEMS = [
  { label: "Esplora Galassia 3D", icon: Orbit, active: true },
  { label: "Generi & Cluster", icon: Compass, active: false },
  { label: "Registi & Autori", icon: User, active: false },
  { label: "Timeline Storica", icon: Clock, active: false },
  { label: "I Miei Preferiti", icon: Heart, active: false },
];

export function LeftSidebar() {
  const { activeClusterIds, toggleCluster, similarityThreshold, setSimilarityThreshold, yearRange, setYearRange } = useFilters();

  return (
    <aside data-purpose="left-navigation" className="scrollbar-thin flex w-72 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/5 bg-space-850/60 p-4">
      <div className="space-y-6">
        <div>
          <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Esplorazione</div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-200" : "text-slate-400"
                }`}
              >
                <Icon size={16} />
                {label}
              </div>
            ))}
          </nav>
        </div>

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
                min={1970}
                max={yearRange[1]}
                onChange={(e) => setYearRange([Number(e.target.value), yearRange[1]])}
                className="glass-pill w-full rounded-md px-2 py-1.5 text-center font-mono text-[11px] text-slate-200 outline-none"
              />
              <span className="text-slate-500">—</span>
              <input
                type="number"
                value={yearRange[1]}
                min={yearRange[0]}
                max={2025}
                onChange={(e) => setYearRange([yearRange[0], Number(e.target.value)])}
                className="glass-pill w-full rounded-md px-2 py-1.5 text-center font-mono text-[11px] text-slate-200 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card mt-6 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-400">
        <span className="mb-1 block font-semibold text-cyan-300">Cluster Semantico AI</span>
        I film vicini nello spazio 3D condividono trope narrativi, stili visivi e filosofie tematiche simili.
      </div>
    </aside>
  );
}
