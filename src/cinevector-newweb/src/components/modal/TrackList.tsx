import { Play } from "lucide-react";
import type { SoundtrackTrack } from "../../types/movie";

export function TrackList({ tracks, activeIndex, onSelect }: { tracks: SoundtrackTrack[]; activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <div id="ostTracklistGrid" className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {tracks.map((track, index) => {
        const active = index === activeIndex;
        return (
          <div
            key={track.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(index)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(index)}
            aria-label={`Traccia ${track.num}: ${track.title} di ${track.artist}, durata ${track.duration}`}
            className={`group glass-pill flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition ${
              active ? "border-cyan-400/50 bg-cyan-950/20" : "border-slate-800 hover:border-cyan-400/40"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-5 shrink-0 font-mono text-[10px] font-bold text-cyan-300 group-hover:hidden">
                {String(track.num).padStart(2, "0")}
              </span>
              <Play size={14} className="hidden shrink-0 text-cyan-400 group-hover:block" />
              <div className="min-w-0">
                <p className={`truncate text-xs font-semibold ${active ? "text-cyan-300" : "text-slate-200"}`}>{track.title}</p>
                <p className="truncate text-[10px] text-slate-400">{track.styleTag ?? track.artist}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {active && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cyan-400" />}
              <span className="font-mono text-[10px] text-cyan-300">{track.duration}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
