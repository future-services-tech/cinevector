import { useEffect, useRef, useState } from "react";

interface AudioPreviewControls {
  playingUrl: string | null;
  toggle: (url: string) => void;
  stop: () => void;
}

/** Un solo elemento &lt;audio&gt; condiviso per l'intera pagina che lo usa: avviare una preview ne ferma
 * automaticamente un'altra eventualmente già in corso, senza dover coordinare stato tra le singole card. */
export function useAudioPreview(): AudioPreviewControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const handleEnded = () => setPlayingUrl(null);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  function toggle(url: string) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingUrl === url) {
      audio.pause();
      setPlayingUrl(null);
      return;
    }
    audio.src = url;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setPlayingUrl(url);
  }

  function stop() {
    audioRef.current?.pause();
    setPlayingUrl(null);
  }

  return { playingUrl, toggle, stop };
}
