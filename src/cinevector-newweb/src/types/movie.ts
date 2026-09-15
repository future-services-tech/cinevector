export type ClusterId =
  | "scifi"
  | "cyberpunk"
  | "thriller"
  | "drama"
  | "animation"
  | "action"
  | "comedy"
  | "horror";

export interface MovieCluster {
  id: ClusterId;
  name: string;
  color: string;
  count: number;
}

/** Campi "leggeri": alimentano la sfera 3D, una istanza per ciascuno dei ~1000 film. */
export interface MovieNode {
  id: string;
  vectorId: string;
  title: string;
  year: number;
  director: string;
  rating: number;
  clusterId: ClusterId;
  affinity: number;
  tags: string[];
  isKey: boolean;
  size: number;
  position: [number, number, number];
}

export interface MovieLink {
  source: string;
  target: string;
  affinity: number;
}

export type RoleType = "principale" | "supporto" | "olografica";

export interface CastMember {
  name: string;
  role: string;
  roleType: RoleType;
  gradientFrom: string;
  gradientTo: string;
  initials: string;
}

export interface SoundtrackTrack {
  id: string;
  num: number;
  title: string;
  artist: string;
  duration: string;
  totalSec: number;
  styleTag?: string;
}

export interface MovieCredits {
  director: string;
  cinematography: string;
  cinematographyAward?: string;
  music: string;
  screenplay: string;
}

/** Campi "pesanti": generati on-demand solo quando si apre il modal di dettaglio. */
export interface MovieDetail extends MovieNode {
  synopsis: string;
  qualityBadges: string[];
  runtimeMinutes: number;
  poster: string;
  album: { title: string; composer: string; format: string[] };
  tracks: SoundtrackTrack[];
  cast: CastMember[];
  awardsNote?: string;
  credits: MovieCredits;
  nearestNeighbors: { id: string; title: string; matchPercent: number }[];
}
