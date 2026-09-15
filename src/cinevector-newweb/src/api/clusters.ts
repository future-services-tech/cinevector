import { apiFetch } from "./client";
import type { ClusterDto, ClusterMemberDto } from "./types";

export function getClusters(): Promise<ClusterDto[]> {
  return apiFetch<ClusterDto[]>("/api/clusters");
}

export function getClusterMovies(clusterId: number): Promise<ClusterMemberDto[]> {
  return apiFetch<ClusterMemberDto[]>(`/api/clusters/${clusterId}/movies`);
}
