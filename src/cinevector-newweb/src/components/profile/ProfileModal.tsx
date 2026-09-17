import { Heart, Info, LogOut, ShieldCheck, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCount } from "../../lib/format";
import { useMovieData } from "../../state/MovieDataContext";
import { useWatchlist } from "../../state/WatchlistContext";

/** Non esiste ancora un sistema di autenticazione: tutti i dati anagrafici qui sotto sono fittizi (placeholder
 * per la UI), mentre i due contatori nelle statistiche sono reali (derivati dallo stato applicativo attuale). */
const MOCK_PROFILE = {
  name: "Max Dovere",
  email: "max.dovere@example.com",
  plan: "Accesso Anticipato",
  memberSince: "Settembre 2026",
};

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { movies } = useMovieData();
  const { ids } = useWatchlist();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Portal su document.body per lo stesso motivo di SettingsModal: il bottone che apre questo modal vive
  // dentro l'header (classe glass-card, backdrop-filter), che altrimenti diventerebbe il containing block
  // del "fixed inset-0" e manderebbe il modal fuori schermo invece di centrarlo sul viewport.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl shadow-cyan-950/60"
      >
        <div className="glass-card flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-bold text-white">Profilo</h2>
          <button onClick={onClose} aria-label="Chiudi" className="glass-pill rounded-full p-1.5 text-slate-300 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-lg font-bold text-white shadow-neon-cyan">
              CV
            </div>
            <div>
              <p className="text-sm font-bold text-white">{MOCK_PROFILE.name}</p>
              <p className="text-xs text-slate-400">{MOCK_PROFILE.email}</p>
            </div>
            <span className="glass-pill rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">
              {MOCK_PROFILE.plan}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-300">
                <Heart size={13} />
                <span className="text-lg font-bold text-white">{formatCount(ids.size)}</span>
              </div>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Preferiti</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-cyan-300">
                <ShieldCheck size={13} />
                <span className="text-lg font-bold text-white">{formatCount(movies.length)}</span>
              </div>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Film mappati</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Account</div>
            <div className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-slate-500">Membro dal</span>
              <span className="text-slate-200">{MOCK_PROFILE.memberSince}</span>
            </div>
          </div>

          <div className="glass-card flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3.5">
            <Info size={14} className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-[11px] leading-relaxed text-amber-100/80">
              L'autenticazione non è ancora disponibile: questi sono dati dimostrativi. Preferiti e conteggio film sono invece reali.
            </p>
          </div>

          <button
            disabled
            title="Autenticazione non ancora disponibile"
            className="glass-pill flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-slate-500"
          >
            <LogOut size={13} />
            Esci
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
