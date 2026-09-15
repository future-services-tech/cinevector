import { apiFetch } from "./client";
import type { SearchResponseDto } from "./types";

export function search(query: string, pageSize = 6): Promise<SearchResponseDto> {
  const params = new URLSearchParams({ query, pageSize: String(pageSize) });
  return apiFetch<SearchResponseDto>(`/api/search?${params.toString()}`);
}
