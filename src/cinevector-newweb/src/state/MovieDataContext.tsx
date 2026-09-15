import { useQueries, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getClusterMovies, getClusters } from "../api/clusters";
import { colorForIndex } from "../lib/clusterColors";
import type { MovieCluster, MovieNode } from "../types/movie";

interface MovieDataState {
  movies: MovieNode[];
  clusters: MovieCluster[];
  isLoading: boolean;
  isError: boolean;
  getMovieById: (id: string) => MovieNode | undefined;
}

const MovieDataContext = createContext<MovieDataState | null>(null);

function normalizePosition(x: number, y: number, z: number): [number, number, number] {
  const length = Math.sqrt(x * x + y * y + z * z);
  if (length < 1e-6) return [0, 1, 0];
  return [x / length, y / length, z / length];
}

const STALE_TIME = 5 * 60 * 1000;

export function MovieDataProvider({ children }: { children: ReactNode }) {
  const clustersQuery = useQuery({ queryKey: ["clusters"], queryFn: getClusters, staleTime: STALE_TIME });
  const clusterList = useMemo(() => clustersQuery.data ?? [], [clustersQuery.data]);

  const memberQueries = useQueries({
    queries: clusterList.map((cluster) => ({
      queryKey: ["clusterMovies", cluster.id],
      queryFn: () => getClusterMovies(cluster.id),
      enabled: clustersQuery.isSuccess,
      staleTime: STALE_TIME,
    })),
  });

  const membersLoaded = clustersQuery.isSuccess && memberQueries.length === clusterList.length && memberQueries.every((q) => q.isSuccess);
  const isLoading = clustersQuery.isLoading || (clustersQuery.isSuccess && !membersLoaded && !memberQueries.some((q) => q.isError));
  const isError = clustersQuery.isError || memberQueries.some((q) => q.isError);

  const { movies, clusters } = useMemo(() => {
    if (!membersLoaded) {
      return { movies: [] as MovieNode[], clusters: [] as MovieCluster[] };
    }

    const sortedClusters = [...clusterList].sort((a, b) => a.id - b.id);
    const colorByClusterId = new Map(sortedClusters.map((c, i) => [c.id, colorForIndex(i)]));

    const allMovies: MovieNode[] = [];
    clusterList.forEach((cluster, i) => {
      const members = memberQueries[i]?.data ?? [];
      const color = colorByClusterId.get(cluster.id) ?? "#64748b";
      members.forEach((member) => {
        allMovies.push({
          id: String(member.id),
          vectorId: `V-${String(member.id).padStart(5, "0")}`,
          title: member.title,
          year: member.year ?? 0,
          rating: member.rating ?? 0,
          clusterId: cluster.id,
          clusterLabel: cluster.label,
          color,
          // Nessun concetto di "affinità" per-film nel backend fuori da un contesto di ricerca/similarità:
          // qui è una stima decorativa derivata dal rating reale, non un valore restituito dall'API.
          affinity: Math.round(40 + ((member.rating ?? 5) / 10) * 55),
          tags: member.genres,
          isKey: false,
          size: 1,
          position: normalizePosition(member.coordX, member.coordY, member.coordZ),
        });
      });
    });

    // Top 5% per rating diventano nodi "hero" (più grandi/luminosi sulla sfera), stessa idea del mock
    // ma calcolata sui dati reali invece che su un elenco fisso di film.
    const heroCount = Math.max(1, Math.ceil(allMovies.length * 0.05));
    const heroIds = new Set([...allMovies].sort((a, b) => b.rating - a.rating).slice(0, heroCount).map((m) => m.id));
    allMovies.forEach((m) => {
      m.isKey = heroIds.has(m.id);
    });

    const clustersOut: MovieCluster[] = clusterList.map((c) => ({
      id: c.id,
      name: c.label,
      color: colorByClusterId.get(c.id) ?? "#64748b",
      count: c.memberCount,
    }));

    return { movies: allMovies, clusters: clustersOut };
  }, [membersLoaded, clusterList, memberQueries]);

  const movieById = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);

  const value = useMemo<MovieDataState>(
    () => ({
      movies,
      clusters,
      isLoading,
      isError,
      getMovieById: (id) => movieById.get(id),
    }),
    [movies, clusters, isLoading, isError, movieById],
  );

  return <MovieDataContext.Provider value={value}>{children}</MovieDataContext.Provider>;
}

export function useMovieData(): MovieDataState {
  const ctx = useContext(MovieDataContext);
  if (!ctx) throw new Error("useMovieData deve essere usato dentro <MovieDataProvider>");
  return ctx;
}
