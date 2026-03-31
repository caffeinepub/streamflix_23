import { useNavigate } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatRating, formatYear } from "../lib/helpers";
import {
  fetchPopularTV,
  fetchTVByGenre,
  fetchTVGenres,
  getPosterUrl,
} from "../lib/tmdb";
import type { Genre, TVShow } from "../lib/types";

const SKELETON_KEYS = Array.from({ length: 20 }, (_, i) => `skeleton-tv-${i}`);

export default function TVPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [shows, setShows] = useState<TVShow[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void fetchTVGenres().then((data) => setGenres(data.genres));
  }, []);

  // Reset and load first page when genre changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setShows([]);
    setPage(1);
    const load = async () => {
      try {
        const data = selectedGenre
          ? await fetchTVByGenre(selectedGenre, 1)
          : await fetchPopularTV(1);
        if (!cancelled) {
          setShows(data.results);
          setTotalPages(Math.min(data.total_pages, 100));
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
  }, [selectedGenre]);

  // Load next pages
  useEffect(() => {
    if (page === 1) return;
    let cancelled = false;
    setLoadingMore(true);
    const load = async () => {
      try {
        const data = selectedGenre
          ? await fetchTVByGenre(selectedGenre, page)
          : await fetchPopularTV(page);
        if (!cancelled) {
          setShows((prev) => [...prev, ...data.results]);
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
  }, [page, selectedGenre]);

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        !loading &&
        !loadingMore &&
        page < totalPages
      ) {
        setPage((p) => p + 1);
      }
    },
    [loading, loadingMore, page, totalPages],
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

  function selectGenre(id: number | null) {
    setSelectedGenre(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="bg-[#0B0B0B] min-h-screen pt-24 px-6 md:px-14 pb-16">
      <h1 className="text-3xl font-bold text-white mb-6">TV Shows</h1>

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => selectGenre(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedGenre === null
              ? "bg-[#E50914] text-white"
              : "bg-[#2B2B2B] text-[#B3B3B3] hover:bg-[#3A3A3A] hover:text-white"
          }`}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            type="button"
            key={g.id}
            onClick={() => selectGenre(g.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedGenre === g.id
                ? "bg-[#E50914] text-white"
                : "bg-[#2B2B2B] text-[#B3B3B3] hover:bg-[#3A3A3A] hover:text-white"
            }`}
          >
            {g.name}
          </button>
        ))}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {shows.map((show) => (
            <button
              type="button"
              key={show.id}
              className="group cursor-pointer text-left"
              onClick={() =>
                navigate({ to: "/tv/$id", params: { id: String(show.id) } })
              }
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                {show.poster_path ? (
                  <img
                    src={getPosterUrl(show.poster_path)}
                    alt={show.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2B2B2B] flex items-center justify-center">
                    <span className="text-[#555] text-xs text-center px-2">
                      {show.name}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex items-center gap-1 text-[#46D369] text-xs">
                    <Star size={10} fill="currentColor" />
                    <span>{formatRating(show.vote_average)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-[#B3B3B3] truncate">
                {show.name}
              </p>
              <p className="text-[10px] text-[#555]">
                {formatYear(show.first_air_date)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Load more sentinel */}
      <div ref={sentinelRef} className="h-10 mt-4" />

      {/* Loading more spinner */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* End of results */}
      {!loading && !loadingMore && page >= totalPages && shows.length > 0 && (
        <p className="text-center text-[#555] text-sm py-6">
          You've reached the end
        </p>
      )}
    </div>
  );
}
