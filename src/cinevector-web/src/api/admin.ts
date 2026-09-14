import { apiFetch } from "./client";

export interface MetricPoint {
  timestamp: string;
  average: number;
  max: number;
  count: number;
}

export interface MetricSeries {
  series: string;
  points: MetricPoint[];
}

export interface ModeCount {
  mode: string;
  count: number;
}

export interface QueryCount {
  query: string;
  count: number;
}

export interface VolumePoint {
  timestamp: string;
  count: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  averageDurationMs: number;
  byMode: ModeCount[];
  topQueries: QueryCount[];
  volumeOverTime: VolumePoint[];
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  exception?: string | null;
}

export function getSearchLatency(hours = 6) {
  return apiFetch<MetricSeries[]>(`/api/admin/metrics/search-latency?hours=${hours}`);
}

export function getDbLatency(hours = 6) {
  return apiFetch<MetricSeries[]>(`/api/admin/metrics/db-latency?hours=${hours}`);
}

export function getSearchAnalytics(hours = 24) {
  return apiFetch<SearchAnalytics>(`/api/admin/search-analytics?hours=${hours}`);
}

export function getLogs(level?: string, take = 100) {
  const qs = new URLSearchParams({ take: String(take) });
  if (level) qs.set("level", level);
  return apiFetch<LogEntry[]>(`/api/admin/logs?${qs.toString()}`);
}

export function backfillEmbeddings(batchSize = 50) {
  return apiFetch<{ processed: number }>(`/api/embeddings/backfill?batchSize=${batchSize}`, { method: "POST" });
}
