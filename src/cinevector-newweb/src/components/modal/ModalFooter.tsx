import { Heart } from "lucide-react";
import { useWatchlist } from "../../state/WatchlistContext";

export function ModalFooter({ movieId, onClose }: { movieId: string; onClose: () => void }) {
  const { isSaved, toggle } = useWatchlist();
  const saved = isSaved(movieId);

  return (
    <div className="glass-card sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-white/5 px-6 py-3.5">
      <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Streaming 4K disponibile su CineVector
      </span>
      <div className="flex gap-2">
        <button onClick={onClose} className="glass-pill rounded-lg px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white">
          Chiudi Scheda
        </button>
        <button
          onClick={() => toggle(movieId)}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold ${
            saved ? "bg-pink-500/20 text-pink-300" : "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white"
          }`}
        >
          <Heart size={13} fill={saved ? "currentColor" : "none"} />
          {saved ? "Salvato" : "Salva nei Preferiti"}
        </button>
      </div>
    </div>
  );
}
