import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatRating, formatYear } from "../lib/helpers";
import {
  fetchMovieGenres,
  fetchMoviesByGenre,
  fetchPopularMovies,
  getPosterUrl,
} from "../lib/tmdb";
import type { Genre, Movie } from "../lib/types";

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
  const navigate = useNavigate();

  useEffect(() => {
    void fetchMovieGenres().then((data) => setGenres(data.genres));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const data = selectedGenre
          ? await fetchMoviesByGenre(selectedGenre, page)
          : await fetchPopularMovies(page);
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
  }, [selectedGenre, page]);

  function selectGenre(id: number | null) {
    setSelectedGenre(id);
    setPage(1);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <button
              type="button"
              key={movie.id}
              className="group cursor-pointer text-left"
              onClick={() =>
                navigate({ to: "/movie/$id", params: { id: String(movie.id) } })
              }
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                {movie.poster_path ? (
                  <img
                    src={getPosterUrl(movie.poster_path)}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2B2B2B] flex items-center justify-center">
                    <span className="text-[#555] text-xs text-center px-2">
                      {movie.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex items-center gap-1 text-[#46D369] text-xs">
                    <Star size={10} fill="currentColor" />
                    <span>{formatRating(movie.vote_average)}</span>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-[#B3B3B3] truncate">
                {movie.title}
              </p>
              <p className="text-[10px] text-[#555]">
                {formatYear(movie.release_date)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            type="button"
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page === 1}
            className="flex items-center gap-1 bg-[#2B2B2B] text-white px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-[#3A3A3A] transition-colors text-sm"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-[#B3B3B3] text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page === totalPages}
            className="flex items-center gap-1 bg-[#2B2B2B] text-white px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-[#3A3A3A] transition-colors text-sm"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
