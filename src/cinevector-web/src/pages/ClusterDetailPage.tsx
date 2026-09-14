import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCluster, getClusterMovies } from "../api/clusters";
import { PointCloudScene, type ScenePoint } from "../components/three/PointCloudScene";
import { PointSphereGrid } from "../components/three/PointSphereGrid";
import { colorForIndex } from "../lib/clusterColors";

const COORD_SCALE = 12;

export function ClusterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clusterId = Number(id);
  const navigate = useNavigate();
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"orbit" | "sphere">("orbit");

  const { data: cluster } = useQuery({
    queryKey: ["cluster", clusterId],
    queryFn: () => getCluster(clusterId),
    enabled: Number.isFinite(clusterId),
  });

  const { data: movies, isLoading, isError, error } = useQuery({
    queryKey: ["cluster-movies", clusterId],
    queryFn: () => getClusterMovies(clusterId),
    enabled: Number.isFinite(clusterId),
  });

  const points: ScenePoint[] = (movies ?? []).map((movie, index) => ({
    id: movie.id,
    position: [movie.coordX * COORD_SCALE, movie.coordY * COORD_SCALE, movie.coordZ * COORD_SCALE],
    size: 0.3,
    color: colorForIndex(index % 12),
    label: movie.title,
    subtitle: [movie.year, movie.rating != null ? `★ ${movie.rating.toFixed(1)}` : null].filter(Boolean).join(" · ") || undefined,
  }));

  const selectedMovie = movies?.find((m) => m.id === selectedMovieId) ?? null;

  return (
    <div>
      <div className="section-heading">
        <div>
          <p className="muted" style={{ marginBottom: 4 }}>
            <Link to="/semantic-map">← Mappa Semantica 3D</Link>
          </p>
          <h2>{cluster?.label ?? "Cluster"}</h2>
          <p>{cluster?.description}</p>
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

      {isLoading && <div className="panel empty-state">Caricamento film del cluster...</div>}
      {isError && <div className="panel empty-state">Errore: {(error as Error).message}</div>}

      {movies && movies.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem" }}>
          <div className="panel panel--tight" style={{ height: 560, overflow: "hidden" }}>
            {viewMode === "orbit" ? (
              <PointCloudScene points={points} selectedId={selectedMovieId} onSelect={setSelectedMovieId} />
            ) : (
              <PointSphereGrid points={points} selectedId={selectedMovieId} onSelect={setSelectedMovieId} height={560} />
            )}
          </div>

          <div className="panel">
            {selectedMovie ? (
              <div>
                {selectedMovie.posterUrl && (
                  <img
                    src={selectedMovie.posterUrl}
                    alt={selectedMovie.title}
                    style={{ width: "100%", borderRadius: "0.5rem", marginBottom: "0.75rem" }}
                  />
                )}
                <h3>{selectedMovie.title}</h3>
                <p className="muted">
                  {selectedMovie.year ?? "—"} {selectedMovie.rating != null && `· ★ ${selectedMovie.rating.toFixed(1)}`}
                </p>
                {selectedMovie.genres.length > 0 && <p className="muted">{selectedMovie.genres.join(", ")}</p>}
                <button
                  className="btn btn--primary"
                  style={{ marginTop: "1rem", width: "100%" }}
                  onClick={() => navigate(`/movies/${selectedMovie.id}`)}
                >
                  Apri dettaglio film →
                </button>
              </div>
            ) : (
              <p className="muted">Seleziona un film per vedere i dettagli.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
