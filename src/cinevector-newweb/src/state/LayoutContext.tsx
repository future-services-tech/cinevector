import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface LayoutState {
  sidebarOpen: boolean;
  detailOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openDetail: () => void;
  closeDetail: () => void;
}

const LayoutContext = createContext<LayoutState | null>(null);

/** Stato di apertura dei drawer mobile/tablet (sidebar sinistra, pannello dettagli destro): sopra il
 * breakpoint lg entrambi sono sempre visibili in flusso normale e questo stato viene ignorato dai componenti
 * (vedi LeftSidebar.tsx/RightDetailPanel.tsx) — serve solo sotto lg, dove diventano drawer fuori schermo.
 * Un Context invece dello store esterno usato altrove (cameraCoordsStore ecc.) perché qui non serve essere
 * letto fuori dall'albero React: TopHeader e LeftSidebar/RightDetailPanel sono fratelli nella stessa pagina. */
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Riferimenti stabili (mai ricreati) apposta: RightDetailPanel mette openDetail nelle dipendenze di un
  // useEffect per auto-aprirsi alla selezione — se la funzione cambiasse identità ad ogni render (come con
  // un useMemo che dipende da detailOpen), chiudere il pannello ne cambierebbe l'identità e farebbe
  // rieseguire subito l'effect, riaprendolo all'istante.
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openDetail = useCallback(() => setDetailOpen(true), []);
  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const value = useMemo<LayoutState>(
    () => ({ sidebarOpen, detailOpen, toggleSidebar, closeSidebar, openDetail, closeDetail }),
    [sidebarOpen, detailOpen, toggleSidebar, closeSidebar, openDetail, closeDetail],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutState {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout deve essere usato dentro <LayoutProvider>");
  return ctx;
}
