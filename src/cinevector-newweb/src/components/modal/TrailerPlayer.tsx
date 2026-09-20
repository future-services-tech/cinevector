import { Maximize2, Pause, Play, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { formatSecondsToTime } from "../../lib/format";
import { useInterval } from "../../lib/useInterval";

const FAKE_DURATION_SEC = 169; // 02:49, come nel mockup

export function TrailerPlayer({ posterUrl, tagline, title }: { posterUrl: string; tagline: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSec, setProgressSec] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useInterval(
    () => {
      setProgressSec((prev) => {
        if (prev >= FAKE_DURATION_SEC) {
          setIsPlaying(false);
          return FAKE_DURATION_SEC;
        }
        return prev + 1;
      });
    },
    isPlaying ? 1000 : null,
  );

  function togglePlay() {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && progressSec >= FAKE_DURATION_SEC) setProgressSec(0);
      return next;
    });
  }

  function seekTo(clientX: number) {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setProgressSec(Math.round(ratio * FAKE_DURATION_SEC));
  }

  const progressPercent = (progressSec / FAKE_DURATION_SEC) * 100;

  return (
    <div data-purpose="trailer-video-player" className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-black shadow-2xl">
      <div className="relative aspect-video w-full overflow-hidden bg-space-950">
        <img
          src={posterUrl}
          alt={`Fotogramma del trailer di ${title}`}
          className="h-full w-full object-cover brightness-90 transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60" />

        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between">
          <div className="glass-card flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Official Trailer HD</span>
          </div>
          <span className="glass-card rounded-md border border-cyan-400/30 px-2.5 py-1 font-mono text-[10px] font-bold text-cyan-300">2160p 60fps</span>
        </div>

        <button
          onClick={togglePlay}
          title={isPlaying ? "Pausa" : "Avvia Trailer"}
          aria-label={isPlaying ? "Metti in pausa il trailer" : "Riproduci il trailer ufficiale"}
          className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-400/80 bg-cyan-500/25 text-ink shadow-neon-cyan backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-cyan-400 hover:text-slate-950"
        >
          {isPlaying ? <Pause size={30} /> : <Play size={30} className="ml-1" />}
        </button>

        <div className="absolute inset-x-0 bottom-0 flex flex-col space-y-2 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4">
          <div className="flex items-center space-x-3">
            <div
              ref={barRef}
              onClick={(e) => seekTo(e.clientX)}
              className="group/bar relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
            >
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" style={{ width: `${progressPercent}%` }} />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-neon-cyan transition-opacity group-hover/bar:opacity-100"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <span className="whitespace-nowrap font-mono text-[11px] text-cyan-300">
              {formatSecondsToTime(progressSec)} / {formatSecondsToTime(FAKE_DURATION_SEC)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-slate-300">
              <button onClick={togglePlay} className="hover:text-cyan-300">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <Volume2 size={14} />
              <div className="h-1 w-14 rounded-full bg-white/20">
                <div className="h-full w-3/4 rounded-full bg-cyan-300" />
              </div>
            </div>
            <p className="hidden text-center text-xs italic tracking-wide text-slate-300 md:block">"{tagline}"</p>
            <div className="flex items-center gap-2 text-slate-300">
              <Badge4k />
              <Maximize2 size={14} className="cursor-pointer hover:text-cyan-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge4k() {
  return <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">4K UHD</span>;
}
