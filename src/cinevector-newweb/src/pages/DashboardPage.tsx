import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BottomMetricsFooter } from "../components/layout/BottomMetricsFooter";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { RightDetailPanel } from "../components/layout/RightDetailPanel";
import { TopHeader } from "../components/layout/TopHeader";
import { MovieDetailModal } from "../components/modal/MovieDetailModal";
import { ClusterChartView } from "../components/sphere/ClusterChartView";
import { MoviesWallView } from "../components/sphere/MoviesWallView";
import { PosterSphereView } from "../components/sphere/PosterSphereView";
import { SphereCanvas } from "../components/sphere/SphereCanvas";
import { SphereControlsBar } from "../components/sphere/SphereControlsBar";
import { SphereHintBar } from "../components/sphere/SphereHintBar";
import { useMovieData } from "../state/MovieDataContext";
import { useSelection } from "../state/SelectionContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5080";

export function DashboardPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { select, viewMode } = useSelection();
  const { isLoading, isError } = useMovieData();

  // Un deep-link diretto a /movie/:id seleziona anche il nodo corrispondente (se presente sulla sfera),
  // così chiudere il modal lascia il pannello destro coerente con il film appena visto.
  useEffect(() => {
    if (id) select(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-space-900 text-slate-300">
        <div className="glass-card flex items-center gap-3 rounded-xl px-6 py-4 text-sm">
          <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
          Connessione al motore vettoriale CineVector...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-space-900 p-6 text-center text-slate-300">
        <div className="glass-card max-w-md rounded-xl border border-red-500/30 p-6 text-sm">
          <p className="mb-1 font-semibold text-red-300">Impossibile contattare il backend</p>
          <p className="text-slate-400">
            Verifica che CineVector.Api sia avviata (es. <code className="text-cyan-300">docker compose up -d</code>) e raggiungibile su{" "}
            <code className="text-cyan-300">{API_BASE_URL}</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section
          data-purpose="three-viewport-section"
          role="region"
          aria-label="Mappa semantica tridimensionale delle relazioni tra film"
          className="relative min-w-0 flex-1 overflow-hidden"
        >
          {viewMode === "sphere" && (
            <>
              <SphereCanvas />
              <SphereHintBar />
            </>
          )}
          {viewMode === "cluster" && <ClusterChartView />}
          {viewMode === "network" && <MoviesWallView />}
          {viewMode === "posters" && <PosterSphereView />}
          <SphereControlsBar />
        </section>

        <RightDetailPanel />
      </main>

      <BottomMetricsFooter />

      {id && <MovieDetailModal movieId={id} onClose={() => navigate("/")} />}
    </div>
  );
}
