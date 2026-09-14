import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "../api/statistics";
import { getClusters } from "../api/clusters";
import { getMovies, getMovie } from "../api/movies";
import { getCrawlJobs } from "../api/crawl";
import { MovieCard } from "../components/MovieCard";
import { MovieCarousel } from "../components/MovieCarousel";
import { colorForIndex } from "../lib/clusterColors";
import { useSettings } from "../lib/settings";

const RECENT_COUNT = 9;

function statusChipClass(status: string) {
  switch (status) {
    case "Running":
      return "status-chip";
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
  const { data: stats } = useQuery({ queryKey: ["statistics"], queryFn: getStatistics });
  const { data: clusters } = useQuery({ queryKey: ["clusters"], queryFn: getClusters });
  const { data: recentMovies } = useQuery({
    queryKey: ["movies", "recent", RECENT_COUNT],
    queryFn: () => getMovies(1, RECENT_COUNT),
  });
  const { data: jobs } = useQuery({ queryKey: ["crawl-jobs"], queryFn: getCrawlJobs });

  const heroSummary = recentMovies?.items[0];
  const { data: hero } = useQuery({
    queryKey: ["movie", heroSummary?.id],
    queryFn: () => getMovie(heroSummary!.id),
    enabled: !!heroSummary,
  });

  const topClusters = [...(clusters ?? [])].sort((a, b) => b.memberCount - a.memberCount).slice(0, 3);
  const recentRest = recentMovies?.items.slice(1, 9) ?? [];
  const recentJobs = (jobs ?? []).slice(0, 5);

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Panoramica del catalogo, cluster semantici e attività recente del crawler.</p>
        </div>
      </div>

      {stats && (
        <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="stat-card__label">Film censiti</div>
            <div className="stat-card__value">{stats.totalMovies}</div>
            <div className="stat-card__delta">+{stats.moviesAddedToday} oggi</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Vettori attivi</div>
            <div className="stat-card__value">{stats.moviesWithEmbedding}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              {stats.moviesPendingEmbedding} in coda
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Cluster semantici</div>
            <div className="stat-card__value">{stats.totalClusters}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Fonti</div>
            <div className="stat-card__value">{stats.totalSources}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              {stats.lastCrawlAt ? `Ultimo crawl ${new Date(stats.lastCrawlAt).toLocaleString("it-IT")}` : "Nessun crawl eseguito"}
            </div>
          </div>
        </div>
      )}

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
              {[hero.year, hero.directors[0], hero.country].filter(Boolean).join(" · ")}
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

      <div className="section-heading" style={{ marginTop: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: 16 }}>Topologia Vettoriale &amp; Cluster AI</h2>
          <p>Cluster scoperti automaticamente via k-means sugli embedding semantici.</p>
        </div>
        <Link to="/semantic-map" className="muted">
          Esplora Mappa Semantica 3D →
        </Link>
      </div>

      {topClusters.length === 0 && (
        <div className="panel empty-state" style={{ marginBottom: "1.5rem" }}>
          Nessun cluster calcolato ancora. Vai su Metrics &amp; Logs → Embeddings per generare i vettori, poi
          ricalcola i cluster.
        </div>
      )}

      {topClusters.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: "1.5rem" }}>
          {topClusters.map((cluster, index) => (
            <Link key={cluster.id} to={`/semantic-map/clusters/${cluster.id}`} className="panel cluster-preview-card">
              <div className="facet-list" style={{ marginBottom: "0.5rem" }}>
                <span className="cluster-preview-card__dot" style={{ background: colorForIndex(index) }} />
                <span className="muted" style={{ fontSize: 11 }}>CLUSTER #{cluster.id}</span>
              </div>
              <h3 style={{ fontSize: 15 }}>{cluster.label}</h3>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {cluster.description}
              </p>
              <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                {cluster.memberCount} film · Naviga cluster →
              </p>
            </Link>
          ))}
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
          <p>Ultimi job di ingestion eseguiti.</p>
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
    </div>
  );
}
