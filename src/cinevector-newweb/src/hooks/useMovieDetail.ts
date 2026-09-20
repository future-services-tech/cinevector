import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getMovie } from "../api/movies";
import { buildFallbackNode, buildMovieDetail } from "../lib/movieDetail";
import { useMovieData } from "../state/MovieDataContext";
import type { MovieDetail } from "../types/movie";

export function useMovieDetail(id: string | null): { detail: MovieDetail | null; isLoading: boolean; isError: boolean } {
  const { getMovieById } = useMovieData();
  const numericId = id ? Number(id) : null;

  const query = useQuery({
    queryKey: ["movie", numericId],
    queryFn: () => getMovie(numericId!),
    enabled: numericId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const detail = useMemo<MovieDetail | null>(() => {
    if (!query.data) return null;
    const node = (id ? getMovieById(id) : undefined) ?? buildFallbackNode(query.data);
    return buildMovieDetail(node, query.data);
  }, [id, getMovieById, query.data]);

  return { detail, isLoading: query.isLoading, isError: query.isError };
}
