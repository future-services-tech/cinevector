import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ViewMode = "sphere" | "cluster" | "network";

interface SelectionState {
  selectedId: string | null;
  hoveredId: string | null;
  viewMode: ViewMode;
  autoRotate: boolean;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleAutoRotate: () => void;
}

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("sphere");
  const [autoRotate, setAutoRotate] = useState(true);

  const value = useMemo<SelectionState>(
    () => ({
      selectedId,
      hoveredId,
      viewMode,
      autoRotate,
      select: setSelectedId,
      hover: setHoveredId,
      setViewMode,
      toggleAutoRotate: () => setAutoRotate((v) => !v),
    }),
    [selectedId, hoveredId, viewMode, autoRotate],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection deve essere usato dentro <SelectionProvider>");
  return ctx;
}
