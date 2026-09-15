import type { CastMember, MovieCluster, MovieDetail, MovieLink, MovieNode, RoleType, SoundtrackTrack } from "../types/movie";
import { generateMockData } from "./generateMockData";
import {
  BLADE_RUNNER_AWARDS_NOTE,
  BLADE_RUNNER_CAST,
  BLADE_RUNNER_CREDITS,
  BLADE_RUNNER_ID,
  BLADE_RUNNER_TRACKS,
  HERO_SEEDS,
} from "./heroMovies";
import { CAST_FIRST_NAMES, CAST_LAST_NAMES, CONFLICTS, PROTAGONISTS, SETTINGS, SYNOPSIS_TEMPLATES, TRACK_TITLE_FRAGMENTS } from "./lexicon";
import { hashStringToSeed, mulberry32, pick, randInt, type Rng } from "./seedRandom";

// Generato una sola volta a import-time: deterministico, quindi non serve rigenerare a ogni render.
const { movies, clusters, links } = generateMockData();

const movieById = new Map<string, MovieNode>(movies.map((m) => [m.id, m]));
const heroSeedById = new Map(HERO_SEEDS.map((h) => [h.id, h]));

const linksBySource = new Map<string, MovieLink[]>();
for (const link of links) {
  linksBySource.set(link.source, [...(linksBySource.get(link.source) ?? []), link]);
  linksBySource.set(link.target, [...(linksBySource.get(link.target) ?? []), { source: link.target, target: link.source, affinity: link.affinity }]);
}

export { movies, clusters, links };

export function getMovieById(id: string): MovieNode | undefined {
  return movieById.get(id);
}

export function getMoviesByCluster(clusterId: string): MovieNode[] {
  return movies.filter((m) => m.clusterId === clusterId);
}

export function getTopNeighbors(id: string, n = 4): { id: string; title: string; matchPercent: number }[] {
  const candidateLinks = (linksBySource.get(id) ?? []).slice().sort((a, b) => b.affinity - a.affinity).slice(0, n);
  return candidateLinks
    .map((link) => {
      const node = movieById.get(link.target);
      return node ? { id: node.id, title: node.title, matchPercent: Math.round(link.affinity) } : null;
    })
    .filter((v): v is { id: string; title: string; matchPercent: number } => v !== null);
}

const QUALITY_BADGE_POOL = ["4K UHD", "Dolby Atmos", "HDR10+", "Dolby Vision", "IMAX Enhanced"];
const ROLE_TYPES: RoleType[] = ["principale", "principale", "supporto", "supporto", "supporto"];
const CAST_GRADIENTS: [string, string][] = [
  ["#22d3ee", "#3b82f6"],
  ["#fbbf24", "#f97316"],
  ["#a855f7", "#6366f1"],
  ["#34d399", "#14b8a6"],
  ["#fb7185", "#ef4444"],
  ["#f472b6", "#a855f7"],
];

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function generateCast(rng: Rng): CastMember[] {
  const count = randInt(rng, 4, 5);
  const cast: CastMember[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${pick(rng, CAST_FIRST_NAMES)} ${pick(rng, CAST_LAST_NAMES)}`;
    const [gradientFrom, gradientTo] = CAST_GRADIENTS[i % CAST_GRADIENTS.length];
    cast.push({
      name,
      role: i === 0 ? "Ruolo Principale" : i === 1 ? "Ruolo Principale" : "Personaggio Secondario",
      roleType: ROLE_TYPES[i % ROLE_TYPES.length],
      gradientFrom,
      gradientTo,
      initials: initialsOf(name),
    });
  }
  return cast;
}

function generateTracks(rng: Rng, composer: string): SoundtrackTrack[] {
  const count = randInt(rng, 5, 7);
  const tracks: SoundtrackTrack[] = [];
  for (let i = 0; i < count; i++) {
    const totalSec = randInt(rng, 95, 245);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    tracks.push({
      id: `t${i + 1}-${Math.round(rng() * 1e6)}`,
      num: i + 1,
      title: `${pick(rng, TRACK_TITLE_FRAGMENTS)} ${["I", "II", "III", "IV", "V", "VI", "VII"][i] ?? i + 1}`,
      artist: composer,
      duration: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      totalSec,
    });
  }
  return tracks;
}

function generateSynopsis(rng: Rng, node: MovieNode): string {
  const templates = SYNOPSIS_TEMPLATES[node.clusterId];
  const template = pick(rng, templates);
  return template
    .replace("{protagonist}", pick(rng, PROTAGONISTS))
    .replace("{setting}", pick(rng, SETTINGS))
    .replace("{conflict}", pick(rng, CONFLICTS));
}

const detailCache = new Map<string, MovieDetail>();

/** Dettaglio "pesante" generato on-demand (non tenuto per tutti i 1000 film in memoria). Blade Runner 2049
 * usa i dati esatti dal mockup dettaglio_sfere3d/code.html; gli altri (hero inclusi) hanno un dettaglio
 * procedurale ma deterministico per id, così riaprire lo stesso film dà sempre lo stesso risultato. */
export function getMovieDetail(id: string): MovieDetail {
  const cached = detailCache.get(id);
  if (cached) return cached;

  const node = movieById.get(id);
  if (!node) throw new Error(`Film non trovato: ${id}`);

  const seed = hashStringToSeed(`${id}:detail`);
  const rng = mulberry32(seed);
  const heroSeed = heroSeedById.get(id);
  const nearestNeighbors = getTopNeighbors(id, 4);

  if (id === BLADE_RUNNER_ID) {
    const detail: MovieDetail = {
      ...node,
      synopsis: heroSeed!.synopsis,
      qualityBadges: ["4K UHD", "Dolby Atmos"],
      runtimeMinutes: 164,
      poster: `https://picsum.photos/seed/${id}/960/540`,
      album: { title: "Blade Runner 2049 (Original Motion Picture Soundtrack)", composer: "Hans Zimmer & Benjamin Wallfisch", format: ["FLAC 24-bit / 96kHz", "Spatial Audio"] },
      tracks: BLADE_RUNNER_TRACKS,
      cast: BLADE_RUNNER_CAST,
      awardsNote: BLADE_RUNNER_AWARDS_NOTE,
      credits: BLADE_RUNNER_CREDITS,
      nearestNeighbors,
    };
    detailCache.set(id, detail);
    return detail;
  }

  const composer = `${pick(rng, CAST_FIRST_NAMES)} ${pick(rng, CAST_LAST_NAMES)}`;
  const detail: MovieDetail = {
    ...node,
    synopsis: heroSeed?.synopsis ?? generateSynopsis(rng, node),
    qualityBadges: [pick(rng, QUALITY_BADGE_POOL), pick(rng, QUALITY_BADGE_POOL)].filter((v, i, arr) => arr.indexOf(v) === i),
    runtimeMinutes: randInt(rng, 88, 168),
    poster: `https://picsum.photos/seed/${id}/960/540`,
    album: { title: `${node.title} — Original Score`, composer, format: [pick(rng, ["FLAC 24-bit / 96kHz", "Dolby Atmos Hi-Res", "Spatial Audio"])] },
    tracks: generateTracks(rng, composer),
    cast: generateCast(rng),
    credits: {
      director: node.director,
      cinematography: `${pick(rng, CAST_FIRST_NAMES)} ${pick(rng, CAST_LAST_NAMES)}`,
      music: composer,
      screenplay: `${pick(rng, CAST_FIRST_NAMES)} ${pick(rng, CAST_LAST_NAMES)}`,
    },
    nearestNeighbors,
  };
  detailCache.set(id, detail);
  return detail;
}

export function getClusterById(clusterId: string): MovieCluster | undefined {
  return clusters.find((c) => c.id === clusterId);
}

export function getDailyPick(): MovieNode {
  // Deterministico per l'intera sessione (non cambia ad ogni render), ma non richiede persistenza.
  const heroMovies = movies.filter((m) => m.isKey);
  const dayIndex = new Date().getDate() % heroMovies.length;
  return heroMovies[dayIndex] ?? movies[0];
}

export function getDensestCluster(): MovieCluster {
  return clusters.reduce((max, c) => (c.count > max.count ? c : max), clusters[0]);
}

export function getAverageRating(): number {
  const sum = movies.reduce((acc, m) => acc + m.rating, 0);
  return Math.round((sum / movies.length) * 100) / 100;
}

export function searchMovies(query: string, limit = 8): MovieNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return movies
    .filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}
