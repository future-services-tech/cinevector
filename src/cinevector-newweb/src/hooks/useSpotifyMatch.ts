import { useQuery } from "@tanstack/react-query";
import { searchSpotifyTracks } from "../api/spotify";
import type { SoundtrackTrack } from "../types/movie";

interface SpotifyMatch {
  tracks: SoundtrackTrack[];
  album: { title: string; composer: string; format: string[] } | null;
  isLoading: boolean;
}

/** Cerca su Spotify la colonna sonora reale di un film (Client Credentials Flow, nessun account collegato) —
 * fallback silenzioso: se non trova nulla con anteprima disponibile, il chiamante resta sul contenuto sintetico. */
export function useSpotifyMatch(movieTitle: string | null): SpotifyMatch {
  const query = useQuery({
    queryKey: ["spotify-match", movieTitle],
    queryFn: () => searchSpotifyTracks(`${movieTitle} soundtrack`, 5),
    enabled: Boolean(movieTitle),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const tracks: SoundtrackTrack[] = (query.data ?? [])
    .filter((t) => t.previewUrl)
    .map((t, i) => ({
      id: t.id,
      num: i + 1,
      title: t.title,
      artist: t.artists,
      duration: "0:30",
      totalSec: 30,
      previewUrl: t.previewUrl!,
    }));

  const album =
    tracks.length > 0
      ? { title: `Spotify — anteprime per "${movieTitle}"`, composer: tracks[0].artist, format: ["Anteprima 30s via Spotify"] }
      : null;

  return { tracks, album, isLoading: query.isLoading };
}
