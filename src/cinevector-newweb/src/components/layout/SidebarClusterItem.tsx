import type { MovieCluster } from "../../types/movie";
import { formatCount } from "../../lib/format";

export function SidebarClusterItem({ cluster, active, onToggle }: { cluster: MovieCluster; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`glass-pill glass-card-hover flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
        active ? "" : "opacity-40"
      }`}
    >
      <span className="flex items-center gap-2 text-xs text-slate-200">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: cluster.color, boxShadow: `0 0 8px ${cluster.color}` }}
        />
        {cluster.name}
      </span>
      <span className="font-mono text-[11px] text-slate-400">{formatCount(cluster.count)}</span>
    </button>
  );
}
