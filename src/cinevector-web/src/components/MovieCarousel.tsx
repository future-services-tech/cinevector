import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMovies } from "../api/movies";
import { MovieCard, type MovieCardData } from "./MovieCard";
import { useSettings } from "../lib/settings";

const PAGE_SIZE = 20;
const ITEM_WIDTH = 160 + 12; // larghezza card carosello (.carousel__item) + gap (--space-md)

interface MovieCarouselProps<T extends MovieCardData> {
  /** Lista fissa da cui il carosello scorre (es. "aggiunte recenti", "film simili"). Se omessa, il carosello
   * sfoglia da solo l'intero catalogo pagina per pagina (usato in cima alla Ricerca). */
  movies?: T[];
  title?: string;
  subtitle?: string;
  headerExtra?: ReactNode;
  /** Se fornita, mostra il badge "match %" su ogni card usando il punteggio restituito per quel film. */
  getMatchScore?: (movie: T) => number | null | undefined;
}

export function MovieCarousel<T extends MovieCardData = MovieCardData>({
  movies: fixedMovies,
  title,
  subtitle,
  headerExtra,
  getMatchScore,
}: MovieCarouselProps<T>) {
  const { settings } = useSettings();
  const [page, setPage] = useState(1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selfFetch = fixedMovies === undefined;

  const { data } = useQuery({
    queryKey: ["movies", "carousel", page],
    queryFn: () => getMovies(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
    enabled: selfFetch,
  });

  const movies: T[] = fixedMovies ?? (data?.items as T[] | undefined) ?? [];
  const totalPages = selfFetch && data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const totalCount = selfFetch ? data?.total ?? movies.length : movies.length;

  // Il carosello del catalogo intero scorre pagina per pagina; una lista fissa (film simili, aggiunte recenti)
  // gira semplicemente su se stessa. In entrambi i casi il movimento è o "a scatti" (avanza e si ferma) o
  // "continuo" (scorrimento fluido ininterrotto, la transizione dura quanto l'intero intervallo).
  useEffect(() => {
    if (paused || movies.length <= 1) {
      return;
    }

    timerRef.current = setInterval(() => {
      setIndex((current) => {
        if (current + 1 >= movies.length) {
          if (selfFetch) {
            setSkipTransition(true);
            setPage((p) => (p >= totalPages ? 1 : p + 1));
          }
          return 0;
        }
        return current + 1;
      });
    }, settings.carouselIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, movies.length, totalPages, settings.carouselIntervalMs, selfFetch]);

  useEffect(() => {
    if (!selfFetch) return;
    setIndex(0);
  }, [page, selfFetch]);

  // Evita un rewind visibile quando si passa alla pagina successiva del catalogo: per un frame disattiva
  // la transizione (salto istantaneo a index 0), poi la riattiva così il prossimo avanzamento torna ad animarsi.
  useEffect(() => {
    if (!skipTransition) return;
    const raf = requestAnimationFrame(() => setSkipTransition(false));
    return () => cancelAnimationFrame(raf);
  }, [skipTransition]);

  if (movies.length === 0) {
    return null;
  }

  const offset = index * ITEM_WIDTH;
  const duration = settings.carouselMotion === "continuous" ? settings.carouselIntervalMs : 600;
  const easing = settings.carouselMotion === "continuous" ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1)";

  const trackStyle = {
    transform: `translateX(-${offset}px)`,
    transition:
      !settings.animationsEnabled || skipTransition ? "none" : `transform ${duration}ms ${easing}`,
  };

  return (
    <div className="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="section-heading" style={{ padding: "0 var(--space-md)", marginBottom: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: 15 }}>{title ?? "Sfoglia il catalogo"}</h2>
          <p style={{ fontSize: 12 }}>
            {subtitle ??
              `Scorrimento automatico su tutti i ${totalCount} film — passa il mouse per fermarti e aprire un dettaglio.`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {paused && <span className="chip chip--primary">In pausa</span>}
          {headerExtra}
        </div>
      </div>

      <div className="carousel__fade carousel__fade--left" />
      <div className="carousel__fade carousel__fade--right" />

      <div className="carousel__track" style={trackStyle}>
        {movies.map((movie) => (
          <div key={movie.id} className="carousel__item">
            <MovieCard movie={movie} matchScore={getMatchScore?.(movie)} />
          </div>
        ))}
      </div>
    </div>
  );
}
