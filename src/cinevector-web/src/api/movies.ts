import { apiFetch } from "./client";
import type { Movie, MovieSummary, PagedResult, UpsertMovieRequest } from "./types";
import type { SearchResultItem } from "./search";

export interface SimilarMoviesResponse {
  movieId: number;
  results: SearchResultItem[];
}

export function getMovies(page = 1, pageSize = 20) {
  return apiFetch<PagedResult<MovieSummary>>(`/api/movies?page=${page}&pageSize=${pageSize}`);
}

export function getMovie(id: number) {
  return apiFetch<Movie>(`/api/movies/${id}`);
}

export function getSimilarMovies(id: number, maxResults = 8) {
  return apiFetch<SimilarMoviesResponse>(`/api/movies/${id}/similar?maxResults=${maxResults}`);
}

export function createMovie(request: UpsertMovieRequest) {
  return apiFetch<Movie>("/api/movies", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateMovie(id: number, request: UpsertMovieRequest) {
  return apiFetch<Movie>(`/api/movies/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deleteMovie(id: number) {
  return apiFetch<void>(`/api/movies/${id}`, { method: "DELETE" });
}
