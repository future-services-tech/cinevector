import { apiFetch } from "./client";

export interface SearchResultItem {
  id: number;
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  genres: string[];
  relevance?: number | null;
  similarity?: number | null;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface SearchFacets {
  genres: FacetValue[];
  years: FacetValue[];
  languages: FacetValue[];
}

export interface SearchResponse {
  query?: string | null;
  mode: string;
  total: number;
  page: number;
  pageSize: number;
  results: SearchResultItem[];
  facets: SearchFacets;
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

export function search(params: SearchParams) {
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

  return apiFetch<SearchResponse>(`/api/search?${qs.toString()}`);
}
