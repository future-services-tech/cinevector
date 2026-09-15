import { apiFetch } from "./client";
import type { MovieDto, SimilarMoviesResponseDto } from "./types";

export function getMovie(id: number): Promise<MovieDto> {
  return apiFetch<MovieDto>(`/api/movies/${id}`);
}

export function getSimilarMovies(id: number, maxResults = 6): Promise<SimilarMoviesResponseDto> {
  return apiFetch<SimilarMoviesResponseDto>(`/api/movies/${id}/similar?maxResults=${maxResults}`);
}
