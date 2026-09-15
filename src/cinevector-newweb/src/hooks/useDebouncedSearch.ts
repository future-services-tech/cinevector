import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { search } from "../api/search";
import type { SearchResultItemDto } from "../api/types";

export function useDebouncedSearch(query: string, delayMs = 300): { results: SearchResultItemDto[]; isLoading: boolean } {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query), delayMs);
    return () => clearTimeout(handle);
  }, [query, delayMs]);

  const trimmed = debounced.trim();
  const searchQuery = useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => search(trimmed, 6),
    enabled: trimmed.length > 0,
    staleTime: 30 * 1000,
  });

  return {
    results: trimmed ? (searchQuery.data?.results ?? []) : [],
    isLoading: searchQuery.isFetching,
  };
}
