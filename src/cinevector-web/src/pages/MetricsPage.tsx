import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { backfillEmbeddings, getDbLatency, getLogs, getSearchAnalytics, getSearchLatency } from "../api/admin";
import { getStatistics } from "../api/statistics";
import { recomputeClusters } from "../api/clusters";

const AXIS_COLOR = "#a9b7c6";
const GRID_COLOR = "rgba(255,255,255,0.08)";
const TOOLTIP_STYLE = {
  background: "#0d1c2d",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  color: "#d4e4fa",
  fontSize: 12,
};

type Tab = "latency" | "analytics" | "logs" | "embeddings";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function LatencySeriesChart({ series, color }: { series: { series: string; points: { timestamp: string; average: number }[] }; color: string }) {
  const data = series.points.map((p) => ({ time: formatTime(p.timestamp), avg: Math.round(p.average) }));

  return (
    <div className="panel panel--tight">
      <div className="panel-title" style={{ fontSize: 13 }}>{series.series}</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="time" stroke={AXIS_COLOR} fontSize={10} tickLine={false} />
          <YAxis stroke={AXIS_COLOR} fontSize={10} tickLine={false} unit="ms" />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="avg" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function LatencyTab() {
  const { data: searchLatency } = useQuery({ queryKey: ["metrics", "search-latency"], queryFn: () => getSearchLatency(6), refetchInterval: 15000 });
  const { data: dbLatency } = useQuery({ queryKey: ["metrics", "db-latency"], queryFn: () => getDbLatency(6), refetchInterval: 15000 });

  const colors = ["#00d2ff", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div>
      <div className="section-heading">
        <h2 style={{ fontSize: 14 }}>Latenza ricerca (per modalità)</h2>
      </div>
      {searchLatency && searchLatency.length > 0 ? (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: "1.5rem" }}>
          {searchLatency.map((s, i) => (
            <LatencySeriesChart key={s.series} series={s} color={colors[i % colors.length]} />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">Nessun dato ancora — esegui qualche ricerca per popolare il grafico.</div>
      )}

      <div className="section-heading">
        <h2 style={{ fontSize: 14 }}>Tempi query database (per operazione)</h2>
      </div>
      {dbLatency && dbLatency.length > 0 ? (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {dbLatency.map((s, i) => (
            <LatencySeriesChart key={s.series} series={s} color={colors[i % colors.length]} />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">Nessun dato ancora.</div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const { data } = useQuery({ queryKey: ["search-analytics"], queryFn: () => getSearchAnalytics(24) });

  if (!data) return <div className="panel empty-state">Caricamento...</div>;

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-card__label">Ricerche (24h)</div>
          <div className="stat-card__value">{data.totalSearches}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Durata media</div>
          <div className="stat-card__value">{Math.round(data.averageDurationMs)}ms</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel">
          <div className="panel-title">Mix modalità</div>
          {data.byMode.length === 0 && <p className="muted">Nessun dato.</p>}
          <table className="data-table">
            <tbody>
              {data.byMode.map((m) => (
                <tr key={m.mode}>
                  <td>{m.mode}</td>
                  <td style={{ textAlign: "right" }}>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-title">Query più frequenti</div>
          {data.topQueries.length === 0 && <p className="muted">Nessuna query testuale registrata.</p>}
          <table className="data-table">
            <tbody>
              {data.topQueries.map((q) => (
                <tr key={q.query}>
                  <td>{q.query}</td>
                  <td style={{ textAlign: "right" }}>{q.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LogsTab() {
  const [level, setLevel] = useState("Warning");
  const { data, isLoading } = useQuery({
    queryKey: ["logs", level],
    queryFn: () => getLogs(level || undefined, 100),
    refetchInterval: 10000,
  });

  return (
    <div>
      <div className="search-bar">
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Tutti i livelli</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
          <option value="Fatal">Fatal</option>
        </select>
      </div>

      {isLoading && <div className="panel empty-state">Caricamento log...</div>}

      {data && data.length === 0 && <div className="panel empty-state">Nessuna riga di log per questo filtro.</div>}

      {data && data.length > 0 && (
        <div className="panel panel--tight">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Livello</th>
                <th>Messaggio</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, i) => (
                <tr key={i}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {new Date(entry.timestamp).toLocaleString("it-IT")}
                  </td>
                  <td>
                    <span className={`chip ${entry.level === "Error" || entry.level === "Fatal" ? "chip--warning" : ""}`}>
                      {entry.level}
                    </span>
                  </td>
                  <td>{entry.message}</td>
                  <td className="muted" style={{ fontSize: 11, fontFamily: "monospace" }} title={entry.traceId ?? undefined}>
                    {entry.traceId ? `${entry.traceId.slice(0, 8)}…` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmbeddingsTab() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({ queryKey: ["statistics"], queryFn: getStatistics });

  const backfillMutation = useMutation({
    mutationFn: () => backfillEmbeddings(50),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["statistics"] }),
  });

  const recomputeMutation = useMutation({
    mutationFn: recomputeClusters,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["statistics"] }),
  });

  return (
    <div className="panel">
      <div className="panel-title">Coda embedding</div>
      <p className="muted" style={{ marginTop: 4 }}>
        {stats ? `${stats.moviesWithEmbedding} film indicizzati, ${stats.moviesPendingEmbedding} in coda.` : "Caricamento..."}
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button className="btn btn--primary" onClick={() => backfillMutation.mutate()} disabled={backfillMutation.isPending}>
          {backfillMutation.isPending ? "Elaborazione..." : "Genera embedding mancanti"}
        </button>
        <button className="btn btn--ghost" onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
          {recomputeMutation.isPending ? "Ricalcolo..." : "Ricalcola cluster"}
        </button>
      </div>

      {backfillMutation.isSuccess && (
        <p className="muted" style={{ marginTop: "0.75rem" }}>{backfillMutation.data.processed} embedding generati.</p>
      )}
      {recomputeMutation.isSuccess && (
        <p className="muted" style={{ marginTop: "0.75rem" }}>{recomputeMutation.data.clusters} cluster ricalcolati.</p>
      )}
    </div>
  );
}

export function MetricsPage() {
  const [tab, setTab] = useState<Tab>("latency");

  const tabs: { id: Tab; label: string }[] = [
    { id: "latency", label: "Latenza" },
    { id: "analytics", label: "Analisi Ricerca" },
    { id: "logs", label: "Log" },
    { id: "embeddings", label: "Embeddings" },
  ];

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Metrics & Logs</h2>
          <p>Latenza di ricerca, tempi query database, analisi d'uso e log applicativi — via OpenTelemetry.</p>
        </div>
      </div>

      <div className="facet-list">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "filter-chip" : "facet-chip"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "latency" && <LatencyTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "logs" && <LogsTab />}
      {tab === "embeddings" && <EmbeddingsTab />}
    </div>
  );
}
