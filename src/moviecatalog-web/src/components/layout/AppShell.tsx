import { useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  Orbit,
  Database,
  Bot,
  BarChart3,
  Activity,
  Settings,
  Search,
} from "lucide-react";
import { useSettings } from "../../lib/settings";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/semantic-map", label: "Mappa Semantica 3D", icon: Orbit },
  { to: "/sources", label: "Sources", icon: Database },
  { to: "/crawler", label: "Crawler & Sync", icon: Bot },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/metrics", label: "Metrics & Logs", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const [query, setQuery] = useState("");

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/movies?query=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <NavLink to="/" className="brand">
          <span className="brand__mark">CV</span>
          <div>
            <div className="brand__name">
              Cine<span>Vector</span>
            </div>
            <div className="brand__tagline">Semantic Engine</div>
          </div>
        </NavLink>

        <div>
          <div className="nav-section-label">Console Vettoriale</div>
          <ul className="nav-list">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <div>CineVector · AI Cinematic Platform</div>
          <div>Powered by pgvector · Semantic Search</div>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__topbar">
          <form className="global-search" onSubmit={handleSearchSubmit}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Cerca per concetto semantico, trama, regista, atmosfera..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <span className="status-chip">
            <span className="status-chip__dot" />
            DB Online
          </span>
        </header>

        <main className="shell__content">
          {settings.animationsEnabled && settings.pageTransitions ? (
            <div key={location.pathname} className="page-transition">
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
