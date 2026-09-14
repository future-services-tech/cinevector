import { Link } from "react-router-dom";

export interface MovieCardData {
  id: number;
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  genres: string[];
}

interface MovieCardProps {
  movie: MovieCardData;
  matchScore?: number | null;
  overview?: string | null;
}

export function MovieCard({ movie, matchScore, overview }: MovieCardProps) {
  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-card__poster">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} loading="lazy" />
        ) : (
          <div className="movie-card__poster-placeholder">Nessun poster</div>
        )}
        <div className="movie-card__badge">
          {matchScore != null ? (
            <span className="chip chip--primary">{Math.round(matchScore * 100)}% Match</span>
          ) : (
            <span />
          )}
          {movie.rating != null && <span className="chip">★ {movie.rating.toFixed(1)}</span>}
        </div>
      </div>
      <div className="movie-card__body">
        <h3>{movie.title}</h3>
        {movie.originalTitle && movie.originalTitle !== movie.title && (
          <p className="movie-card__original-title">{movie.originalTitle}</p>
        )}
        <p className="movie-card__meta">{movie.year ?? "—"}</p>
        {movie.genres.length > 0 && <p className="movie-card__genres">{movie.genres.slice(0, 3).join(", ")}</p>}
        {overview && <p className="movie-card__overview">{overview}</p>}
      </div>
    </Link>
  );
}
