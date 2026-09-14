import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovie, getSimilarMovies } from "../api/movies";
import { MovieCard } from "../components/MovieCard";
import { MovieCarousel } from "../components/MovieCarousel";
import { PersonAvatar } from "../components/PersonAvatar";
import { useSettings } from "../lib/settings";

export function MovieDetailPage() {
  const { settings } = useSettings();
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);

  const { data: movie, isLoading, isError, error } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovie(movieId),
    enabled: Number.isFinite(movieId),
  });

  const {
    data: similar,
    isLoading: similarLoading,
    isError: similarError,
  } = useQuery({
    queryKey: ["movie", movieId, "similar"],
    queryFn: () => getSimilarMovies(movieId, 8),
    enabled: Number.isFinite(movieId) && !!movie,
    retry: false,
  });

  if (isLoading) return <p className="muted">Caricamento film...</p>;
  if (isError) return <p className="muted">Errore: {(error as Error).message}</p>;
  if (!movie) return <p className="muted">Film non trovato.</p>;

  const writers = movie.crew.filter((c) => c.role === "Writer").map((c) => c.name);
  const composers = movie.crew.filter((c) => c.role === "Composer").map((c) => c.name);
  const producers = movie.crew.filter((c) => c.role === "Producer");

  return (
    <div>
      <div className="hero-card" style={{ marginBottom: "1.5rem" }}>
        {movie.backdropUrl && <img className="hero-card__backdrop" src={movie.backdropUrl} alt="" />}
        <div className="hero-card__overlay" />
        <div className="hero-card__content">
          <div className="facet-list" style={{ marginBottom: "0.5rem" }}>
            {movie.clusterId != null && movie.clusterLabel && (
              <Link to={`/semantic-map/clusters/${movie.clusterId}`} className="chip chip--primary">
                Cluster: {movie.clusterLabel}
              </Link>
            )}
            <span className="chip">{movie.sourceName}</span>
          </div>
          <h1 style={{ fontSize: 28 }}>{movie.title}</h1>
          {movie.originalTitle && movie.originalTitle !== movie.title && (
            <p className="muted">Titolo originale: {movie.originalTitle}</p>
          )}
          <div className="facet-list" style={{ marginTop: "0.6rem" }}>
            {movie.genres.map((g) => (
              <span key={g} className="chip">
                {g}
              </span>
            ))}
            {movie.rating != null && <span className="chip">★ {movie.rating.toFixed(1)} / 10</span>}
            {movie.year != null && <span className="chip">{movie.year}</span>}
            {movie.country && <span className="chip">{movie.country}</span>}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <a href={movie.platformUrl} target="_blank" rel="noreferrer" className="btn btn--primary">
              Apri su piattaforma
            </a>
            <a href="#simili" className="btn btn--ghost">
              Trova film simili vettoriali
            </a>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "280px 1fr", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-hairline)" }}
            />
          )}

          <div className="panel panel--tight">
            <div className="panel-title" style={{ fontSize: 13 }}>Firma vettoriale</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Embedding a 384 dimensioni (OmniRouter, troncato e rinormalizzato).
            </p>
            {movie.clusterId != null ? (
              <p style={{ fontSize: 12, marginTop: 6 }}>
                Appartiene al cluster{" "}
                <Link to={`/semantic-map/clusters/${movie.clusterId}`} className="chip chip--primary">
                  {movie.clusterLabel}
                </Link>
              </p>
            ) : (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Non ancora assegnato a un cluster.
              </p>
            )}
          </div>

          {movie.keywords.length > 0 && (
            <div className="panel panel--tight">
              <div className="panel-title" style={{ fontSize: 13 }}>Keyword</div>
              <div className="facet-list" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                {movie.keywords.slice(0, 12).map((k) => (
                  <span key={k} className="chip">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {movie.overview && (
            <div className="panel">
              <div className="panel-title">Sinossi</div>
              <p style={{ marginTop: "0.6rem", lineHeight: 1.6 }}>{movie.overview}</p>
            </div>
          )}

          {(movie.directors.length > 0 || producers.length > 0) && (
            <div className="panel">
              <div className="panel-title">Regia &amp; produzione</div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", marginTop: "0.75rem" }}>
                {movie.directors.map((director) => (
                  <PersonAvatar
                    key={`director-${director.name}`}
                    name={director.name}
                    profileUrl={director.profileUrl}
                    wikipediaUrl={director.wikipediaUrl}
                    subtitle="Regista"
                  />
                ))}
                {producers.map((producer) => (
                  <PersonAvatar
                    key={`producer-${producer.name}`}
                    name={producer.name}
                    profileUrl={producer.profileUrl}
                    wikipediaUrl={producer.wikipediaUrl}
                    subtitle="Produttore"
                  />
                ))}
              </div>
            </div>
          )}

          {(writers.length > 0 || composers.length > 0) && (
            <div className="panel">
              <div className="panel-title">Sceneggiatura &amp; colonna sonora</div>
              <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: 13 }}>
                {writers.length > 0 && (
                  <p>
                    <strong>Sceneggiatura:</strong> {writers.join(", ")}
                  </p>
                )}
                {composers.length > 0 && (
                  <p>
                    <strong>Colonna sonora:</strong> {composers.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {movie.cast.length > 0 && (
            <div className="panel">
              <div className="panel-title">Cast principale</div>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", marginTop: "0.75rem" }}>
                {movie.cast.slice(0, 8).map((member) => (
                  <PersonAvatar
                    key={`${member.name}-${member.billingOrder}`}
                    name={member.name}
                    profileUrl={member.profileUrl}
                    wikipediaUrl={member.wikipediaUrl}
                    subtitle={member.character}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="simili" style={{ marginTop: "2rem" }}>
        {similar && similar.results.length > 0 && settings.carouselEnabled ? (
          <MovieCarousel
            movies={similar.results}
            title="Film simili & correlazioni semantiche"
            subtitle="Similarità coseno sull'embedding, con boost per generi condivisi e vicinanza d'anno."
            getMatchScore={(result) => result.similarity}
          />
        ) : (
          <>
            <div className="section-heading">
              <div>
                <h2 style={{ fontSize: 16 }}>Film simili &amp; correlazioni semantiche</h2>
                <p>Similarità coseno sull'embedding, con boost per generi condivisi e vicinanza d'anno.</p>
              </div>
            </div>

            {similarLoading && <div className="panel empty-state">Calcolo similarità...</div>}
            {similarError && (
              <div className="panel empty-state">
                Embedding non ancora calcolato per questo film — richiedi un backfill da Metrics &amp; Logs →
                Embeddings.
              </div>
            )}
            {similar && similar.results.length === 0 && (
              <div className="panel empty-state">Nessun film simile trovato sopra la soglia di similarità.</div>
            )}
            {similar && similar.results.length > 0 && (
              <div className="grid grid--movies">
                {similar.results.map((result) => (
                  <MovieCard key={result.id} movie={result} matchScore={result.similarity} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
