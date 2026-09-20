import { apiFetch } from "./client";
import type { SearchResponseDto } from "./types";

/** Ricerca rapida per la barra di ricerca dell'header (solo testo libero, usata da useDebouncedSearch). */
export function search(query: string, pageSize = 6): Promise<SearchResponseDto> {
  const params = new URLSearchParams({ query, pageSize: String(pageSize) });
  return apiFetch<SearchResponseDto>(`/api/search?${params.toString()}`);
}

export type SearchSort = "Relevance" | "YearDesc" | "YearAsc" | "RatingDesc" | "TitleAsc";

export interface SearchParams {
  query?: string;
  genres?: string[];
  actors?: string[];
  directors?: string[];
  yearFrom?: number;
  yearTo?: number;
  ratingFrom?: number;
  ratingTo?: number;
  language?: string;
  country?: string;
  semantic?: boolean;
  naturalLanguage?: boolean;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

/** Ricerca parametrica completa (pagina Catalogo): tutti i filtri sono combinabili nella stessa chiamata —
 * il backend li combina in AND, mai in OR, coerente con "l'accoppiamento delle proprietà" richiesto. */
export function searchMovies(params: SearchParams): Promise<SearchResponseDto> {
  const qs = new URLSearchParams();
  if (params.query) qs.set("query", params.query);
  if (params.yearFrom) qs.set("yearFrom", String(params.yearFrom));
  if (params.yearTo) qs.set("yearTo", String(params.yearTo));
  if (params.ratingFrom) qs.set("ratingFrom", String(params.ratingFrom));
  if (params.ratingTo) qs.set("ratingTo", String(params.ratingTo));
  if (params.language) qs.set("language", params.language);
  if (params.country) qs.set("country", params.country);
  if (params.semantic) qs.set("semantic", "true");
  if (params.naturalLanguage) qs.set("naturalLanguage", "true");
  if (params.sort) qs.set("sort", params.sort);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  for (const genre of params.genres ?? []) qs.append("genres", genre);
  for (const actor of params.actors ?? []) qs.append("actors", actor);
  for (const director of params.directors ?? []) qs.append("directors", director);

  return apiFetch<SearchResponseDto>(`/api/search?${qs.toString()}`);
}
