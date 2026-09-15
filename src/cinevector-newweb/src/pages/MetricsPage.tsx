import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { backfillEmbeddings, getDbLatency, getLogs, getSearchAnalytics, getSearchLatency, type MetricSeries } from "../api/admin";
import { recomputeClusters } from "../api/clusters";
import { getStatistics } from "../api/statistics";
import { Badge } from "../components/common/Badge";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { TopHeader } from "../components/layout/TopHeader";

const AXIS_COLOR = "#64748b";
const GRID_COLOR = "rgba(255,255,255,0.08)";
const TOOLTIP_STYLE = {
  background: "rgba(6,9,19,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#e2e8f0",
  fontSize: 12,
};
const SERIES_COLORS = ["#00f2fe", "#4facfe", "#a855f7", "#f59e0b", "#10b981"];

type Tab = "latency" | "analytics" | "logs" | "embeddings";
const TABS: { id: Tab; label: string }[] = [
  { id: "latency", label: "Latenza" },
  { id: "analytics", label: "Analisi Ricerca" },
  { id: "logs", label: "Log" },
  { id: "embeddings", label: "Embeddings" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function LatencySeriesChart({ series, color }: { series: MetricSeries; color: string }) {
  const data = series.points.map((p) => ({ time: formatTime(p.timestamp), avg: Math.round(p.average) }));

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">{series.series}</div>
      <ResponsiveContainer width="100%" height={150}>
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

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Latenza ricerca (per modalità)</div>
        {searchLatency && searchLatency.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {searchLatency.map((s, i) => (
              <LatencySeriesChart key={s.series} series={s} color={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Nessun dato ancora — esegui qualche ricerca per popolare il grafico.</p>
        )}
      </div>

      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Tempi query database (per operazione)</div>
        {dbLatency && dbLatency.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dbLatency.map((s, i) => (
              <LatencySeriesChart key={s.series} series={s} color={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Nessun dato ancora.</p>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data } = useQuery({ queryKey: ["search-analytics"], queryFn: () => getSearchAnalytics(24) });

  if (!data) return <p className="text-xs text-slate-500">Caricamento...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ricerche (24h)</div>
          <div className="mt-1 text-2xl font-bold text-white">{data.totalSearches}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Durata media</div>
          <div className="mt-1 text-2xl font-bold text-cyan-300">{Math.round(data.averageDurationMs)}ms</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Mix modalità</div>
          {data.byMode.length === 0 && <p className="text-xs text-slate-500">Nessun dato.</p>}
          <div className="space-y-1.5">
            {data.byMode.map((m) => (
              <div key={m.mode} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{m.mode}</span>
                <span className="font-mono text-slate-400">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Query più frequenti</div>
          {data.topQueries.length === 0 && <p className="text-xs text-slate-500">Nessuna query testuale registrata.</p>}
          <div className="space-y-1.5">
            {data.topQueries.map((q) => (
              <div key={q.query} className="flex items-center justify-between text-xs">
                <span className="truncate text-slate-300">{q.query}</span>
                <span className="ml-2 shrink-0 font-mono text-slate-400">{q.count}</span>
              </div>
            ))}
          </div>
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
      <div className="mb-3">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="glass-pill rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
        >
          <option value="" className="bg-space-900">Tutti i livelli</option>
          <option value="Warning" className="bg-space-900">Warning</option>
          <option value="Error" className="bg-space-900">Error</option>
          <option value="Fatal" className="bg-space-900">Fatal</option>
        </select>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Caricamento log...</p>}
      {data && data.length === 0 && <p className="text-xs text-slate-500">Nessuna riga di log per questo filtro.</p>}

      {data && data.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="whitespace-nowrap px-2 py-2">Timestamp</th>
                  <th className="px-2 py-2">Livello</th>
                  <th className="px-2 py-2">Messaggio</th>
                  <th className="px-2 py-2">Trace</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="whitespace-nowrap px-2 py-2.5 text-slate-400">{new Date(entry.timestamp).toLocaleString("it-IT")}</td>
                    <td className="px-2 py-2.5">
                      <Badge tone={entry.level === "Error" || entry.level === "Fatal" ? "amber" : "neutral"}>{entry.level}</Badge>
                    </td>
                    <td className="px-2 py-2.5 text-slate-200">{entry.message}</td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-slate-500" title={entry.traceId ?? undefined}>
                      {entry.traceId ? `${entry.traceId.slice(0, 8)}…` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    <div className="glass-card rounded-xl p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Coda embedding</div>
      <p className="mt-1 text-xs text-slate-400">
        {stats ? `${stats.moviesWithEmbedding} film indicizzati, ${stats.moviesPendingEmbedding} in coda.` : "Caricamento..."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => backfillMutation.mutate()}
          disabled={backfillMutation.isPending}
          className="rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-neon-cyan disabled:opacity-40"
        >
          {backfillMutation.isPending ? "Elaborazione..." : "Genera embedding mancanti"}
        </button>
        <button
          onClick={() => recomputeMutation.mutate()}
          disabled={recomputeMutation.isPending}
          className="glass-pill rounded-lg px-4 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-200"
        >
          {recomputeMutation.isPending ? "Ricalcolo..." : "Ricalcola cluster"}
        </button>
      </div>

      {backfillMutation.isSuccess && (
        <p className="mt-3 text-xs text-emerald-300">{backfillMutation.data.processed} embedding generati.</p>
      )}
      {recomputeMutation.isSuccess && (
        <p className="mt-3 text-xs text-emerald-300">{recomputeMutation.data.clusters} cluster ricalcolati.</p>
      )}
    </div>
  );
}

export function MetricsPage() {
  const [tab, setTab] = useState<Tab>("latency");

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section className="scrollbar-thin flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-neon-cyan">
              <Activity size={16} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Metriche &amp; Log</h1>
              <p className="text-xs text-slate-400">Latenza di ricerca, tempi query database, analisi d'uso e log applicativi — via OpenTelemetry.</p>
            </div>
          </div>

          <div className="glass-card mb-6 inline-flex gap-1 rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-cyan-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "latency" && <LatencyTab />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "logs" && <LogsTab />}
          {tab === "embeddings" && <EmbeddingsTab />}
        </section>
      </main>
    </div>
  );
}
