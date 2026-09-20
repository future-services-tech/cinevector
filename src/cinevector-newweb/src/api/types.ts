/** Specchi TypeScript dei contratti C# esposti da CineVector.Api (src/CineVector.Contracts/**).
 * Verificati contro le risposte JSON reali dell'API (camelCase, System.Text.Json di default). */

export interface MoviePersonDto {
  name: string;
  profileUrl: string | null;
  wikipediaUrl: string | null;
}

export interface MovieCastMemberDto {
  name: string;
  character: string | null;
  billingOrder: number;
  profileUrl: string | null;
  wikipediaUrl: string | null;
}

export interface MovieCrewMemberDto {
  name: string;
  role: string;
  profileUrl: string | null;
  wikipediaUrl: string | null;
}

export interface MovieDto {
  id: number;
  sourceName: string;
  title: string;
  originalTitle: string | null;
  year: number | null;
  overview: string | null;
  rating: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  platformUrl: string;
  language: string | null;
  country: string | null;
  clusterId: number | null;
  clusterLabel: string | null;
  genres: string[];
  keywords: string[];
  directors: MoviePersonDto[];
  cast: MovieCastMemberDto[];
  crew: MovieCrewMemberDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ClusterDto {
  id: number;
  label: string;
  description: string;
  memberCount: number;
  coordX: number;
  coordY: number;
  coordZ: number;
}

export interface ClusterMemberDto {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  genres: string[];
  coordX: number;
  coordY: number;
  coordZ: number;
}

export interface SearchResultItemDto {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  genres: string[];
  relevance: number | null;
  similarity: number | null;
}

export interface SearchFacetValueDto {
  value: string;
  count: number;
}

export interface SearchFacetsDto {
  genres: SearchFacetValueDto[];
  years: SearchFacetValueDto[];
  languages: SearchFacetValueDto[];
}

export interface SearchResponseDto {
  query: string | null;
  mode: string;
  total: number;
  page: number;
  pageSize: number;
  results: SearchResultItemDto[];
  facets: SearchFacetsDto;
}

export interface SimilarMoviesResponseDto {
  movieId: number;
  results: SearchResultItemDto[];
}

export interface MovieSummaryDto {
  id: number;
  title: string;
  originalTitle: string | null;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  genres: string[];
}

export interface PagedResultDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppSettingsDto {
  theme: string;
  animationsEnabled: boolean;
  cardHoverEffects: boolean;
  carouselEnabled: boolean;
  carouselSpeedSec: number;
  sphereDensity: string;
  haloIntensity: string;
  clusterPanelDefaultOpen: boolean;
  notificationsEnabled: boolean;
  spotifyAutoMatchEnabled: boolean;
  defaultPlayerVolume: number;
  posterSphereZoom: string;
  posterSpherePageSize: number;
}
