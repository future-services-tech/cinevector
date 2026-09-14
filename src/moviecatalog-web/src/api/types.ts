export interface MovieSummary {
  id: number;
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  genres: string[];
}

export interface MoviePerson {
  name: string;
  profileUrl?: string | null;
  wikipediaUrl?: string | null;
}

export interface MovieCastMember extends MoviePerson {
  character?: string | null;
  billingOrder: number;
}

export interface MovieCrewMember extends MoviePerson {
  role: string;
}

export interface Movie {
  id: number;
  sourceName: string;
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  overview?: string | null;
  rating?: number | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  platformUrl: string;
  language?: string | null;
  country?: string | null;
  clusterId?: number | null;
  clusterLabel?: string | null;
  genres: string[];
  keywords: string[];
  directors: MoviePerson[];
  cast: MovieCastMember[];
  crew: MovieCrewMember[];
  createdAt: string;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpsertMovieRequest {
  sourceName: string;
  externalId: string;
  title: string;
  originalTitle?: string;
  year?: number;
  overview?: string;
  rating?: number;
  posterUrl?: string;
  backdropUrl?: string;
  platformUrl: string;
  language?: string;
  country?: string;
  genres: string[];
  directors: string[];
}
