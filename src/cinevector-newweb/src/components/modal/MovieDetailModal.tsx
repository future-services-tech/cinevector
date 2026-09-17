import { useEffect } from "react";
import { useMovieDetail } from "../../hooks/useMovieDetail";
import { useSpotifyMatch } from "../../hooks/useSpotifyMatch";
import { useSettings } from "../../state/SettingsContext";
import { CastGrid } from "./CastGrid";
import { ModalFooter } from "./ModalFooter";
import { ModalHeader } from "./ModalHeader";
import { SoundtrackPlayer } from "./SoundtrackPlayer";
import { TechnicalCredits } from "./TechnicalCredits";
import { TrailerPlayer } from "./TrailerPlayer";

export function MovieDetailModal({ movieId, onClose }: { movieId: string; onClose: () => void }) {
  const { detail, isLoading, isError } = useMovieDetail(movieId);
  const { settings } = useSettings();
  // Cerca un match reale su Spotify (titolo film + "soundtrack"): se trova anteprime disponibili le usa al
  // posto della colonna sonora sintetica, altrimenti resta il comportamento di sempre (fallback silenzioso).
  // Disattivabile dalle Impostazioni per evitare chiamate inutili quando l'account non è collegato.
  const spotifyMatch = useSpotifyMatch(settings.spotifyAutoMatchEnabled ? (detail?.title ?? null) : null);
  const hasRealSoundtrack = spotifyMatch.tracks.length > 0 && spotifyMatch.album !== null;

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
        className="scrollbar-thin relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-y-auto rounded-2xl border border-cyan-500/30 bg-space-900/95 shadow-2xl shadow-cyan-950/60"
      >
        {isLoading && (
          <div className="flex h-72 items-center justify-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
            Caricamento scheda film...
          </div>
        )}

        {!isLoading && (isError || !detail) && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-400">
            <p>Impossibile caricare i dettagli di questo film.</p>
            <button onClick={onClose} className="glass-pill rounded-lg px-4 py-2 text-xs font-semibold text-slate-200 hover:text-ink">
              Chiudi
            </button>
          </div>
        )}

        {!isLoading && detail && (
          <>
            <ModalHeader movie={detail} onClose={onClose} />

            <div className="space-y-8 p-6">
              <div data-purpose="synopsis-section">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Trama</div>
                <p className="text-sm leading-relaxed text-slate-300">{detail.synopsis}</p>
              </div>

              <TrailerPlayer posterUrl={detail.poster} tagline={detail.tags[0] ?? detail.title} title={detail.title} />
              <SoundtrackPlayer
                album={hasRealSoundtrack ? spotifyMatch.album! : detail.album}
                tracks={hasRealSoundtrack ? spotifyMatch.tracks : detail.tracks}
              />
              <CastGrid cast={detail.cast} />
              <TechnicalCredits credits={detail.credits} />
            </div>

            <ModalFooter movieId={detail.id} onClose={onClose} />
          </>
        )}
      </div>
    </div>
  );
}
