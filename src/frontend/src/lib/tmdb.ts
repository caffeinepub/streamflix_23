import type {
  CreditsResponse,
  Genre,
  MediaItem,
  Movie,
  SeasonDetails,
  TMDBResponse,
  TVShow,
  VideosResponse,
} from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const DEFAULT_API_KEY = "49b128b9a6ea789ec26c298a504887a7";

export function getApiKey(): string {
  return localStorage.getItem("tmdb_api_key") ?? DEFAULT_API_KEY;
}

export function setApiKey(key: string): void {
  localStorage.setItem("tmdb_api_key", key);
}

export function hasApiKey(): boolean {
  return true;
}

export function getPosterUrl(path: string | null, size = "w342"): string {
  if (!path) return "/placeholder-poster.svg";
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size = "w1280"): string {
  if (!path) return "";
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getProfileUrl(path: string | null, size = "w185"): string {
  if (!path) return "";
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getStillUrl(path: string | null, size = "w300"): string {
  if (!path) return "";
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const apiKey = getApiKey();
  const urlParams = new URLSearchParams({
    api_key: apiKey,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });
  const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${urlParams}`);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchTrending(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "day",
): Promise<TMDBResponse<MediaItem>> {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
}

export async function fetchPopularMovies(
  page = 1,
  sortBy = "popularity.desc",
): Promise<TMDBResponse<Movie>> {
  if (sortBy === "popularity.desc") {
    return tmdbFetch("/movie/popular", { page });
  }
  return tmdbFetch("/discover/movie", { sort_by: sortBy, page });
}

export async function fetchTopRatedMovies(
  page = 1,
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch("/movie/top_rated", { page });
}

export async function fetchNowPlayingMovies(
  page = 1,
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch("/movie/now_playing", { page });
}

export async function fetchUpcomingMovies(
  page = 1,
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch("/movie/upcoming", { page });
}

export async function fetchPopularTV(
  page = 1,
  sortBy = "popularity.desc",
): Promise<TMDBResponse<TVShow>> {
  if (sortBy === "popularity.desc") {
    return tmdbFetch("/tv/popular", { page });
  }
  return tmdbFetch("/discover/tv", { sort_by: sortBy, page });
}

export async function fetchTopRatedTV(page = 1): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch("/tv/top_rated", { page });
}

export async function fetchAiringTodayTV(
  page = 1,
): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch("/tv/airing_today", { page });
}

export async function fetchMovieDetails(id: number): Promise<Movie> {
  return tmdbFetch<Movie>(`/movie/${id}`);
}

export async function fetchTVDetails(id: number): Promise<TVShow> {
  return tmdbFetch<TVShow>(`/tv/${id}`);
}

export async function fetchTVExternalIds(
  id: number,
): Promise<{ imdb_id: string | null }> {
  return tmdbFetch<{ imdb_id: string | null }>(`/tv/${id}/external_ids`);
}

export async function fetchTVSeasonDetails(
  tvId: number,
  seasonNumber: number,
): Promise<SeasonDetails> {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function fetchMovieCredits(id: number): Promise<CreditsResponse> {
  return tmdbFetch<CreditsResponse>(`/movie/${id}/credits`);
}

export async function fetchTVCredits(id: number): Promise<CreditsResponse> {
  return tmdbFetch<CreditsResponse>(`/tv/${id}/aggregate_credits`);
}

export async function fetchMovieVideos(id: number): Promise<VideosResponse> {
  return tmdbFetch<VideosResponse>(`/movie/${id}/videos`);
}

export async function fetchTVVideos(id: number): Promise<VideosResponse> {
  return tmdbFetch<VideosResponse>(`/tv/${id}/videos`);
}

export async function fetchMovieGenres(): Promise<{ genres: Genre[] }> {
  return tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
}

export async function fetchTVGenres(): Promise<{ genres: Genre[] }> {
  return tmdbFetch<{ genres: Genre[] }>("/genre/tv/list");
}

export async function fetchMoviesByGenre(
  genreId: number,
  page = 1,
  sortBy = "popularity.desc",
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_genres: genreId,
    sort_by: sortBy,
    page,
  });
}

export async function fetchTVByGenre(
  genreId: number,
  page = 1,
  sortBy = "popularity.desc",
): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch("/discover/tv", {
    with_genres: genreId,
    sort_by: sortBy,
    page,
  });
}

export async function searchMulti(
  query: string,
  page = 1,
): Promise<TMDBResponse<MediaItem>> {
  return tmdbFetch("/search/multi", { query, page });
}

export async function fetchSimilarMovies(
  id: number,
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch(`/movie/${id}/similar`);
}

export async function fetchSimilarTV(
  id: number,
): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch(`/tv/${id}/similar`);
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface CombinedCreditItem {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  popularity: number;
  character: string;
  release_date?: string;
  first_air_date?: string;
}

export async function fetchPersonDetails(id: number): Promise<PersonDetails> {
  return tmdbFetch<PersonDetails>(`/person/${id}`);
}

export async function fetchPersonCombinedCredits(
  id: number,
): Promise<{ cast: CombinedCreditItem[] }> {
  return tmdbFetch<{ cast: CombinedCreditItem[] }>(
    `/person/${id}/combined_credits`,
  );
}
