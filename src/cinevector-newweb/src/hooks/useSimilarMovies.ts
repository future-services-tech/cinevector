import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getSimilarMovies } from "../api/movies";
import type { SimilarMoviesResponseDto } from "../api/types";

/** Film vettorialmente più vicini a `id`, recuperati on-demand da GET /api/movies/{id}/similar
 * (non esiste un grafo precalcolato per tutti i film come nel mock). */
export function useSimilarMovies(id: string | null): UseQueryResult<SimilarMoviesResponseDto> {
  const numericId = id ? Number(id) : null;
  return useQuery({
    queryKey: ["similar", numericId],
    queryFn: () => getSimilarMovies(numericId!, 6),
    enabled: numericId !== null,
    staleTime: 5 * 60 * 1000,
  });
}
