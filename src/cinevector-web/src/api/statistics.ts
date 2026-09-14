import { apiFetch } from "./client";

export interface NamedCount {
  name: string;
  count: number;
}

export interface Statistics {
  totalMovies: number;
  moviesAddedToday: number;
  moviesUpdatedToday: number;
  totalSources: number;
  lastCrawlAt?: string | null;
  moviesWithEmbedding: number;
  moviesPendingEmbedding: number;
  totalClusters: number;
  byGenre: NamedCount[];
  byYear: NamedCount[];
  byRating: NamedCount[];
  bySource: NamedCount[];
}

export function getStatistics() {
  return apiFetch<Statistics>("/api/statistics");
}
