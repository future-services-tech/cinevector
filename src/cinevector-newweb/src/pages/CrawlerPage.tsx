import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Play, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../api/client";
import {
  cancelCrawl,
  cancelCrawlJob,
  deleteCrawlJob,
  getCrawlJobs,
  pauseCrawlJob,
  resumeCrawlJob,
  startCrawl,
  type CrawlQueryMode,
} from "../api/crawl";
import { getSources } from "../api/sources";
import { Badge } from "../components/common/Badge";
import { crawlStatusTone, StatusChip } from "../components/common/StatusChip";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { TopHeader } from "../components/layout/TopHeader";

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
  const [actingJobId, setActingJobId] = useState<number | null>(null);

  const { data: sources } = useQuery({ queryKey: ["sources"], queryFn: getSources });
  const { data: jobs, isLoading } = useQuery({ queryKey: ["crawl-jobs"], queryFn: getCrawlJobs, refetchInterval: 5000 });

  const currentModeOption = MODE_OPTIONS.find((m) => m.value === mode)!;
  const invalidateJobs = () => queryClient.invalidateQueries({ queryKey: ["crawl-jobs"] });

  const startMutation = useMutation({
    mutationFn: (sourceId: number) => {
      setActiveSourceId(sourceId);
      return startCrawl(sourceId, { mode, query: mode === "Popular" ? undefined : query.trim() });
    },
    onSuccess: () => {
      invalidateJobs();
      setActiveSourceId(null);
    },
    onError: () => setActiveSourceId(null),
  });

  const cancelMutation = useMutation({
    mutationFn: (sourceId: number) => cancelCrawl(sourceId),
    onSuccess: invalidateJobs,
  });

  const cancelJobMutation = useMutation({
    mutationFn: (jobId: number) => {
      setActingJobId(jobId);
      return cancelCrawlJob(jobId);
    },
    onSettled: () => setActingJobId(null),
    onSuccess: invalidateJobs,
  });

  const pauseJobMutation = useMutation({
    mutationFn: (jobId: number) => {
      setActingJobId(jobId);
      return pauseCrawlJob(jobId);
    },
    onSettled: () => setActingJobId(null),
    onSuccess: invalidateJobs,
  });

  const resumeJobMutation = useMutation({
    mutationFn: (jobId: number) => {
      setActingJobId(jobId);
      return resumeCrawlJob(jobId);
    },
    onSettled: () => setActingJobId(null),
    onSuccess: invalidateJobs,
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: number) => {
      setActingJobId(jobId);
      return deleteCrawlJob(jobId);
    },
    onSettled: () => setActingJobId(null),
    onSuccess: invalidateJobs,
  });

  const jobActionPending = (jobId: number) =>
    actingJobId === jobId &&
    (cancelJobMutation.isPending || pauseJobMutation.isPending || resumeJobMutation.isPending || deleteJobMutation.isPending);

  const canStart = mode === "Popular" || query.trim().length > 0;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section className="scrollbar-thin flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-neon-cyan">
              <Bot size={16} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Crawler &amp; Sync</h1>
              <p className="text-xs text-slate-400">Avvio ed esecuzione del crawler, pipeline di ingestion e stato dei job.</p>
            </div>
          </div>

          <div className="glass-card mb-6 space-y-3 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Criterio di scoperta</div>
            <p className="text-[11px] text-slate-400">
              Di default il crawler scarica i film più popolari del momento. Puoi restringerlo a un titolo o a una
              persona specifica (attore, regista, produttore) per raccogliere più film su quell'argomento.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CrawlQueryMode)}
                className="glass-pill rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-space-900">
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
                  className="glass-pill min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
              )}
            </div>
            {startMutation.isError && (
              <p className="text-xs text-rose-400">
                {startMutation.error instanceof ApiError
                  ? (JSON.parse(startMutation.error.message || "{}").error ?? startMutation.error.message)
                  : "Errore nell'avvio del crawl."}
              </p>
            )}
          </div>

          <div className="glass-card mb-6 rounded-xl p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Fonti</div>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-2 py-2">Nome</th>
                    <th className="px-2 py-2">Adapter</th>
                    <th className="px-2 py-2">Stato</th>
                    <th className="px-2 py-2">Ultimo crawl</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sources?.map((source) => (
                    <tr key={source.id} className="border-b border-white/5">
                      <td className="px-2 py-2.5 font-semibold text-slate-100">{source.name}</td>
                      <td className="px-2 py-2.5 font-mono text-slate-400">{source.adapterType}</td>
                      <td className="px-2 py-2.5">
                        <Badge tone={source.enabled ? "cyan" : "neutral"}>{source.enabled ? "Abilitata" : "Disabilitata"}</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-slate-400">
                        {source.lastCrawlAt ? new Date(source.lastCrawlAt).toLocaleString("it-IT") : "Mai"}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => startMutation.mutate(source.id)}
                            disabled={!canStart || (startMutation.isPending && activeSourceId === source.id)}
                            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-neon-cyan disabled:opacity-40"
                          >
                            <Play size={11} />
                            {startMutation.isPending && activeSourceId === source.id ? "Avvio..." : "Avvia crawl"}
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(source.id)}
                            disabled={cancelMutation.isPending}
                            className="glass-pill rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-rose-300"
                          >
                            Annulla
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sources && sources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-center text-slate-500">
                        Nessuna fonte configurata. Vai su Sorgenti per aggiungerne una.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Job recenti</div>
            {isLoading && <p className="text-xs text-slate-500">Caricamento...</p>}
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-2 py-2">Fonte</th>
                    <th className="px-2 py-2">Criterio</th>
                    <th className="px-2 py-2">Stato</th>
                    <th className="px-2 py-2">Avviato</th>
                    <th className="px-2 py-2">Pagine</th>
                    <th className="px-2 py-2">Trovati</th>
                    <th className="px-2 py-2">Creati</th>
                    <th className="px-2 py-2">Aggiornati</th>
                    <th className="px-2 py-2">Errori</th>
                    <th className="px-2 py-2">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs?.map((job) => {
                    const isActive = job.status === "Running" || job.status === "Paused";
                    const pending = jobActionPending(job.id);
                    return (
                      <tr key={job.id} className="border-b border-white/5">
                        <td className="px-2 py-2.5 font-semibold text-slate-100">{job.sourceName ?? job.sourceId}</td>
                        <td className="px-2 py-2.5 text-slate-400">
                          {modeLabel(job.queryMode)}
                          {job.query && `: "${job.query}"`}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusChip tone={crawlStatusTone(job.status)}>{job.status}</StatusChip>
                            {job.isOrphaned && (
                              <span
                                title="Il job risulta ancora attivo in DB ma nessuna istanza API lo sta gestendo davvero (es. riavvio del processo): è un job zombie, va fermato o eliminato manualmente."
                                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300"
                              >
                                ⚠ Zombie
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-slate-400">{new Date(job.startedAt).toLocaleString("it-IT")}</td>
                        <td className="px-2 py-2.5">{job.pagesVisited}</td>
                        <td className="px-2 py-2.5">{job.moviesFound}</td>
                        <td className="px-2 py-2.5">{job.moviesCreated}</td>
                        <td className="px-2 py-2.5">{job.moviesUpdated}</td>
                        <td className="px-2 py-2.5 text-slate-400">{job.errors.length}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {job.status === "Running" && !job.isOrphaned && (
                              <button
                                onClick={() => pauseJobMutation.mutate(job.id)}
                                disabled={pending}
                                title="Metti in pausa questo job"
                                className="glass-pill rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-cyan-200"
                              >
                                Pausa
                              </button>
                            )}
                            {job.status === "Paused" && !job.isOrphaned && (
                              <button
                                onClick={() => resumeJobMutation.mutate(job.id)}
                                disabled={pending}
                                title="Riprendi questo job"
                                className="glass-pill rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-cyan-200"
                              >
                                Riprendi
                              </button>
                            )}
                            {isActive && (
                              <button
                                onClick={() => cancelJobMutation.mutate(job.id)}
                                disabled={pending}
                                title="Ferma questo job"
                                className="glass-pill flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-amber-200"
                              >
                                <Square size={11} /> Ferma
                              </button>
                            )}
                            <button
                              onClick={() => deleteJobMutation.mutate(job.id)}
                              disabled={pending}
                              title="Elimina definitivamente il job (resta traccia solo nei log applicativi)"
                              className="glass-pill flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:text-rose-200"
                            >
                              <Trash2 size={11} /> Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {jobs && jobs.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-2 py-6 text-center text-slate-500">
                        Nessun job eseguito ancora.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
