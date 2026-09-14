import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSource, deleteSource, getSources, updateSource, type Source } from "../api/sources";

const EMPTY_FORM = { name: "", baseUrl: "", adapterType: "Manual", enabled: true };

export function SourcesPage() {
  const queryClient = useQueryClient();
  const { data: sources, isLoading } = useQuery({ queryKey: ["sources"], queryFn: getSources });
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

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Sources</h2>
          <p>Gestione delle fonti di catalogo (TMDb e future fonti).</p>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-title">{editingId ? "Modifica fonte" : "Nuova fonte"}</div>
        <div className="search-bar" style={{ marginTop: "0.75rem" }}>
          <input
            type="text"
            placeholder="Nome (es. TMDb)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Base URL"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            style={{ flex: 2 }}
          />
          <select value={form.adapterType} onChange={(e) => setForm({ ...form, adapterType: e.target.value })}>
            <option value="Tmdb">Tmdb</option>
            <option value="Manual">Manual</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Abilitata
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button
            className="btn btn--primary"
            disabled={!form.name || !form.baseUrl || createMutation.isPending || updateMutation.isPending}
            onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
          >
            {editingId ? "Salva modifiche" : "Crea fonte"}
          </button>
          {editingId && (
            <button className="btn btn--ghost" onClick={cancelEdit}>
              Annulla
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        {isLoading && <p className="muted">Caricamento...</p>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Base URL</th>
              <th>Adapter</th>
              <th>Stato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sources?.map((source) => (
              <tr key={source.id}>
                <td>{source.name}</td>
                <td className="muted">{source.baseUrl}</td>
                <td className="muted">{source.adapterType}</td>
                <td>
                  <span className={source.enabled ? "chip chip--primary" : "chip"}>
                    {source.enabled ? "Abilitata" : "Disabilitata"}
                  </span>
                </td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => startEdit(source)}>
                    Modifica
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => deleteMutation.mutate(source.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {sources && sources.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nessuna fonte configurata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
