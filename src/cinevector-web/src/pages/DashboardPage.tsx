import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Film, Orbit, BarChart3, Database } from "lucide-react";
import { getStatistics } from "../api/statistics";
import { getClusters } from "../api/clusters";
import { getMovies, getMovie } from "../api/movies";
import { getCrawlJobs } from "../api/crawl";
import { MovieCard } from "../components/MovieCard";
import { MovieCarousel } from "../components/MovieCarousel";
import { SphereImageGrid, type ImageData } from "../components/SphereImageGrid";
import { MovieQuickView } from "../components/MovieQuickView";
import { colorForIndex } from "../lib/clusterColors";
import { useSettings } from "../lib/settings";

const RECENT_COUNT = 9;
// La sfera di scelta film ha bisogno di più poster per risultare piena (stesso criterio già usato in passato
// nella vista spaziale del catalogo, ora spostata qui).
const SPHERE_COUNT = 30;

const AXIS_COLOR = "#a9b7c6";
const GRID_COLOR = "rgba(255,255,255,0.08)";
const TOOLTIP_STYLE = {
  background: "#0d1c2d",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 8,
  color: "#d4e4fa",
  fontSize: 12,
};

function statusChipClass(status: string) {
  switch (status) {
    case "Running":
      return "status-chip";
    case "Paused":
      return "status-chip status-chip--paused";
    case "Failed":
      return "status-chip status-chip--error";
    case "Cancelled":
      return "status-chip status-chip--warning";
    default:
      return "status-chip status-chip--idle";
  }
}

export function DashboardPage() {
  const { settings } = useSettings();
  const [quickViewMovieId, setQuickViewMovieId] = useState<number | null>(null);
  const { data: stats } = useQuery({ queryKey: ["statistics"], queryFn: getStatistics });
  const { data: clusters } = useQuery({ queryKey: ["clusters"], queryFn: getClusters });
  const { data: recentMovies } = useQuery({
    queryKey: ["movies", "recent", RECENT_COUNT],
    queryFn: () => getMovies(1, RECENT_COUNT),
  });
  const { data: sphereMovies } = useQuery({
    queryKey: ["movies", "sphere", SPHERE_COUNT],
    queryFn: () => getMovies(1, SPHERE_COUNT),
  });
  const { data: jobs } = useQuery({ queryKey: ["crawl-jobs"], queryFn: getCrawlJobs, refetchInterval: 5000 });

  const heroSummary = recentMovies?.items[0];
  const { data: hero } = useQuery({
    queryKey: ["movie", heroSummary?.id],
    queryFn: () => getMovie(heroSummary!.id),
    enabled: !!heroSummary,
  });

  const topClusters = [...(clusters ?? [])].sort((a, b) => b.memberCount - a.memberCount).slice(0, 6);
  const recentRest = recentMovies?.items.slice(1, 9) ?? [];
  const recentJobs = (jobs ?? []).slice(0, 5);
  const orphanedJobs = (jobs ?? []).filter((j) => j.isOrphaned).length;

  const sphereImages: ImageData[] = (sphereMovies?.items ?? [])
    .filter((movie) => !!movie.posterUrl)
    .map((movie) => ({
      id: String(movie.id),
      src: movie.posterUrl!,
      alt: movie.title,
      title: movie.title,
      description: [movie.year, movie.rating != null ? `★ ${movie.rating.toFixed(1)}` : null].filter(Boolean).join(" · "),
    }));

  const byYearSorted = [...(stats?.byYear ?? [])].sort((a, b) => Number(a.name) - Number(b.name));
  const catalogGrowth = byYearSorted.reduce<{ name: string; total: number }[]>((acc, y) => {
    const previousTotal = acc.length > 0 ? acc[acc.length - 1].total : 0;
    acc.push({ name: y.name, total: previousTotal + y.count });
    return acc;
  }, []);

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>General Statistics</h2>
          <p>Panoramica del catalogo, cluster semantici e attività recente del crawler.</p>
        </div>
      </div>

      <div className="dash-hero" style={{ marginBottom: "1.5rem" }}>
        <div className="dash-hero__stats">
          {stats && (
            <div className="dash-stat-grid">
              <div className="dash-stat-card">
                <div className="dash-stat-card__body">
                  <div className="dash-stat-card__label">FILM CENSITI</div>
                  <div className="dash-stat-card__value">{stats.totalMovies}</div>
                  <div className="dash-stat-card__delta">
                    <span className="dash-stat-card__delta--up">+{stats.moviesAddedToday}</span> oggi
                  </div>
                </div>
                <div className="dash-stat-card__icon">
                  <Film size={20} />
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__body">
                  <div className="dash-stat-card__label">VETTORI ATTIVI</div>
                  <div className="dash-stat-card__value">{stats.moviesWithEmbedding}</div>
                  <div className="dash-stat-card__delta">{stats.moviesPendingEmbedding} in coda</div>
                </div>
                <div className="dash-stat-card__icon">
                  <Orbit size={20} />
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__body">
                  <div className="dash-stat-card__label">CLUSTER SEMANTICI</div>
                  <div className="dash-stat-card__value">{stats.totalClusters}</div>
                  <div className="dash-stat-card__delta">gruppi scoperti via k-means</div>
                </div>
                <div className="dash-stat-card__icon">
                  <BarChart3 size={20} />
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__body">
                  <div className="dash-stat-card__label">FONTI</div>
                  <div className="dash-stat-card__value">{stats.totalSources}</div>
                  <div className="dash-stat-card__delta">
                    {stats.lastCrawlAt ? `Ultimo crawl ${new Date(stats.lastCrawlAt).toLocaleString("it-IT")}` : "Nessun crawl eseguito"}
                  </div>
                </div>
                <div className="dash-stat-card__icon">
                  <Database size={20} />
                </div>
              </div>
            </div>
          )}

          <div className="panel" style={{ flex: 1 }}>
            <div className="section-heading" style={{ marginBottom: "0.5rem" }}>
              <div>
                <div className="panel-title">Cluster Semantici</div>
                <div className="panel-subtitle">Gruppi di film scoperti automaticamente sugli embedding vettoriali.</div>
              </div>
              <Link to="/semantic-map" className="muted" style={{ fontSize: 12 }}>
                Mappa 3D →
              </Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cluster</th>
                  <th>Film</th>
                  <th>Quota</th>
                </tr>
              </thead>
              <tbody>
                {topClusters.map((cluster, index) => {
                  const share = stats && stats.totalMovies > 0 ? (cluster.memberCount / stats.totalMovies) * 100 : 0;
                  return (
                    <tr key={cluster.id}>
                      <td>
                        <Link to={`/semantic-map/clusters/${cluster.id}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit", textDecoration: "none" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorForIndex(index), flexShrink: 0 }} />
                          {cluster.label}
                        </Link>
                      </td>
                      <td className="muted">{cluster.memberCount}</td>
                      <td className="muted">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {topClusters.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      Nessun cluster calcolato ancora.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dash-hero__sphere">
          <SphereImageGrid
            containerSize={420}
            sphereRadius={150}
            autoRotate={settings.animationsEnabled}
            images={sphereImages}
            onSelect={(image) => setQuickViewMovieId(Number(image.id))}
          />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="panel">
          <div className="panel-title">Film per anno</div>
          <div className="panel-subtitle">Distribuzione del catalogo per anno di uscita.</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byYearSorted} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" stroke={AXIS_COLOR} fontSize={11} tickLine={false} />
              <YAxis stroke={AXIS_COLOR} fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="count" fill="#00d2ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-title">Crescita del catalogo</div>
          <div className="panel-subtitle">Film indicizzati, cumulativi per anno di uscita.</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={catalogGrowth} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="catalogGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" stroke={AXIS_COLOR} fontSize={11} tickLine={false} />
              <YAxis stroke={AXIS_COLOR} fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.14)" }} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#catalogGrowthFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hero && (
        <div className="hero-card" style={{ marginBottom: "1.5rem" }}>
          {hero.backdropUrl && <img className="hero-card__backdrop" src={hero.backdropUrl} alt="" />}
          <div className="hero-card__overlay" />
          <div className="hero-card__content">
            <div className="facet-list" style={{ marginBottom: "0.5rem" }}>
              <span className="chip chip--primary">Aggiunto di recente</span>
              {hero.clusterLabel && <span className="chip">Cluster: {hero.clusterLabel}</span>}
            </div>
            <h1 style={{ fontSize: 28 }}>{hero.title}</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {[hero.year, hero.directors[0]?.name, hero.country].filter(Boolean).join(" · ")}
            </p>
            <div className="facet-list" style={{ marginTop: "0.6rem" }}>
              {hero.genres.slice(0, 3).map((g) => (
                <span key={g} className="chip">
                  {g}
                </span>
              ))}
              {hero.rating != null && <span className="chip">★ {hero.rating.toFixed(1)} / 10</span>}
            </div>
            {hero.overview && (
              <p style={{ marginTop: "0.75rem", maxWidth: "60ch" }}>{hero.overview}</p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <Link to={`/movies/${hero.id}`} className="btn btn--primary">
                Esplora dettaglio film
              </Link>
              <a href={hero.platformUrl} target="_blank" rel="noreferrer" className="btn btn--ghost">
                Apri su piattaforma
              </a>
            </div>
          </div>
        </div>
      )}

      {recentRest.length === 0 && (
        <>
          <div className="section-heading">
            <div>
              <h2 style={{ fontSize: 16 }}>Aggiunte recenti</h2>
              <p>Ultimi film indicizzati nel catalogo.</p>
            </div>
            <Link to="/movies" className="muted">
              Vai al catalogo →
            </Link>
          </div>
          <div className="panel empty-state" style={{ marginBottom: "1.5rem" }}>Nessun altro film disponibile.</div>
        </>
      )}

      {recentRest.length > 0 && settings.carouselEnabled && (
        <MovieCarousel
          movies={recentRest}
          title="Aggiunte recenti"
          subtitle="Ultimi film indicizzati nel catalogo — passa il mouse per fermarti e aprire un dettaglio."
          headerExtra={
            <Link to="/movies" className="muted" style={{ fontSize: 12 }}>
              Vai al catalogo →
            </Link>
          }
        />
      )}

      {recentRest.length > 0 && !settings.carouselEnabled && (
        <>
          <div className="section-heading">
            <div>
              <h2 style={{ fontSize: 16 }}>Aggiunte recenti</h2>
              <p>Ultimi film indicizzati nel catalogo.</p>
            </div>
            <Link to="/movies" className="muted">
              Vai al catalogo →
            </Link>
          </div>
          <div className="grid grid--movies" style={{ marginBottom: "1.5rem" }}>
            {recentRest.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </>
      )}

      <div className="section-heading">
        <div>
          <h2 style={{ fontSize: 16 }}>Attività Crawler</h2>
          <p>
            Ultimi job di ingestion eseguiti.
            {orphanedJobs > 0 && (
              <span style={{ color: "var(--color-warning)", marginLeft: 6 }}>
                ⚠ {orphanedJobs} job risulta{orphanedJobs > 1 ? "no" : ""} zombie — vai su Crawler &amp; Sync per fermarl
                {orphanedJobs > 1 ? "i" : "o"}.
              </span>
            )}
          </p>
        </div>
        <Link to="/crawler" className="muted">
          Apri Console Crawler completa →
        </Link>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fonte</th>
              <th>Stato</th>
              <th>Avviato</th>
              <th>Trovati</th>
              <th>Creati</th>
              <th>Aggiornati</th>
            </tr>
          </thead>
          <tbody>
            {recentJobs.map((job) => (
              <tr key={job.id}>
                <td>{job.sourceName ?? job.sourceId}</td>
                <td>
                  <span className={statusChipClass(job.status)}>
                    <span className="status-chip__dot" />
                    {job.status}
                  </span>
                  {job.isOrphaned && (
                    <span className="chip chip--warning" style={{ marginLeft: "0.4rem" }} title="Job zombie: nessuna istanza API lo sta gestendo davvero.">
                      ⚠
                    </span>
                  )}
                </td>
                <td className="muted">{new Date(job.startedAt).toLocaleString("it-IT")}</td>
                <td>{job.moviesFound}</td>
                <td>{job.moviesCreated}</td>
                <td>{job.moviesUpdated}</td>
              </tr>
            ))}
            {recentJobs.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nessun job eseguito ancora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {quickViewMovieId != null && (
        <MovieQuickView movieId={quickViewMovieId} onClose={() => setQuickViewMovieId(null)} />
      )}
    </div>
  );
}
