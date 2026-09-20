/** Id di cluster reale (backend: k-means dinamico, non più una tassonomia fissa). */
export type ClusterId = number;

export interface MovieCluster {
  id: ClusterId;
  name: string;
  color: string;
  count: number;
}

/** Campi "leggeri": alimentano la sfera 3D, una istanza per ciascun film restituito da
 * GET /api/clusters/{id}/movies (nessun regista/sinossi qui: arrivano solo con il dettaglio pesante). */
export interface MovieNode {
  id: string;
  vectorId: string;
  title: string;
  year: number;
  rating: number;
  clusterId: ClusterId;
  clusterLabel: string;
  color: string;
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
  /** Foto reale (TMDb) se il backend l'ha già recuperata — altrimenti si usa il fallback a gradiente. */
  profileUrl?: string;
  /** Pagina Wikipedia della persona, se il backend l'ha risolta — rende la foto/nome un link cliccabile. */
  wikipediaUrl?: string;
}

export interface SoundtrackTrack {
  id: string;
  num: number;
  title: string;
  artist: string;
  duration: string;
  totalSec: number;
  styleTag?: string;
  /** Presente solo per tracce reali trovate su Spotify (anteprima 30s, Client Credentials Flow) —
   * se assente la traccia è sintetica e la riproduzione resta simulata come prima. */
  previewUrl?: string;
}

export interface CreditPerson {
  name: string;
  profileUrl?: string;
  wikipediaUrl?: string;
}

export interface MovieCredits {
  director: CreditPerson;
  cinematography?: CreditPerson;
  cinematographyAward?: string;
  music?: CreditPerson;
  screenplay?: CreditPerson;
}

/** Campi "pesanti": generati on-demand solo quando si apre il modal di dettaglio, combinando dati
 * reali dal backend (sinossi, cast, crediti, poster) con sintesi deterministica seedata sull'id
 * reale del film per ciò che il backend non ha (trailer, colonna sonora, runtime). */
export interface MovieDetail extends MovieNode {
  director: string;
  synopsis: string;
  qualityBadges: string[];
  runtimeMinutes: number;
  poster: string;
  album: { title: string; composer: string; format: string[] };
  tracks: SoundtrackTrack[];
  cast: CastMember[];
  credits: MovieCredits;
}
