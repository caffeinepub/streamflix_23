import { useEffect, useState } from "react";
import { ItemType } from "../backend";
import ContentRow from "../components/ContentRow";
import ContinueWatchingRow from "../components/ContinueWatchingRow";
import HeroBanner from "../components/HeroBanner";
import { useActor } from "../hooks/useActor";
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
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const { actor } = useActor();

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

  useEffect(() => {
    if (!actor) return;
    void actor.getWatchlist().then((list) => {
      setWatchlistIds(new Set(list.map((i) => Number(i.id))));
    });
  }, [actor]);

  async function handleToggleWatchlist(item: MediaItem) {
    if (!actor) return;
    const mediaType = "title" in item ? ItemType.movie : ItemType.tv;
    await actor.toggleItem(BigInt(item.id), mediaType);
    const list = await actor.getWatchlist();
    setWatchlistIds(new Set(list.map((i) => Number(i.id))));
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
