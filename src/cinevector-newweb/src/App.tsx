import { Route, Routes } from "react-router-dom";
import { NotificationWatcher } from "./components/NotificationWatcher";
import { ThemeEffect } from "./components/ThemeEffect";
import { CatalogPage } from "./pages/CatalogPage";
import { CrawlerPage } from "./pages/CrawlerPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MetricsPage } from "./pages/MetricsPage";
import { MusicPage } from "./pages/MusicPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SourcesPage } from "./pages/SourcesPage";
import { SpotifyCallbackPage } from "./pages/SpotifyCallbackPage";
import { FilterProvider } from "./state/FilterContext";
import { LayoutProvider } from "./state/LayoutContext";
import { MovieDataProvider } from "./state/MovieDataContext";
import { SelectionProvider } from "./state/SelectionContext";
import { SettingsProvider } from "./state/SettingsContext";
import { WatchlistProvider } from "./state/WatchlistContext";

export default function App() {
  return (
    <SettingsProvider>
      <MovieDataProvider>
        <FilterProvider>
          <SelectionProvider>
            <WatchlistProvider>
              <LayoutProvider>
                <ThemeEffect />
                <NotificationWatcher />
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/movie/:id" element={<DashboardPage />} />
                  <Route path="/catalogo" element={<CatalogPage />} />
                  <Route path="/sources" element={<SourcesPage />} />
                  <Route path="/crawler" element={<CrawlerPage />} />
                  <Route path="/metrics" element={<MetricsPage />} />
                  <Route path="/music" element={<MusicPage />} />
                  <Route path="/callback" element={<SpotifyCallbackPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </LayoutProvider>
            </WatchlistProvider>
          </SelectionProvider>
        </FilterProvider>
      </MovieDataProvider>
    </SettingsProvider>
  );
}
