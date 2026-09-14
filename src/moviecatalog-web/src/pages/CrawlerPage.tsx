import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import { cancelCrawl, getCrawlJobs, startCrawl, type CrawlQueryMode } from "../api/crawl";
import { getSources } from "../api/sources";

function statusChipClass(status: string) {
  switch (status) {
    case "Running":
      return "status-chip";
    case "Failed":
      return "status-chip status-chip--error";
    case "Cancelled":
      return "status-chip status-chip--warning";
    default:
      return "status-chip status-chip--idle";
  }
}

const MODE_OPTIONS: { value: CrawlQueryMode; label: string; placeholder?: string }[] = [
  { value: "Popular", label: "Più popolari (nessun filtro)" },
  { value: "Title", label: "Titolo", placeholder: "Es. Inception" },
  { value: "Actor", label: "Attore / Attrice", placeholder: "Es. Zendaya" },
  { value: "Director", label: "Regista", placeholder: "Es. Christopher Nolan" },
  { value: "Producer", label: "Produttore", placeholder: "Es. Kevin Feige" },
];

function modeLabel(mode: string) {
  return MODE_OPTIONS.find((m) => m.value === mode)?.label ?? mode;
}

export function CrawlerPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<CrawlQueryMode>("Popular");
  const [query, setQuery] = useState("");
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);

  const { data: sources } = useQuery({ queryKey: ["sources"], queryFn: getSources });
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["crawl-jobs"],
    queryFn: getCrawlJobs,
    refetchInterval: 5000,
  });

  const currentModeOption = MODE_OPTIONS.find((m) => m.value === mode)!;

  const startMutation = useMutation({
    mutationFn: (sourceId: number) => {
      setActiveSourceId(sourceId);
      return startCrawl(sourceId, { mode, query: mode === "Popular" ? undefined : query.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crawl-jobs"] });
      setActiveSourceId(null);
    },
    onError: () => setActiveSourceId(null),
  });

  const cancelMutation = useMutation({
    mutationFn: (sourceId: number) => cancelCrawl(sourceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crawl-jobs"] }),
  });

  const canStart = mode === "Popular" || query.trim().length > 0;

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Crawler & Sync</h2>
          <p>Monitoraggio ed esecuzione del crawler, pipeline di ingestion e stato dei job.</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">Criterio di scoperta</div>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Di default il crawler scarica i film più popolari del momento. Puoi restringerlo a un titolo o a una
          persona specifica (attore, regista, produttore) per raccogliere più film su quell'argomento.
        </p>
        <div className="search-bar" style={{ marginTop: "0.75rem" }}>
          <select value={mode} onChange={(e) => setMode(e.target.value as CrawlQueryMode)}>
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {mode !== "Popular" && (
            <input
              type="text"
              placeholder={currentModeOption.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
          )}
        </div>
        {startMutation.isError && (
          <p style={{ color: "var(--color-error)", fontSize: 12, marginTop: "0.5rem" }}>
            {startMutation.error instanceof ApiError
              ? (JSON.parse(startMutation.error.message || "{}").error ?? startMutation.error.message)
              : "Errore nell'avvio del crawl."}
          </p>
        )}
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">Fonti</div>
        <table className="data-table" style={{ marginTop: "0.5rem" }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Adapter</th>
              <th>Stato</th>
              <th>Ultimo crawl</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sources?.map((source) => (
              <tr key={source.id}>
                <td>{source.name}</td>
                <td className="muted">{source.adapterType}</td>
                <td>
                  <span className={source.enabled ? "chip chip--primary" : "chip"}>
                    {source.enabled ? "Abilitata" : "Disabilitata"}
                  </span>
                </td>
                <td className="muted">
                  {source.lastCrawlAt ? new Date(source.lastCrawlAt).toLocaleString("it-IT") : "Mai"}
                </td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => startMutation.mutate(source.id)}
                    disabled={!canStart || (startMutation.isPending && activeSourceId === source.id)}
                  >
                    {startMutation.isPending && activeSourceId === source.id ? "Avvio..." : "Avvia crawl"}
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => cancelMutation.mutate(source.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Annulla
                  </button>
                </td>
              </tr>
            ))}
            {sources && sources.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nessuna fonte configurata. Vai su Sources per aggiungerne una.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-title">Job recenti</div>
        {isLoading && <p className="muted">Caricamento...</p>}
        <table className="data-table" style={{ marginTop: "0.5rem" }}>
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Criterio</th>
              <th>Stato</th>
              <th>Avviato</th>
              <th>Pagine</th>
              <th>Trovati</th>
              <th>Creati</th>
              <th>Aggiornati</th>
              <th>Errori</th>
            </tr>
          </thead>
          <tbody>
            {jobs?.map((job) => (
              <tr key={job.id}>
                <td>{job.sourceName ?? job.sourceId}</td>
                <td className="muted">
                  {modeLabel(job.queryMode)}
                  {job.query && `: "${job.query}"`}
                </td>
                <td>
                  <span className={statusChipClass(job.status)}>
                    <span className="status-chip__dot" />
                    {job.status}
                  </span>
                </td>
                <td className="muted">{new Date(job.startedAt).toLocaleString("it-IT")}</td>
                <td>{job.pagesVisited}</td>
                <td>{job.moviesFound}</td>
                <td>{job.moviesCreated}</td>
                <td>{job.moviesUpdated}</td>
                <td className={job.errors.length > 0 ? "muted" : undefined}>{job.errors.length}</td>
              </tr>
            ))}
            {jobs && jobs.length === 0 && (
              <tr>
                <td colSpan={9} className="muted">
                  Nessun job eseguito ancora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
