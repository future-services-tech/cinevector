import { Html } from "@react-three/drei";
import { SPHERE_RADIUS } from "../../lib/three-helpers";
import type { MovieNode } from "../../types/movie";

/** Pillola fluttuante titolo + affinità, ancorata alla posizione 3D del nodo in hover — drei si occupa
 * di proiettare/nascondere l'elemento HTML in base alla posizione in schermo. */
export function NodeTooltip({ node }: { node: MovieNode | null }) {
  if (!node) return null;
  const position = node.position.map((v) => v * SPHERE_RADIUS) as [number, number, number];

  return (
    <Html position={position} center distanceFactor={4.2} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
      <div
        className="glass-card whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] text-ink"
        style={{ border: `1px solid ${node.color}88`, boxShadow: `0 0 16px ${node.color}33` }}
      >
        <div className="font-bold">{node.title}</div>
        <div className="text-[10px] text-slate-400">
          {node.year || "—"} · {node.tags[0] ?? node.clusterLabel} · <span style={{ color: node.color }}>{node.affinity.toFixed(1)}%</span>
        </div>
      </div>
    </Html>
  );
}
