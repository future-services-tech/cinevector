import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ClusterId } from "../types/movie";
import { clusters } from "../data";

interface FilterState {
  activeClusterIds: Set<ClusterId>;
  similarityThreshold: number; // 0-100
  yearRange: [number, number];
  toggleCluster: (id: ClusterId) => void;
  isolateCluster: (id: ClusterId) => void;
  resetClusters: () => void;
  setSimilarityThreshold: (value: number) => void;
  setYearRange: (range: [number, number]) => void;
}

const ALL_CLUSTER_IDS = clusters.map((c) => c.id);

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [activeClusterIds, setActiveClusterIds] = useState<Set<ClusterId>>(new Set(ALL_CLUSTER_IDS));
  const [similarityThreshold, setSimilarityThreshold] = useState(70);
  const [yearRange, setYearRange] = useState<[number, number]>([1970, 2025]);

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
          return next.size === 0 ? new Set(ALL_CLUSTER_IDS) : next;
        }),
      isolateCluster: (id) => setActiveClusterIds(new Set([id])),
      resetClusters: () => setActiveClusterIds(new Set(ALL_CLUSTER_IDS)),
      setSimilarityThreshold,
      setYearRange,
    }),
    [activeClusterIds, similarityThreshold, yearRange],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters deve essere usato dentro <FilterProvider>");
  return ctx;
}
