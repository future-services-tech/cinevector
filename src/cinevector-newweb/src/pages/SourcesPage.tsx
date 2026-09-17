import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { createSource, deleteSource, getAdapterTypes, getSources, updateSource, type Source } from "../api/sources";
import { Badge } from "../components/common/Badge";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { TopHeader } from "../components/layout/TopHeader";

const EMPTY_FORM = { name: "", baseUrl: "", adapterType: "Manual", enabled: true };

export function SourcesPage() {
  const queryClient = useQueryClient();
  const { data: sources, isLoading } = useQuery({ queryKey: ["sources"], queryFn: getSources });
  const { data: adapterTypes } = useQuery({ queryKey: ["adapter-types"], queryFn: getAdapterTypes });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sources"] });

  const createMutation = useMutation({
    mutationFn: () => createSource(form),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateSource(editingId!, form),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSource(id),
    onSuccess: invalidate,
  });

  function startEdit(source: Source) {
    setEditingId(source.id);
    setForm({ name: source.name, baseUrl: source.baseUrl, adapterType: source.adapterType, enabled: source.enabled });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  const pendingMutation = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section className="scrollbar-thin flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-neon-cyan">
              <Database size={16} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink">Sorgenti</h1>
              <p className="text-xs text-slate-400">Gestione delle fonti di catalogo — TMDb, fonti manuali e ogni adapter compatibile registrato sul backend.</p>
            </div>
          </div>

          <div className="glass-card mb-6 space-y-3 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              {editingId ? "Modifica fonte" : "Nuova fonte"}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <input
                type="text"
                placeholder="Nome (es. TMDb)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="glass-pill min-w-[160px] flex-1 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <input
                type="text"
                placeholder="Base URL (informativo — non usato per adapter con endpoint fisso come Tmdb)"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                className="glass-pill min-w-[260px] flex-[2] rounded-lg px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <select
                value={form.adapterType}
                onChange={(e) => setForm({ ...form, adapterType: e.target.value })}
                className="glass-pill rounded-lg px-3 py-2 text-sm text-slate-100 outline-none"
              >
                {(adapterTypes ?? ["Manual"]).map((type) => (
                  <option key={type} value={type} className="bg-space-900">
                    {type === "Manual" ? "Manual (nessun crawling automatico)" : type}
                  </option>
                ))}
              </select>
              <label className="glass-pill flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="accent-cyan-400"
                />
                Abilitata
              </label>
            </div>

            {mutationError && (
              <p className="text-xs text-rose-400">Errore nel salvataggio della fonte. Verifica i campi e riprova.</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
                disabled={!form.name || !form.baseUrl || pendingMutation}
                className="rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-neon-cyan disabled:opacity-40"
              >
                {editingId ? "Salva modifiche" : "Crea fonte"}
              </button>
              {editingId && (
                <button onClick={cancelEdit} className="glass-pill rounded-lg px-4 py-2 text-xs font-semibold text-slate-200 hover:text-ink">
                  Annulla
                </button>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            {isLoading && <p className="text-xs text-slate-500">Caricamento...</p>}
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-2 py-2">Nome</th>
                    <th className="px-2 py-2">Base URL</th>
                    <th className="px-2 py-2">Adapter</th>
                    <th className="px-2 py-2">Stato</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sources?.map((source) => (
                    <tr key={source.id} className="border-b border-white/5">
                      <td className="px-2 py-2.5 font-semibold text-slate-100">{source.name}</td>
                      <td className="max-w-[280px] truncate px-2 py-2.5 text-slate-400">{source.baseUrl}</td>
                      <td className="px-2 py-2.5 font-mono text-slate-400">{source.adapterType}</td>
                      <td className="px-2 py-2.5">
                        <Badge tone={source.enabled ? "cyan" : "neutral"}>{source.enabled ? "Abilitata" : "Disabilitata"}</Badge>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => startEdit(source)} title="Modifica" className="glass-pill rounded-lg p-1.5 text-slate-300 hover:text-cyan-200">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(source.id)}
                            disabled={deleteMutation.isPending}
                            title="Elimina"
                            className="glass-pill rounded-lg p-1.5 text-slate-300 hover:text-rose-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sources && sources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-center text-slate-500">
                        Nessuna fonte configurata.
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
