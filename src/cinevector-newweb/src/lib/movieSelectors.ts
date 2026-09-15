import type { MovieCluster, MovieNode } from "../types/movie";

export function getDensestCluster(clusters: MovieCluster[]): MovieCluster | null {
  if (clusters.length === 0) return null;
  return clusters.reduce((max, c) => (c.count > max.count ? c : max), clusters[0]);
}

export function getAverageRating(movies: MovieNode[]): number {
  if (movies.length === 0) return 0;
  const sum = movies.reduce((acc, m) => acc + m.rating, 0);
  return Math.round((sum / movies.length) * 100) / 100;
}

/** Scelta deterministica per data tra i film "hero" (rating più alto), stabile per l'intera giornata. */
export function getDailyPick(movies: MovieNode[]): MovieNode | null {
  const heroMovies = movies.filter((m) => m.isKey);
  const pool = heroMovies.length > 0 ? heroMovies : movies;
  if (pool.length === 0) return null;
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
}
