import type { AppSettings } from "../../lib/settings";

/**
 * Tipo condiviso tra le due viste della Mappa Semantica 3D (orbitale WebGL e sfera CSS): un punto
 * rappresenta un cluster o un film, con le coordinate reali derivate dalla proiezione PCA degli embedding.
 * Isolato in un modulo senza dipendenze da three.js/@react-three, così la vista CSS (PointSphereGrid) non
 * si porta dietro l'intero bundle WebGL solo per condividere questo tipo e le preferenze di stile.
 */
export interface ScenePoint {
  id: number;
  position: [number, number, number];
  size: number;
  color: string;
  label: string;
  /** Riga secondaria nel tooltip — a livello cluster è il conteggio dei film membri. */
  subtitle?: string;
}

export const SPHERE_DENSITY_OPACITY: Record<AppSettings["sphereDensity"], number> = {
  leggera: 0.55,
  media: 0.78,
  piena: 1,
};

export const HALO_PRESETS: Record<AppSettings["haloIntensity"], { opacity: number; scale: number }> = {
  sottile: { opacity: 0.28, scale: 1.5 },
  normale: { opacity: 0.55, scale: 2.2 },
  intenso: { opacity: 0.8, scale: 3 },
};
