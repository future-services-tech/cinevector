import { apiFetch } from "./client";

export interface CrawlError {
  url: string;
  errorType: string;
  message: string;
  createdAt: string;
}

export type CrawlQueryMode = "Popular" | "Title" | "Actor" | "Director" | "Producer";

export interface CrawlJob {
  id: number;
  sourceId: number;
  sourceName?: string | null;
  startedAt: string;
  completedAt?: string | null;
  status: string;
  queryMode: CrawlQueryMode;
  query?: string | null;
  pagesVisited: number;
  moviesFound: number;
  moviesCreated: number;
  moviesUpdated: number;
  errors: CrawlError[];
}

export interface StartCrawlRequest {
  mode?: CrawlQueryMode;
  query?: string;
}

export function getCrawlJobs() {
  return apiFetch<CrawlJob[]>("/api/crawl/jobs");
}

export function getCrawlJob(id: number) {
  return apiFetch<CrawlJob>(`/api/crawl/jobs/${id}`);
}

export function startCrawl(sourceId: number, request?: StartCrawlRequest) {
  return apiFetch<CrawlJob>(`/api/crawl/${sourceId}/start`, {
    method: "POST",
    body: JSON.stringify(request ?? { mode: "Popular" }),
  });
}

export function startAllCrawls() {
  return apiFetch<CrawlJob[]>("/api/crawl/start", { method: "POST" });
}

export function cancelCrawl(sourceId: number) {
  return apiFetch<{ jobId: number; cancelling: boolean }>(`/api/crawl/${sourceId}/cancel`, { method: "POST" });
}
