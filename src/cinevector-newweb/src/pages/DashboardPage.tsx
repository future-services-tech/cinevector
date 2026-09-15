import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMovieById } from "../data";
import { BottomMetricsFooter } from "../components/layout/BottomMetricsFooter";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { RightDetailPanel } from "../components/layout/RightDetailPanel";
import { TopHeader } from "../components/layout/TopHeader";
import { MovieDetailModal } from "../components/modal/MovieDetailModal";
import { SphereCanvas } from "../components/sphere/SphereCanvas";
import { SphereControlsBar } from "../components/sphere/SphereControlsBar";
import { SphereHintBar } from "../components/sphere/SphereHintBar";
import { useSelection } from "../state/SelectionContext";

export function DashboardPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { select } = useSelection();

  // Un deep-link diretto a /movie/:id seleziona anche il nodo corrispondente sulla sfera,
  // così chiudere il modal lascia il pannello destro coerente con il film appena visto.
  useEffect(() => {
    if (id && getMovieById(id)) select(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section data-purpose="three-viewport-section" role="region" aria-label="Mappa semantica tridimensionale delle relazioni tra film" className="relative flex-1">
          <SphereCanvas />
          <SphereControlsBar />
          <SphereHintBar />
        </section>

        <RightDetailPanel />
      </main>

      <BottomMetricsFooter />

      {id && getMovieById(id) && <MovieDetailModal movieId={id} onClose={() => navigate("/")} />}
    </div>
  );
}
