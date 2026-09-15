import { Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { FilterProvider } from "./state/FilterContext";
import { SelectionProvider } from "./state/SelectionContext";
import { WatchlistProvider } from "./state/WatchlistContext";

export default function App() {
  return (
    <FilterProvider>
      <SelectionProvider>
        <WatchlistProvider>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/movie/:id" element={<DashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </WatchlistProvider>
      </SelectionProvider>
    </FilterProvider>
  );
}
