import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMovies } from "../../api/movies";
import { useSelection } from "../../state/SelectionContext";
import { useSettings } from "../../state/SettingsContext";
import { MovieDetailModal } from "../modal/MovieDetailModal";
import { PosterSphereGrid, type PosterSphereImage } from "./PosterSphereGrid";

// Stesso criterio del vecchio progetto: la sfera di poster ha bisogno di più film per risultare piena.
const SPHERE_COUNT = 30;

/** Quarto modo di vista della dashboard: la sfera di poster in puro CSS (trascinabile, auto-rotante) del
 * progetto cinevector-web originale, qui riportata 1:1 come esplorazione visiva alternativa alla sfera
 * semantica 3D basata su embedding — questa mostra semplicemente un campione di film reali dal catalogo. */
export function PosterSphereView() {
  const { settings } = useSettings();
  const { autoRotate } = useSelection();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["movies-poster-sphere", SPHERE_COUNT],
    queryFn: () => getMovies(1, SPHERE_COUNT),
  });

  const images: PosterSphereImage[] = (data?.items ?? [])
    .filter((movie) => !!movie.posterUrl)
    .map((movie) => ({
      id: String(movie.id),
      src: movie.posterUrl!,
      alt: movie.title,
      title: movie.title,
      description: [movie.year, movie.rating != null ? `★ ${movie.rating.toFixed(1)}` : null].filter(Boolean).join(" · "),
    }));

  return (
    <div className="flex h-full flex-col items-center overflow-hidden p-6 pt-24">
      <div className="mb-4 max-w-lg shrink-0 text-center">
        <h2 className="text-sm font-bold text-white">Sfera Film</h2>
        <p className="text-xs text-slate-400">Trascina per ruotare, passa il mouse per ingrandire, clicca un poster per il dettaglio.</p>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Caricamento catalogo...</p>}

      <div className="flex flex-1 items-center justify-center">
        <PosterSphereGrid
          containerSize={560}
          sphereRadius={190}
          autoRotate={settings.animationsEnabled && autoRotate}
          images={images}
          onSelect={(image) => setSelectedId(image.id)}
        />
      </div>

      {selectedId && <MovieDetailModal movieId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
