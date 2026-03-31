export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  status?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  media_type?: "movie";
  popularity?: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  genre_ids: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  media_type?: "tv";
  popularity?: number;
}

export type MediaItem = Movie | TVShow;

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface CreditsResponse {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface VideosResponse {
  id: number;
  results: Video[];
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export function isMovie(item: MediaItem): item is Movie {
  return "title" in item;
}

export function isTVShow(item: MediaItem): item is TVShow {
  return "name" in item;
}

export function getTitle(item: MediaItem): string {
  return isMovie(item) ? item.title : item.name;
}

export function getDate(item: MediaItem): string {
  return isMovie(item) ? item.release_date : item.first_air_date;
}

export function getMediaType(item: MediaItem): "movie" | "tv" {
  if (item.media_type === "movie" || item.media_type === "tv") {
    return item.media_type;
  }
  return isMovie(item) ? "movie" : "tv";
}
