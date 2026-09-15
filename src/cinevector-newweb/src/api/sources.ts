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

export function getSources(): Promise<Source[]> {
  return apiFetch<Source[]>("/api/sources");
}

/** Tipi di fonte realmente configurabili (adapter registrati lato backend + "Manual") — il selettore in UI
 * si popola da qui invece di avere un elenco fisso, così un nuovo adapter backend appare automaticamente. */
export function getAdapterTypes(): Promise<string[]> {
  return apiFetch<string[]>("/api/sources/adapter-types");
}

export function createSource(request: UpsertSourceRequest): Promise<Source> {
  return apiFetch<Source>("/api/sources", { method: "POST", body: JSON.stringify(request) });
}

export function updateSource(id: number, request: UpsertSourceRequest): Promise<Source> {
  return apiFetch<Source>(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(request) });
}

export function deleteSource(id: number): Promise<void> {
  return apiFetch<void>(`/api/sources/${id}`, { method: "DELETE" });
}
