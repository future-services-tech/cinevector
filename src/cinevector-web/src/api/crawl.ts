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
  /** True se lo stato è Running/Paused ma nessuna istanza API attiva lo sta gestendo davvero: un job zombie. */
  isOrphaned: boolean;
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

export function cancelCrawlJob(jobId: number) {
  return apiFetch<{ jobId: number; cancelling: boolean; reconciled: boolean }>(`/api/crawl/jobs/${jobId}/cancel`, {
    method: "POST",
  });
}

export function pauseCrawlJob(jobId: number) {
  return apiFetch<{ jobId: number; pausing: boolean }>(`/api/crawl/jobs/${jobId}/pause`, { method: "POST" });
}

export function resumeCrawlJob(jobId: number) {
  return apiFetch<{ jobId: number; resuming: boolean }>(`/api/crawl/jobs/${jobId}/resume`, { method: "POST" });
}

export function deleteCrawlJob(jobId: number) {
  return apiFetch<void>(`/api/crawl/jobs/${jobId}`, { method: "DELETE" });
}
