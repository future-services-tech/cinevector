import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { MoviesListPage } from "./pages/MoviesListPage";
import { MovieDetailPage } from "./pages/MovieDetailPage";
import { SourcesPage } from "./pages/SourcesPage";
import { CrawlerPage } from "./pages/CrawlerPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { MetricsPage } from "./pages/MetricsPage";
import { SettingsPage } from "./pages/SettingsPage";

// Caricate on-demand: three.js + @react-three/fiber/drei pesano ~500kB e servono solo qui,
// non alle altre pagine (dashboard, ricerca, admin).
const SemanticMapPage = lazy(() => import("./pages/SemanticMapPage").then((m) => ({ default: m.SemanticMapPage })));
const ClusterDetailPage = lazy(() =>
  import("./pages/ClusterDetailPage").then((m) => ({ default: m.ClusterDetailPage })),
);

function ThreeDLoadingFallback() {
  return <div className="panel empty-state">Caricamento vista 3D...</div>;
}

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/movies" element={<MoviesListPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route
          path="/semantic-map"
          element={
            <Suspense fallback={<ThreeDLoadingFallback />}>
              <SemanticMapPage />
            </Suspense>
          }
        />
        <Route
          path="/semantic-map/clusters/:id"
          element={
            <Suspense fallback={<ThreeDLoadingFallback />}>
              <ClusterDetailPage />
            </Suspense>
          }
        />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/crawler" element={<CrawlerPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
