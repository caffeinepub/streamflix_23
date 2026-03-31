import { useEffect, useState } from "react";
import ContentRow from "../components/ContentRow";
import ContinueWatchingRow from "../components/ContinueWatchingRow";
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
      </div>
    </div>
  );
}
