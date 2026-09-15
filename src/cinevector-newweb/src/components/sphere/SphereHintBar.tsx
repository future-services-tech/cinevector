import { clusters } from "../../data";

export function SphereHintBar() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-end justify-between gap-3">
      <span className="glass-card rounded-lg px-3 py-1.5 text-[11px] text-slate-400">🖱 Trascina per ruotare · Scroll per zoom</span>
      <div className="glass-card flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-1.5">
        {clusters.map((cluster) => (
          <span key={cluster.id} className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cluster.color }} />
            {cluster.name}
          </span>
        ))}
      </div>
    </div>
  );
}
