import { useCallback, useEffect, useRef, useState } from "react";
import MediaCard from "../components/MediaCard";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import {
  fetchMovieGenres,
  fetchMoviesByGenre,
  fetchPopularMovies,
} from "../lib/tmdb";
import type { Genre, MediaItem, Movie } from "../lib/types";

const SKELETON_KEYS = Array.from(
  { length: 20 },
  (_, i) => `skeleton-movie-${i}`,
);

export default function MoviesPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { watchlistIds, toggleWatchlist } = useFirestoreWatchlist();

  useEffect(() => {
    void fetchMovieGenres().then((data) => setGenres(data.genres));
  }, []);

  // Reset and load first page when genre changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMovies([]);
    setPage(1);
    const load = async () => {
      try {
        const data = selectedGenre
          ? await fetchMoviesByGenre(selectedGenre, 1)
          : await fetchPopularMovies(1);
        if (!cancelled) {
          setMovies(data.results);
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
          ? await fetchMoviesByGenre(selectedGenre, page)
          : await fetchPopularMovies(page);
        if (!cancelled) {
          setMovies((prev) => [...prev, ...data.results]);
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
      <h1 className="text-3xl font-bold text-white mb-6">Movies</h1>

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
        <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-visible">
          {movies.map((movie) => (
            <MediaCard
              className="w-full"
              key={movie.id}
              item={movie as MediaItem}
              inWatchlist={watchlistIds.has(movie.id)}
              onToggleWatchlist={() => toggleWatchlist(movie.id, "movie")}
            />
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
      {!loading && !loadingMore && page >= totalPages && movies.length > 0 && (
        <p className="text-center text-[#555] text-sm py-6">
          You've reached the end
        </p>
      )}
    </div>
  );
}
