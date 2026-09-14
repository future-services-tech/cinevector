import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMovie } from "../api/movies";

interface MovieQuickViewProps {
  movieId: number;
  onClose: () => void;
}

/** Card di anteprima con le informazioni del film, aperta al click su un poster nella vista spaziale — con link
 * per raggiungere la pagina di dettaglio completa. Chiudibile con la X o cliccando fuori dalla card. */
export function MovieQuickView({ movieId, onClose }: MovieQuickViewProps) {
  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovie(movieId),
  });

  return (
    <div className="quick-view-backdrop" onClick={onClose}>
      <div className="quick-view-card" onClick={(e) => e.stopPropagation()}>
        <button className="quick-view-close" onClick={onClose} aria-label="Chiudi">
          ✕
        </button>

        {isLoading && <p className="muted">Caricamento...</p>}
        {isError && <p className="muted">Impossibile caricare il film.</p>}

        {movie && (
          <>
            <div style={{ display: "flex", gap: "1rem" }}>
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="quick-view-poster" />
              ) : (
                <div className="quick-view-poster movie-card__poster-placeholder">Nessun poster</div>
              )}
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 17 }}>{movie.title}</h3>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <p className="muted" style={{ fontSize: 12 }}>{movie.originalTitle}</p>
                )}
                <div className="facet-list" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                  {movie.year != null && <span className="chip">{movie.year}</span>}
                  {movie.rating != null && <span className="chip">★ {movie.rating.toFixed(1)}</span>}
                  {movie.genres.slice(0, 3).map((g) => (
                    <span key={g} className="chip">
                      {g}
                    </span>
                  ))}
                </div>
                {movie.directors.length > 0 && (
                  <p style={{ fontSize: 12, marginTop: "0.5rem" }}>
                    <strong>Regia:</strong> {movie.directors.map((d) => d.name).join(", ")}
                  </p>
                )}
                {movie.clusterLabel && (
                  <p style={{ fontSize: 12, marginTop: "0.3rem" }}>
                    <strong>Cluster:</strong> {movie.clusterLabel}
                  </p>
                )}
              </div>
            </div>

            {movie.overview && (
              <p style={{ marginTop: "0.85rem", fontSize: 13, lineHeight: 1.55 }}>{movie.overview}</p>
            )}

            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <Link to={`/movies/${movie.id}`} className="btn btn--primary btn--sm">
                Vedi dettaglio completo →
              </Link>
              <a href={movie.platformUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
                Apri su piattaforma
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
