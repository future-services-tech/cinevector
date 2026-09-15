import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMovieData } from "./MovieDataContext";

interface FilterState {
  activeClusterIds: Set<number>;
  similarityThreshold: number; // 0-100
  yearRange: [number, number];
  toggleCluster: (id: number) => void;
  isolateCluster: (id: number) => void;
  resetClusters: () => void;
  setSimilarityThreshold: (value: number) => void;
  setYearRange: (range: [number, number]) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const { clusters, movies } = useMovieData();
  const [activeClusterIds, setActiveClusterIds] = useState<Set<number>>(new Set());
  const [similarityThreshold, setSimilarityThreshold] = useState(70);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const initialized = useRef(false);

  // I cluster/anni reali arrivano in modo asincrono dal backend: al primo caricamento inizializziamo
  // "tutti i cluster attivi" e l'arco temporale sui dati effettivamente presenti, una sola volta.
  useEffect(() => {
    if (initialized.current || clusters.length === 0) return;
    initialized.current = true;
    setActiveClusterIds(new Set(clusters.map((c) => c.id)));
    const years = movies.map((m) => m.year).filter((y) => y > 0);
    if (years.length > 0) {
      setYearRange([Math.min(...years), Math.max(...years)]);
    }
  }, [clusters, movies]);

  const allClusterIds = useMemo(() => clusters.map((c) => c.id), [clusters]);

  const value = useMemo<FilterState>(
    () => ({
      activeClusterIds,
      similarityThreshold,
      yearRange,
      toggleCluster: (id) =>
        setActiveClusterIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next.size === 0 ? new Set(allClusterIds) : next;
        }),
      isolateCluster: (id) => setActiveClusterIds(new Set([id])),
      resetClusters: () => setActiveClusterIds(new Set(allClusterIds)),
      setSimilarityThreshold,
      setYearRange,
    }),
    [activeClusterIds, similarityThreshold, yearRange, allClusterIds],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters deve essere usato dentro <FilterProvider>");
  return ctx;
}
