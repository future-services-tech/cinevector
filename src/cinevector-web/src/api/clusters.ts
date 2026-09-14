import { apiFetch } from "./client";

export interface Cluster {
  id: number;
  label: string;
  description: string;
  memberCount: number;
  coordX: number;
  coordY: number;
  coordZ: number;
}

export interface ClusterMember {
  id: number;
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  genres: string[];
  coordX: number;
  coordY: number;
  coordZ: number;
}

export function getClusters() {
  return apiFetch<Cluster[]>("/api/clusters");
}

export function getCluster(id: number) {
  return apiFetch<Cluster>(`/api/clusters/${id}`);
}

export function getClusterMovies(id: number) {
  return apiFetch<ClusterMember[]>(`/api/clusters/${id}/movies`);
}

export function recomputeClusters() {
  return apiFetch<{ clusters: number }>("/api/clusters/recompute", { method: "POST" });
}
