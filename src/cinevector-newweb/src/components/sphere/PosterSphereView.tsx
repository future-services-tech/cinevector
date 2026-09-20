import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getMovies } from "../../api/movies";
import { useSelection } from "../../state/SelectionContext";
import { useSettings, type AppSettings } from "../../state/SettingsContext";
import { MovieDetailModal } from "../modal/MovieDetailModal";
import { PosterSphereGrid, type PosterSphereImage } from "./PosterSphereGrid";

// containerSize/sphereRadius del vecchio progetto (560/190) come rapporto di riferimento per lo zoom.
const ZOOM_CONTAINER_SIZE: Record<AppSettings["posterSphereZoom"], number> = {
  compatta: 420,
  normale: 560,
  grande: 720,
};
const RADIUS_RATIO = 190 / 560;

/** Quarto modo di vista della dashboard: la sfera di poster in puro CSS (trascinabile, auto-rotante) del
 * progetto cinevector-web originale, qui riportata 1:1 come esplorazione visiva alternativa alla sfera
 * semantica 3D basata su embedding. Il catalogo cresce nel tempo, quindi mostra il campione di film a pagine
 * (dimensione pagina e zoom della sfera sono impostazioni salvate, non stato locale — vedi SettingsModal). */
export function PosterSphereView() {
  const { settings } = useSettings();
  const { autoRotate } = useSelection();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = settings.posterSpherePageSize;

  // La sfera è disegnata a coordinate pixel assolute (non CSS/percentuali): su schermi stretti va ridotta
  // davvero, non solo "contenuta" con max-width, altrimenti i poster ai bordi finirebbero fuori dal
  // contenitore visibile. Misuriamo lo spazio realmente disponibile e ci scaliamo dentro.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(720);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setAvailableWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Se l'utente cambia "Film per pagina" dalle Impostazioni mentre sta sfogliando, ripartiamo da pagina 1:
  // la pagina corrente non ha più lo stesso significato con un pageSize diverso.
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["movies-poster-sphere", page, pageSize],
    queryFn: () => getMovies(page, pageSize),
    placeholderData: keepPreviousData,
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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  // Un margine di sicurezza (32px) evita che i poster più esterni tocchino il bordo del contenitore misurato.
  const containerSize = Math.min(ZOOM_CONTAINER_SIZE[settings.posterSphereZoom], Math.max(220, availableWidth - 32));

  return (
    <div className="flex h-full flex-col items-center overflow-hidden p-6 pt-24">
      <div className="mb-3 max-w-lg shrink-0 text-center">
        <h2 className="text-sm font-bold text-ink">Sfera Film</h2>
        <p className="text-xs text-slate-400">Trascina per ruotare, scorri per zoomare, clicca un poster per il dettaglio.</p>
      </div>

      <div className="glass-card mb-4 flex shrink-0 items-center gap-3 rounded-lg px-3 py-1.5">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-md p-1.5 text-slate-300 hover:text-cyan-200 disabled:opacity-30"
          aria-label="Pagina precedente"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-mono text-[11px] text-slate-300">
          Pagina {page} / {totalPages} · {data?.total ?? 0} film {isFetching && "· caricamento..."}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md p-1.5 text-slate-300 hover:text-cyan-200 disabled:opacity-30"
          aria-label="Pagina successiva"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Caricamento catalogo...</p>}

      <div ref={wrapperRef} className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
        <PosterSphereGrid
          containerSize={containerSize}
          sphereRadius={containerSize * RADIUS_RATIO}
          autoRotate={settings.animationsEnabled && autoRotate}
          images={images}
          onSelect={(image) => setSelectedId(image.id)}
        />
      </div>

      {selectedId && <MovieDetailModal movieId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
