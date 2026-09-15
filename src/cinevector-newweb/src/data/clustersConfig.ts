import type { ClusterId } from "../types/movie";

export interface ClusterConfig {
  id: ClusterId;
  name: string;
  color: string;
}

/** I primi 5 sono i cluster/colori esatti dai mockup; gli ultimi 3 sono nuovi, aggiunti per
 * coprire "vario genere" come richiesto (non presenti nei file HTML di riferimento). */
export const CLUSTERS_CONFIG: ClusterConfig[] = [
  { id: "scifi", name: "Fantascienza", color: "#00f2fe" },
  { id: "cyberpunk", name: "Cyberpunk & Cult", color: "#c084fc" },
  { id: "thriller", name: "Thriller & Noir", color: "#3b82f6" },
  { id: "drama", name: "Drammatico", color: "#fbbf24" },
  { id: "animation", name: "Animazione & Anime", color: "#34d399" },
  { id: "action", name: "Azione", color: "#f97316" },
  { id: "comedy", name: "Commedia", color: "#facc15" },
  { id: "horror", name: "Horror", color: "#ef4444" },
];

/** Quota relativa di film per cluster (non uniforme, per una distribuzione plausibile). */
export const CLUSTER_WEIGHTS: Record<ClusterId, number> = {
  drama: 1.3,
  scifi: 1.15,
  thriller: 1.1,
  action: 1.0,
  animation: 0.75,
  comedy: 0.9,
  cyberpunk: 0.65,
  horror: 0.7,
};

export function getClusterConfig(id: ClusterId): ClusterConfig {
  const found = CLUSTERS_CONFIG.find((c) => c.id === id);
  if (!found) throw new Error(`Cluster sconosciuto: ${id}`);
  return found;
}
