import { Html } from "@react-three/drei";
import type { MovieNode } from "../../types/movie";
import { getClusterConfig } from "../../data/clustersConfig";
import { SPHERE_RADIUS } from "../../lib/three-helpers";

/** Pillola fluttuante titolo + affinità, ancorata alla posizione 3D del nodo in hover — drei si occupa
 * di proiettare/nascondere l'elemento HTML in base alla posizione in schermo (occlude gestisce il caso
 * "dietro la sfera" in modo approssimato mostrando/nascondendo l'opacità). */
export function NodeTooltip({ node }: { node: MovieNode | null }) {
  if (!node) return null;
  const position = node.position.map((v) => v * SPHERE_RADIUS) as [number, number, number];
  const color = getClusterConfig(node.clusterId).color;

  return (
    <Html position={position} center distanceFactor={4.2} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
      <div
        className="glass-card whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] text-white"
        style={{ border: `1px solid ${color}88`, boxShadow: `0 0 16px ${color}33` }}
      >
        <div className="font-bold">{node.title}</div>
        <div className="text-[10px] text-slate-400">
          {node.director} · {node.year} · <span style={{ color }}>{node.affinity.toFixed(1)}%</span>
        </div>
      </div>
    </Html>
  );
}
