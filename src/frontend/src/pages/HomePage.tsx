import { Fragment, useEffect, useState } from "react";
import ContentRow from "../components/ContentRow";
import ContinueWatchingRow from "../components/ContinueWatchingRow";
import GenreRow from "../components/GenreRow";
import HeroBanner from "../components/HeroBanner";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import {
  fetchAiringTodayTV,
  fetchNowPlayingMovies,
  fetchPopularMovies,
  fetchTopRatedTV,
  fetchTrending,
  fetchUpcomingMovies,
} from "../lib/tmdb";
import type { MediaItem, Movie, TVShow } from "../lib/types";

const GENRE_ROWS: {
  label: string;
  movieId: number;
  tvId: number;
}[] = [
  { label: "Action", movieId: 28, tvId: 10759 },
  { label: "Comedy", movieId: 35, tvId: 35 },
  { label: "Drama", movieId: 18, tvId: 18 },
  { label: "Horror", movieId: 27, tvId: 9648 },
  { label: "Sci-Fi", movieId: 878, tvId: 10765 },
  { label: "Thriller", movieId: 53, tvId: 80 },
  { label: "Animation", movieId: 16, tvId: 16 },
  { label: "Romance", movieId: 10749, tvId: 10749 },
  { label: "Documentary", movieId: 99, tvId: 99 },
  { label: "Fantasy", movieId: 14, tvId: 10765 },
  { label: "Mystery", movieId: 9648, tvId: 9648 },
  { label: "Crime", movieId: 80, tvId: 80 },
];

export default function HomePage() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<TVShow[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [airingToday, setAiringToday] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const { watchlistIds, toggleWatchlist } = useFirestoreWatchlist();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [t, p, tv, np, uc, at] = await Promise.all([
          fetchTrending("all", "day"),
          fetchPopularMovies(),
          fetchTopRatedTV(),
          fetchNowPlayingMovies(),
          fetchUpcomingMovies(),
          fetchAiringTodayTV(),
        ]);
        if (!cancelled) {
          setTrending(t.results.slice(0, 10));
          setPopular(p.results);
          setTopRatedTV(tv.results);
          setNowPlaying(np.results);
          setUpcoming(uc.results);
          setAiringToday(at.results);
        }
      } catch (err) {
        console.error("Failed to load homepage data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleWatchlist(item: MediaItem) {
    const type = "title" in item ? "movie" : "tv";
    toggleWatchlist(item.id, type);
  }

  const toMediaItems = <T extends MediaItem>(arr: T[]): MediaItem[] => arr;

  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <HeroBanner items={trending} />
      <div className="relative -mt-12 z-10 pb-8">
        <ContinueWatchingRow />
        <ContentRow
          title="Trending Today"
          items={trending}
          loading={loading}
          watchlistIds={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
        />
        <ContentRow
          title="Popular Movies"
          items={toMediaItems(popular)}
          loading={loading}
          watchlistIds={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
        />
        <ContentRow
          title="Top Rated TV Shows"
          items={toMediaItems(topRatedTV)}
          loading={loading}
          watchlistIds={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
        />
        <ContentRow
          title="Now Playing"
          items={toMediaItems(nowPlaying)}
          loading={loading}
          watchlistIds={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
        />
        <ContentRow
          title="Airing Today"
          items={toMediaItems(airingToday)}
          loading={loading}
          watchlistIds={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
        />
        <ContentRow
          title="Upcoming Movies"
          items={toMediaItems(upcoming)}
          loading={loading}
          watchlistIds={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
        />

        {/* Genre rows — lazy loaded via IntersectionObserver as user scrolls */}
        {GENRE_ROWS.map((genre) => (
          <Fragment key={genre.label}>
            <GenreRow
              title={`${genre.label} Movies`}
              genreId={genre.movieId}
              mediaType="movie"
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <GenreRow
              title={`${genre.label} TV Shows`}
              genreId={genre.tvId}
              mediaType="tv"
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
