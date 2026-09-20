import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "cinevector-newweb:watchlist";

interface WatchlistState {
  ids: Set<string>;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistState | null>(null);

function loadInitial(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // localStorage non disponibile (es. modalità privata): la watchlist resta solo in memoria.
    }
  }, [ids]);

  const value = useMemo<WatchlistState>(
    () => ({
      ids,
      isSaved: (id) => ids.has(id),
      toggle: (id) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
    }),
    [ids],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistState {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist deve essere usato dentro <WatchlistProvider>");
  return ctx;
}
