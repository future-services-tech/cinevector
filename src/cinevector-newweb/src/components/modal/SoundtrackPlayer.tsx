import { Music2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import type { SoundtrackTrack } from "../../types/movie";
import { formatSecondsToTime } from "../../lib/format";
import { useInterval } from "../../lib/useInterval";
import { TrackList } from "./TrackList";

type RepeatMode = "off" | "one" | "all";

export function SoundtrackPlayer({
  album,
  tracks,
}: {
  album: { title: string; composer: string; format: string[] };
  tracks: SoundtrackTrack[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSec, setProgressSec] = useState(0);
  const [volume, setVolume] = useState(80);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [barHeights, setBarHeights] = useState<number[]>(Array(8).fill(6));

  const progressRef = useRef<HTMLDivElement>(null);
  const currentTrack = tracks[currentIndex];

  function selectTrack(index: number) {
    setCurrentIndex(index);
    setProgressSec(0);
    setIsPlaying(true);
  }

  function trackEnded() {
    if (repeatMode === "one") {
      setProgressSec(0);
      return;
    }
    if (shuffleOn) {
      const candidates = tracks.map((_, i) => i).filter((i) => i !== currentIndex);
      const nextIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? currentIndex;
      setCurrentIndex(nextIndex);
      setProgressSec(0);
      return;
    }
    const isLast = currentIndex === tracks.length - 1;
    if (isLast && repeatMode === "off") {
      setIsPlaying(false);
      setCurrentIndex(0);
      setProgressSec(0);
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setProgressSec(0);
  }

  // Legge progressSec/currentTrack direttamente dallo scope di render (non dalla forma funzionale di
  // setState): useInterval richiama sempre la versione più recente della callback, quindi qui il valore
  // è già aggiornato — evita di annidare altre chiamate setState dentro un updater di setProgressSec,
  // che altrimenti competerebbero tra loro sull'ordine di applicazione.
  useInterval(
    () => {
      if (progressSec + 1 >= currentTrack.totalSec) {
        trackEnded();
      } else {
        setProgressSec(progressSec + 1);
      }
    },
    isPlaying ? 1000 : null,
  );

  useInterval(
    () => {
      setBarHeights(Array.from({ length: 8 }, () => 4 + Math.floor(Math.random() * 16)));
    },
    isPlaying ? 250 : null,
  );

  function togglePlay() {
    setIsPlaying((prev) => !prev);
    if (!isPlaying) return;
    setBarHeights(Array(8).fill(6));
  }

  function goPrev() {
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setProgressSec(0);
    setIsPlaying(true);
  }

  function goNext() {
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setProgressSec(0);
    setIsPlaying(true);
  }

  function seekTo(clientX: number) {
    const bar = progressRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    // A differenza del mockup originale (dove il seek non ricalcolava il tempo mostrato), qui il
    // timestamp segue sempre lo stato reale del progresso.
    setProgressSec(Math.round(ratio * currentTrack.totalSec));
  }

  const progressPercent = (progressSec / currentTrack.totalSec) * 100;
  const totalDuration = tracks.reduce((acc, t) => acc + t.totalSec, 0);

  return (
    <div id="soundtrackPlayerSection">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="glass-pill rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-semibold text-purple-300">
          {album.title}
        </span>
        {album.format.map((f) => (
          <span key={f} className="glass-pill rounded-full px-2.5 py-1 font-mono text-[10px] text-slate-300">
            {f}
          </span>
        ))}
      </div>

      <div className="glass-card relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-space-900 p-4">
        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-12">
          <div className="flex items-center gap-3.5 md:col-span-4">
            <div className="relative shrink-0 cursor-pointer">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400/60 bg-space-950 shadow-[0_0_15px_rgba(0,242,254,0.35)] ${
                  isPlaying ? "animate-spin" : ""
                }`}
                style={{ animationDuration: "3s" }}
              >
                <div className="h-8 w-8 rounded-full border border-white/10" />
                <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] text-slate-950">
                <Music2 size={10} />
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[9px] uppercase text-cyan-400">In Riproduzione</span>
              <h4 className="truncate text-sm font-bold text-white">
                {String(currentTrack.num).padStart(2, "0")}. {currentTrack.title}
              </h4>
              <p className="truncate text-[11px] text-slate-400">{currentTrack.artist}</p>
              <div className="mt-1 flex gap-1.5">
                {album.format.slice(0, 2).map((f) => (
                  <span key={f} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2.5 md:col-span-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <button onClick={() => setShuffleOn((v) => !v)} title="Casuale" className={shuffleOn ? "text-cyan-300" : "hover:text-cyan-200"}>
                  <Shuffle size={16} />
                </button>
                <button onClick={goPrev} title="Traccia Precedente" className="hover:text-cyan-200">
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={togglePlay}
                  title="Riproduci / Pausa"
                  aria-label={`Riproduci traccia ${currentTrack.num}. ${currentTrack.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
                <button onClick={goNext} title="Traccia Successiva" className="hover:text-cyan-200">
                  <SkipForward size={16} />
                </button>
                <button
                  onClick={() => setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"))}
                  title="Ripeti"
                  className={repeatMode !== "off" ? "text-cyan-300" : "hover:text-cyan-200"}
                >
                  {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>

              <div id="ostFreqBars" className="flex h-5 items-end gap-1 px-2">
                {barHeights.map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-t bg-gradient-to-t from-cyan-400 via-blue-400 to-purple-400"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Volume2 size={14} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="h-1 w-16 accent-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-cyan-300">{formatSecondsToTime(progressSec)}</span>
              <div
                ref={progressRef}
                onClick={(e) => seekTo(e.clientX)}
                role="slider"
                tabIndex={0}
                aria-valuemin={0}
                aria-valuemax={currentTrack.totalSec}
                aria-valuenow={progressSec}
                className="group/audiobar relative h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-space-900"
              >
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" style={{ width: `${progressPercent}%` }} />
                <div
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-neon-cyan group-hover/audiobar:opacity-100"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-slate-400">{currentTrack.duration}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800/80 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Tracklist Principale Selezionata</span>
            <span className="font-mono text-[10px] text-cyan-400">
              {tracks.length} Tracce · {formatSecondsToTime(totalDuration)} min totali
            </span>
          </div>
          <TrackList tracks={tracks} activeIndex={currentIndex} onSelect={selectTrack} />
        </div>
      </div>
    </div>
  );
}
