import type {
  CreditsResponse,
  Genre,
  MediaItem,
  Movie,
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
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch("/movie/popular", { page });
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

export async function fetchPopularTV(page = 1): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch("/tv/popular", { page });
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
): Promise<TMDBResponse<Movie>> {
  return tmdbFetch("/discover/movie", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    page,
  });
}

export async function fetchTVByGenre(
  genreId: number,
  page = 1,
): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch("/discover/tv", {
    with_genres: genreId,
    sort_by: "popularity.desc",
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
