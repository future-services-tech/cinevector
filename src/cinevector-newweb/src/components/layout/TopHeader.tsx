import { Bell, Film, Menu, Music, Settings, SlidersHorizontal, Sparkles } from "lucide-react";
import { type FocusEvent, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { formatCount } from "../../lib/format";
import { getUnreadCount, markAllRead, subscribeNotifications } from "../../lib/notificationStore";
import { useLayout } from "../../state/LayoutContext";
import { useMovieData } from "../../state/MovieDataContext";
import { useSelection } from "../../state/SelectionContext";
import { SearchBar } from "../common/SearchBar";
import { ProfileModal } from "../profile/ProfileModal";
import { SettingsModal } from "../settings/SettingsModal";
import { NotificationsDropdown } from "./NotificationsDropdown";

function closesOnBlur(setOpen: (open: boolean) => void) {
  return (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };
}

export function TopHeader() {
  const { select } = useSelection();
  const navigate = useNavigate();
  const { movies } = useMovieData();
  const { toggleSidebar } = useLayout();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = useSyncExternalStore(subscribeNotifications, getUnreadCount);

  function goTo(path: string) {
    navigate(path);
    setExploreOpen(false);
  }

  return (
    <header data-purpose="main-header" className="glass-card z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-white/5 px-3 sm:gap-4 sm:px-5">
      <button
        onClick={toggleSidebar}
        aria-label="Apri menu"
        className="glass-pill shrink-0 rounded-lg p-2 text-slate-300 hover:text-ink lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-neon-cyan">
          <Sparkles size={18} className="text-slate-950" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wide text-ink">CineVector 3D</span>
            <span className="rounded border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300">
              V1.0 VECTOR
            </span>
          </div>
        </div>
      </div>

      <SearchBar
        onSelect={(result) => {
          const id = String(result.id);
          select(id);
          navigate(`/movie/${id}`);
        }}
      />

      {/* Sempre visibile (anche su phone): è l'unico modo per raggiungere Catalogo/Musica dall'header, dato
          che quelle voci sono state rimosse dalla sidebar apposta per non affollarla. */}
      <div tabIndex={-1} onBlur={closesOnBlur(setExploreOpen)} className="relative shrink-0">
        <button
          onClick={() => setExploreOpen((v) => !v)}
          className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs text-slate-300 hover:text-cyan-200 sm:px-3"
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Esplora</span>
        </button>
        {exploreOpen && (
          <div className="glass-card absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl">
            <button onClick={() => goTo("/catalogo")} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-white/5 hover:text-cyan-200">
              <Film size={14} /> Catalogo
            </button>
            <button onClick={() => goTo("/music")} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs text-slate-200 hover:bg-white/5 hover:text-cyan-200">
              <Music size={14} /> Musica
            </button>
          </div>
        )}
      </div>

      <span className="glass-pill hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-mono text-emerald-300 lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        {formatCount(movies.length)} Film Mappati
      </span>

      <div className="flex shrink-0 items-center gap-2.5 text-slate-400">
        <div tabIndex={-1} onBlur={closesOnBlur(setNotificationsOpen)} className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((v) => !v);
              if (!notificationsOpen) markAllRead();
            }}
            className="relative cursor-pointer hover:text-cyan-300"
            aria-label="Notifiche"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            )}
          </button>
          {notificationsOpen && <NotificationsDropdown />}
        </div>

        <button onClick={() => setSettingsOpen(true)} className="cursor-pointer hover:text-cyan-300" aria-label="Impostazioni">
          <Settings size={18} />
        </button>

        <button
          onClick={() => setProfileOpen(true)}
          aria-label="Profilo"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-blue-500 text-xs font-bold text-white hover:brightness-110"
        >
          CV
        </button>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
