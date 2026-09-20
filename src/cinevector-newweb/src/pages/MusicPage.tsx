import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Link2, Link2Off, Music, Pause, Play, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { disconnectSpotify, getSpotifyStatus, searchSpotifyTracks, spotifyLoginUrl } from "../api/spotify";
import { LeftSidebar } from "../components/layout/LeftSidebar";
import { TopHeader } from "../components/layout/TopHeader";
import { useAudioPreview } from "../hooks/useAudioPreview";

export function MusicPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const { playingUrl, toggle } = useAudioPreview();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handle = setTimeout(() => setQuery(input.trim()), 400);
    return () => clearTimeout(handle);
  }, [input]);

  const { data: status } = useQuery({ queryKey: ["spotify-status"], queryFn: getSpotifyStatus });
  const isConnected = status?.some((s) => s.connected) ?? false;

  const { data: tracks, isLoading, isError } = useQuery({
    queryKey: ["spotify-search", query],
    queryFn: () => searchSpotifyTracks(query, 24),
    enabled: query.length > 0 && isConnected,
  });

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-space-900 text-slate-200">
      <TopHeader />

      <main className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />

        <section className="scrollbar-thin flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 shadow-neon-purple">
                <Music size={16} className="text-slate-950" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink">Musica</h1>
                <p className="text-xs text-slate-400">Ricerca nel catalogo pubblico Spotify per titolo, artista o altra chiave — anteprime di 30s.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(status ?? [{ profile: "primary", connected: false }]).map((s) =>
                s.connected ? (
                  <button
                    key={s.profile}
                    onClick={() => disconnectSpotify(s.profile).then(() => queryClient.invalidateQueries({ queryKey: ["spotify-status"] }))}
                    className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-emerald-300 hover:text-rose-300"
                    title={`Scollega il profilo '${s.profile}'`}
                  >
                    <Link2 size={13} /> {s.profile}
                  </button>
                ) : (
                  <a
                    key={s.profile}
                    href={spotifyLoginUrl(s.profile)}
                    className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-cyan-200"
                  >
                    <Link2Off size={13} /> Collega {s.profile}
                  </a>
                ),
              )}
            </div>
          </div>

          <div className="glass-card mb-6 flex items-center gap-2 rounded-full px-4 py-2.5">
            <Search size={16} className="text-purple-300" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cerca per titolo, artista, colonna sonora..."
              disabled={!isConnected}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          {!isConnected && (
            <p className="text-xs text-slate-500">
              Nessun account Spotify collegato — clicca "Collega Spotify" in alto per abilitare la ricerca musicale.
            </p>
          )}
          {isConnected && !query && (
            <p className="text-xs text-slate-500">Digita qualcosa per cercare — es. "Hans Zimmer" o "Blade Runner 2049".</p>
          )}
          {isLoading && <p className="text-xs text-slate-500">Ricerca in corso...</p>}
          {isError && <p className="text-xs text-rose-400">Impossibile contattare Spotify. Riprova o ricollega l'account.</p>}
          {query && !isLoading && !isError && tracks && tracks.length === 0 && (
            <p className="text-xs text-slate-500">Nessun risultato per "{query}".</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tracks?.map((track) => {
              const isPlayingThis = track.previewUrl !== null && track.previewUrl !== undefined && playingUrl === track.previewUrl;
              return (
                <div key={track.id} className="glass-card glass-card-hover group overflow-hidden rounded-xl transition">
                  <div className="relative aspect-square w-full overflow-hidden bg-space-950">
                    {track.imageUrl ? (
                      <img src={track.imageUrl} alt={track.album ?? track.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Music size={28} />
                      </div>
                    )}
                    {track.previewUrl && (
                      <button
                        onClick={() => toggle(track.previewUrl!)}
                        title={isPlayingThis ? "Pausa anteprima" : "Riproduci anteprima (30s)"}
                        className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-cyan-400/80 bg-cyan-500/25 text-ink opacity-0 shadow-neon-cyan backdrop-blur-md transition-all duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-cyan-400 hover:text-slate-950"
                      >
                        {isPlayingThis ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-xs font-semibold text-ink">{track.title}</p>
                    <p className="truncate text-[10px] text-slate-400">{track.artists}</p>
                    <div className="flex items-center justify-between pt-1">
                      {track.previewUrl ? (
                        <span className="text-[9px] font-mono uppercase tracking-wide text-cyan-400">Anteprima 30s</span>
                      ) : (
                        <span className="text-[9px] font-mono uppercase tracking-wide text-slate-600">Nessuna anteprima</span>
                      )}
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Apri su Spotify"
                        className="text-slate-500 hover:text-emerald-300"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
