import { useEffect } from "react";
import { getMovieDetail } from "../../data";
import { CastGrid } from "./CastGrid";
import { ModalFooter } from "./ModalFooter";
import { ModalHeader } from "./ModalHeader";
import { SoundtrackPlayer } from "./SoundtrackPlayer";
import { TechnicalCredits } from "./TechnicalCredits";
import { TrailerPlayer } from "./TrailerPlayer";

export function MovieDetailModal({ movieId, onClose }: { movieId: string; onClose: () => void }) {
  const movie = getMovieDetail(movieId);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      id="trailerModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalMovieTitle"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md sm:p-6"
    >
      <div
        id="modalDialogContent"
        onClick={(e) => e.stopPropagation()}
        className="scrollbar-thin relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl shadow-cyan-950/60"
      >
        <ModalHeader movie={movie} onClose={onClose} />

        <div className="space-y-8 p-6">
          <TrailerPlayer posterUrl={movie.poster} tagline={movie.tags[0] ?? movie.title} title={movie.title} />
          <SoundtrackPlayer album={movie.album} tracks={movie.tracks} />
          <CastGrid cast={movie.cast} awardsNote={movie.awardsNote} />
          <TechnicalCredits credits={movie.credits} />
        </div>

        <ModalFooter movieId={movie.id} onClose={onClose} />
      </div>
    </div>
  );
}
