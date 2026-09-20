import { API_BASE_URL, apiFetch } from "./client";

export interface SpotifyTrack {
  id: string;
  title: string;
  artists: string;
  album?: string | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  spotifyUrl: string;
}

export interface SpotifyProfileStatus {
  profile: string;
  connected: boolean;
}

export function searchSpotifyTracks(query: string, limit = 10): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({ query, limit: String(limit) });
  return apiFetch<SpotifyTrack[]>(`/api/spotify/search?${params.toString()}`);
}

/** Stato di ciascun profilo/app Spotify configurato (primario + eventuali fallback), in ordine di priorità. */
export function getSpotifyStatus(): Promise<SpotifyProfileStatus[]> {
  return apiFetch<SpotifyProfileStatus[]>("/api/spotify/status");
}

/** Naviga il browser verso il login Spotify one-time per un profilo specifico (non un fetch: è una navigazione
 * a pagina intera che poi rimbalza su /callback tramite il redirect di Spotify). */
export function spotifyLoginUrl(profile = "primary"): string {
  return `${API_BASE_URL}/api/spotify/login?profile=${encodeURIComponent(profile)}`;
}

export function exchangeSpotifyCode(code: string, state: string): Promise<{ connected: boolean; profile: string }> {
  return apiFetch("/api/spotify/callback", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
}

export function disconnectSpotify(profile = "primary"): Promise<{ connected: boolean; profile: string }> {
  return apiFetch(`/api/spotify/disconnect?profile=${encodeURIComponent(profile)}`, { method: "POST" });
}
