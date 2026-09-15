import type { ClusterId, MovieCluster, MovieLink, MovieNode } from "../types/movie";
import { CLUSTERS_CONFIG, CLUSTER_WEIGHTS, getClusterConfig } from "./clustersConfig";
import { HERO_SEEDS } from "./heroMovies";
import { DIRECTOR_FIRST_NAMES, DIRECTOR_LAST_NAMES, TAG_POOL, TITLE_FRAGMENTS } from "./lexicon";
import { fibonacciSpherePoint } from "../lib/three-helpers";
import { hashStringToSeed, mulberry32, pick, pickN, randFloat, randGaussian, randInt, type Rng } from "./seedRandom";

export const TOTAL_MOVIES = 1000;
const GLOBAL_SEED = 0xc1e5ec70;
const TOP_K_LINKS = 4;

function slugify(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "film"}-${index}`;
}

function vectorIdFor(id: string): string {
  const hash = hashStringToSeed(id).toString(16).toUpperCase().padStart(8, "0");
  return `VEC-${hash}`;
}

function generateTitle(rng: Rng, clusterId: ClusterId, index: number): string {
  const frag = TITLE_FRAGMENTS[clusterId];
  const adjective = pick(rng, frag.adjectives);
  const noun = pick(rng, frag.nouns);
  const pattern = randInt(rng, 0, 2);
  if (pattern === 0) return `${noun} ${adjective}`;
  if (pattern === 1) return `${adjective} ${noun}`;
  const secondNoun = pick(rng, frag.nouns);
  return `${noun} di ${secondNoun}${index % 17 === 0 ? " II" : ""}`;
}

function generateDirector(rng: Rng): string {
  return `${pick(rng, DIRECTOR_FIRST_NAMES)} ${pick(rng, DIRECTOR_LAST_NAMES)}`;
}

/** Genera l'intero dataset mock in modo deterministico (stesso seed => stesso output ad ogni build/reload). */
export function generateMockData(): { movies: MovieNode[]; clusters: MovieCluster[]; links: MovieLink[] } {
  const rng = mulberry32(GLOBAL_SEED);

  // 1. Quota di film procedurali per cluster (il resto, oltre agli hero).
  const heroCountByCluster = new Map<ClusterId, number>();
  for (const hero of HERO_SEEDS) {
    heroCountByCluster.set(hero.clusterId, (heroCountByCluster.get(hero.clusterId) ?? 0) + 1);
  }

  const totalWeight = Object.values(CLUSTER_WEIGHTS).reduce((a, b) => a + b, 0);
  const remaining = TOTAL_MOVIES - HERO_SEEDS.length;
  const proceduralCountByCluster = new Map<ClusterId, number>();
  let allocated = 0;
  CLUSTERS_CONFIG.forEach((cluster, idx) => {
    const isLast = idx === CLUSTERS_CONFIG.length - 1;
    const count = isLast
      ? remaining - allocated
      : Math.round((remaining * CLUSTER_WEIGHTS[cluster.id]) / totalWeight);
    proceduralCountByCluster.set(cluster.id, Math.max(0, count));
    allocated += count;
  });

  // 2. Costruisce i MovieNode: prima gli hero (id/dati fissi), poi i procedurali per cluster.
  const movies: MovieNode[] = [];

  HERO_SEEDS.forEach((hero) => {
    movies.push({
      id: hero.id,
      vectorId: vectorIdFor(hero.id),
      title: hero.title,
      year: hero.year,
      director: hero.director,
      rating: hero.rating,
      clusterId: hero.clusterId,
      affinity: Math.round(randFloat(rng, 90, 99) * 10) / 10,
      tags: hero.tags,
      isKey: true,
      size: randFloat(rng, 7.5, 9.5),
      position: [0, 0, 0],
    });
  });

  CLUSTERS_CONFIG.forEach((cluster) => {
    const count = proceduralCountByCluster.get(cluster.id) ?? 0;
    for (let i = 0; i < count; i++) {
      const title = generateTitle(rng, cluster.id, i);
      const id = slugify(title, movies.length);
      movies.push({
        id,
        vectorId: vectorIdFor(id),
        title,
        year: Math.round(randFloat(rng, 1970, 2025)),
        director: generateDirector(rng),
        rating: Math.round(randGaussian(rng, 6.9, 1.6) * 10) / 10,
        clusterId: cluster.id,
        affinity: Math.round(randFloat(rng, 62, 96) * 10) / 10,
        tags: pickN(rng, TAG_POOL[cluster.id], randInt(rng, 3, 5)),
        isKey: false,
        size: randFloat(rng, 3.5, 6.5),
        position: [0, 0, 0],
      });
    }
  });

  // 3. Posizionamento Fibonacci Sphere globale + attrazione verso il centroide del proprio cluster
  //    (così i cluster restano riconoscibili come "nuvole" colorate, come nello screenshot).
  const clusterCentroids = new Map<ClusterId, [number, number, number]>();
  CLUSTERS_CONFIG.forEach((cluster, idx) => {
    clusterCentroids.set(cluster.id, fibonacciSpherePoint(idx, CLUSTERS_CONFIG.length));
  });

  const total = movies.length;
  movies.forEach((movie, index) => {
    const base = fibonacciSpherePoint(index, total);
    const centroid = clusterCentroids.get(movie.clusterId) ?? [0, 1, 0];
    const jitter = 0.22;
    let x = base[0] * (1 - jitter) + centroid[0] * jitter;
    let y = base[1] * (1 - jitter) + centroid[1] * jitter;
    let z = base[2] * (1 - jitter) + centroid[2] * jitter;
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    x /= len;
    y /= len;
    z /= len;
    movie.position = [x, y, z];
  });

  // 4. Conteggio reale per cluster (sostituisce i numeri fittizi del mockup).
  const clusters: MovieCluster[] = CLUSTERS_CONFIG.map((cfg) => ({
    id: cfg.id,
    name: cfg.name,
    color: cfg.color,
    count: movies.filter((m) => m.clusterId === cfg.id).length,
  }));

  // 5. Collegamenti semantici (top-K per nodo, candidati limitati per performance: stesso cluster
  //    + un piccolo campione cross-cluster, non tutte le 1000*1000 coppie).
  const links = generateLinks(rng, movies);

  return { movies, clusters, links };
}

function movieSimilarityScore(
  rng: Rng,
  a: MovieNode,
  b: MovieNode,
): number {
  let score = 0;
  if (a.clusterId === b.clusterId) score += 0.5;
  const dx = a.position[0] - b.position[0];
  const dy = a.position[1] - b.position[1];
  const dz = a.position[2] - b.position[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  score += Math.max(0, 1 - dist / 2) * 0.3;
  const sharedTags = a.tags.filter((t) => b.tags.includes(t)).length;
  score += Math.min(sharedTags, 3) * 0.08;
  const yearDelta = Math.abs(a.year - b.year);
  score += Math.max(0, 1 - yearDelta / 40) * 0.1;
  score += (rng() - 0.5) * 0.04; // piccola perturbazione per evitare pareggi troppo netti
  return score;
}

function generateLinks(rng: Rng, movies: MovieNode[]): MovieLink[] {
  const byCluster = new Map<ClusterId, MovieNode[]>();
  for (const m of movies) {
    const arr = byCluster.get(m.clusterId) ?? [];
    arr.push(m);
    byCluster.set(m.clusterId, arr);
  }

  const links: MovieLink[] = [];
  const seenPairs = new Set<string>();

  for (const movie of movies) {
    const sameCluster = (byCluster.get(movie.clusterId) ?? []).filter((m) => m.id !== movie.id);
    const others = movies.filter((m) => m.clusterId !== movie.clusterId);
    const crossSample = pickN(rng, others, 24);
    const candidates = [...sameCluster, ...crossSample];

    const scored = candidates
      .map((candidate) => ({ candidate, score: movieSimilarityScore(rng, movie, candidate) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K_LINKS);

    for (const { candidate, score } of scored) {
      const key = [movie.id, candidate.id].sort().join("|");
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      links.push({
        source: movie.id,
        target: candidate.id,
        affinity: Math.round(clampScoreToAffinity(score) * 10) / 10,
      });
    }
  }

  return links;
}

function clampScoreToAffinity(score: number): number {
  const pct = 55 + score * 45;
  return Math.max(40, Math.min(99, pct));
}

export function getHeroClusterId(id: string): ClusterId | undefined {
  return HERO_SEEDS.find((h) => h.id === id)?.clusterId;
}

export function describeCluster(id: ClusterId) {
  return getClusterConfig(id);
}
