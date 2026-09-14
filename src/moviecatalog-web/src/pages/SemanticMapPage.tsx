import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getClusters } from "../api/clusters";
import { PointCloudScene, type ScenePoint } from "../components/three/PointCloudScene";
import { PointSphereGrid } from "../components/three/PointSphereGrid";
import { colorForIndex } from "../lib/clusterColors";

const COORD_SCALE = 10;

function sizeForMemberCount(count: number) {
  return 0.25 + Math.min(count, 20) * 0.05;
}

export function SemanticMapPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"orbit" | "sphere">("orbit");

  const { data: clusters, isLoading, isError, error } = useQuery({
    queryKey: ["clusters"],
    queryFn: getClusters,
  });

  const points: ScenePoint[] = (clusters ?? []).map((cluster, index) => ({
    id: cluster.id,
    position: [cluster.coordX * COORD_SCALE, cluster.coordY * COORD_SCALE, cluster.coordZ * COORD_SCALE],
    size: sizeForMemberCount(cluster.memberCount),
    color: colorForIndex(index),
    label: cluster.label,
    subtitle: `${cluster.memberCount} film`,
  }));

  const selectedCluster = clusters?.find((c) => c.id === selectedId) ?? null;

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Mappa Semantica 3D</h2>
          <p>Ogni sfera è un cluster tematico scoperto automaticamente dagli embedding dei film. Trascina per ruotare, scorri per zoomare, clicca per selezionare.</p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button className={viewMode === "orbit" ? "filter-chip" : "facet-chip"} onClick={() => setViewMode("orbit")}>
            Orbita 3D
          </button>
          <button className={viewMode === "sphere" ? "filter-chip" : "facet-chip"} onClick={() => setViewMode("sphere")}>
            Sfera
          </button>
        </div>
      </div>

      {isLoading && <div className="panel empty-state">Caricamento cluster...</div>}
      {isError && <div className="panel empty-state">Errore nel caricamento dei cluster: {(error as Error).message}</div>}

      {clusters && clusters.length === 0 && (
        <div className="panel empty-state">
          Nessun cluster disponibile. Vai su Metrics &amp; Logs → Embeddings per generare gli embedding, poi richiedi
          un ricalcolo cluster dall'amministrazione.
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem" }}>
          <div className="panel panel--tight" style={{ height: 560, overflow: "hidden" }}>
            {viewMode === "orbit" ? (
              <PointCloudScene points={points} selectedId={selectedId} onSelect={setSelectedId} />
            ) : (
              <PointSphereGrid points={points} selectedId={selectedId} onSelect={setSelectedId} height={560} />
            )}
          </div>

          <div className="panel">
            {selectedCluster ? (
              <div>
                <span className="chip chip--primary">Cluster</span>
                <h3 style={{ marginTop: "0.5rem" }}>{selectedCluster.label}</h3>
                <p className="muted" style={{ marginTop: "0.35rem" }}>
                  {selectedCluster.description}
                </p>
                <p className="muted" style={{ marginTop: "0.5rem" }}>
                  {selectedCluster.memberCount} film in questo cluster
                </p>
                <button
                  className="btn btn--primary"
                  style={{ marginTop: "1rem", width: "100%" }}
                  onClick={() => navigate(`/semantic-map/clusters/${selectedCluster.id}`)}
                >
                  Esplora cluster →
                </button>
              </div>
            ) : (
              <p className="muted">Seleziona una sfera per vedere i dettagli del cluster.</p>
            )}
          </div>
        </div>
      )}

      {clusters && clusters.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div className="section-heading">
            <h2 style={{ fontSize: 14 }}>Tutti i cluster</h2>
          </div>
          <div className="facet-list">
            {clusters.map((cluster, index) => (
              <button
                key={cluster.id}
                className="chip chip--clickable"
                style={selectedId === cluster.id ? { borderColor: colorForIndex(index), color: colorForIndex(index) } : undefined}
                onClick={() => setSelectedId(cluster.id)}
              >
                {cluster.label} ({cluster.memberCount})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
