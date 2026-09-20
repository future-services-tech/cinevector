import { Activity, Bot, ChevronDown, Database, Orbit, X } from "lucide-react";
import { type ComponentType, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFilters } from "../../state/FilterContext";
import { useLayout } from "../../state/LayoutContext";
import { useMovieData } from "../../state/MovieDataContext";
import { useSettings } from "../../state/SettingsContext";
import { RangeSlider } from "../common/RangeSlider";
import { SidebarClusterItem } from "./SidebarClusterItem";

interface NavItem {
  label: string;
  icon: ComponentType<{ size?: number }>;
  to: string | null;
}

// Catalogo e Musica sono raggiungibili dal menu "Filtri" nell'header (vedi TopHeader.tsx) — qui resta solo la
// sfera. Generi & Cluster / Registi & Autori / Timeline Storica / I Miei Preferiti non portano ancora a nulla:
// nascoste finché non verranno davvero costruite in un intervento dedicato.
const EXPLORE_ITEMS: NavItem[] = [{ label: "Esplora Galassia 3D", icon: Orbit, to: "/" }];

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
  const { activeClusterIds, toggleCluster, resetClusters, similarityThreshold, setSimilarityThreshold, yearRange, setYearRange } = useFilters();
  const { settings } = useSettings();
  const { sidebarOpen, closeSidebar } = useLayout();
  const [clusterPanelOpen, setClusterPanelOpen] = useState(settings.clusterPanelDefaultOpen);
  const location = useLocation();
  const navigate = useNavigate();

  const isSphereRoute = location.pathname === "/" || location.pathname.startsWith("/movie/");

  function goTo(to: string | null) {
    if (!to) return;
    navigate(to);
    closeSidebar();
  }

  return (
    <>
      {/* Sotto lg la sidebar diventa un drawer fuori schermo (fixed + translate-x): questo backdrop la chiude
          al tocco fuori. Da lg in su resta sempre in flusso normale, invisibile e non cliccabile. */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}
      <aside
        data-purpose="left-navigation"
        className={`scrollbar-thin fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/5 bg-space-850 p-4 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:bg-space-850/60 lg:transition-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="mb-1 flex items-center justify-between lg:hidden">
            <span className="text-sm font-bold text-ink">Menu</span>
            <button onClick={closeSidebar} aria-label="Chiudi menu" className="glass-pill rounded-full p-1.5 text-slate-300 hover:text-ink">
              <X size={15} />
            </button>
          </div>

          <div>
            <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Esplorazione</div>
            <nav className="space-y-1">
              {EXPLORE_ITEMS.map((item) => (
                <NavRow key={item.label} item={item} active={item.to === location.pathname} onClick={() => goTo(item.to)} />
              ))}
            </nav>
          </div>

          <div>
            <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Operatività</div>
            <nav className="space-y-1">
              {OPERATIONS_ITEMS.map((item) => (
                <NavRow key={item.label} item={item} active={item.to === location.pathname} onClick={() => goTo(item.to)} />
              ))}
            </nav>
          </div>

          {isSphereRoute && (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between px-1">
                  <button
                    onClick={() => setClusterPanelOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                  >
                    <span>Cluster Tematici</span>
                    <ChevronDown size={13} className={`transition-transform ${clusterPanelOpen ? "rotate-180" : ""}`} />
                  </button>
                  {clusters.length > 0 && activeClusterIds.size < clusters.length && (
                    <button
                      onClick={resetClusters}
                      className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-500/20"
                      title="Rimuove l'isolamento e riattiva tutti i cluster sulla sfera"
                    >
                      Mostra tutti
                    </button>
                  )}
                </div>
                <div className={`space-y-1.5 overflow-hidden transition-[max-height] duration-200 ${clusterPanelOpen ? "max-h-[1000px]" : "max-h-0"}`}>
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
    </>
  );
}
