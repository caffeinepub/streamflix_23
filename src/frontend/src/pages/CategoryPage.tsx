import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import MediaCard from "../components/MediaCard";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import {
  fetchAiringTodayTV,
  fetchNowPlayingMovies,
  fetchPopularMovies,
  fetchTopRatedTV,
  fetchTrending,
  fetchUpcomingMovies,
} from "../lib/tmdb";
import type { MediaItem } from "../lib/types";

const SKELETON_KEYS = Array.from({ length: 20 }, (_, i) => `skeleton-cat-${i}`);

type CategoryKey =
  | "trending"
  | "popular-movies"
  | "top-rated-tv"
  | "now-playing"
  | "airing-today"
  | "upcoming";

const CATEGORY_CONFIG: Record<
  CategoryKey,
  { title: string; singlePage?: boolean }
> = {
  trending: { title: "Trending Today", singlePage: true },
  "popular-movies": { title: "Popular Movies" },
  "top-rated-tv": { title: "Top Rated TV Shows" },
  "now-playing": { title: "Now Playing" },
  "airing-today": { title: "Airing Today" },
  upcoming: { title: "Upcoming Movies" },
};

async function fetchCategoryPage(
  category: CategoryKey,
  page: number,
): Promise<{ results: MediaItem[]; total_pages: number }> {
  switch (category) {
    case "trending":
      return fetchTrending("all", "day") as Promise<{
        results: MediaItem[];
        total_pages: number;
      }>;
    case "popular-movies":
      return fetchPopularMovies(page) as Promise<{
        results: MediaItem[];
        total_pages: number;
      }>;
    case "top-rated-tv":
      return fetchTopRatedTV(page) as Promise<{
        results: MediaItem[];
        total_pages: number;
      }>;
    case "now-playing":
      return fetchNowPlayingMovies(page) as Promise<{
        results: MediaItem[];
        total_pages: number;
      }>;
    case "airing-today":
      return fetchAiringTodayTV(page) as Promise<{
        results: MediaItem[];
        total_pages: number;
      }>;
    case "upcoming":
      return fetchUpcomingMovies(page) as Promise<{
        results: MediaItem[];
        total_pages: number;
      }>;
  }
}

export default function CategoryPage() {
  const { category } = useParams({ from: "/category/$category" });
  const navigate = useNavigate();
  const config =
    CATEGORY_CONFIG[category as CategoryKey] ??
    CATEGORY_CONFIG["popular-movies"];
  const isSinglePage = config.singlePage ?? false;

  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { watchlistIds, toggleWatchlist } = useFirestoreWatchlist();

  // Load first page
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setPage(1);
    const load = async () => {
      try {
        const data = await fetchCategoryPage(category as CategoryKey, 1);
        if (!cancelled) {
          setItems(data.results);
          setTotalPages(isSinglePage ? 1 : Math.min(data.total_pages, 100));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, isSinglePage]);

  // Load next pages
  useEffect(() => {
    if (page === 1 || isSinglePage) return;
    let cancelled = false;
    setLoadingMore(true);
    const load = async () => {
      try {
        const data = await fetchCategoryPage(category as CategoryKey, page);
        if (!cancelled) {
          setItems((prev) => [...prev, ...data.results]);
          setTotalPages(Math.min(data.total_pages, 100));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingMore(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, category, isSinglePage]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        !loading &&
        !loadingMore &&
        !isSinglePage &&
        page < totalPages
      ) {
        setPage((p) => p + 1);
      }
    },
    [loading, loadingMore, page, totalPages, isSinglePage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="bg-[#0B0B0B] min-h-screen pt-24 px-6 md:px-14 pb-16">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          data-ocid="category.back_button"
          onClick={() => void navigate({ to: "/" })}
          className="flex items-center gap-1 text-[#B3B3B3] hover:text-white transition-colors text-sm"
        >
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-white">{config.title}</h1>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="aspect-[2/3] bg-[#2B2B2B] rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-visible">
          {items.map((item) => (
            <MediaCard
              className="w-full"
              key={item.id}
              item={item}
              inWatchlist={watchlistIds.has(item.id)}
              onToggleWatchlist={() =>
                toggleWatchlist(item.id, "title" in item ? "movie" : "tv")
              }
            />
          ))}
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-10 mt-4" />

      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !loadingMore && page >= totalPages && items.length > 0 && (
        <p className="text-center text-[#555] text-sm py-6">
          You've reached the end
        </p>
      )}
    </div>
  );
}
