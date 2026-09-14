import { apiFetch } from "./client";

export interface Source {
  id: number;
  name: string;
  baseUrl: string;
  enabled: boolean;
  adapterType: string;
  lastCrawlAt?: string | null;
}

export interface UpsertSourceRequest {
  name: string;
  baseUrl: string;
  enabled: boolean;
  adapterType: string;
}

export function getSources() {
  return apiFetch<Source[]>("/api/sources");
}

export function createSource(request: UpsertSourceRequest) {
  return apiFetch<Source>("/api/sources", { method: "POST", body: JSON.stringify(request) });
}

export function updateSource(id: number, request: UpsertSourceRequest) {
  return apiFetch<Source>(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(request) });
}

export function deleteSource(id: number) {
  return apiFetch<void>(`/api/sources/${id}`, { method: "DELETE" });
}
