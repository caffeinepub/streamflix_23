import { useNavigate } from "@tanstack/react-router";
import { Search, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatRating, formatYear } from "../lib/helpers";
import { getPosterUrl, searchMulti } from "../lib/tmdb";
import type { MediaItem } from "../lib/types";
import { getDate, getTitle, isMovie } from "../lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(query);
        const filtered = data.results.filter(
          (item) => item.media_type === "movie" || item.media_type === "tv",
        );
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleClickItem(item: MediaItem) {
    if (isMovie(item)) {
      void navigate({ to: "/movie/$id", params: { id: String(item.id) } });
    } else {
      void navigate({ to: "/tv/$id", params: { id: String(item.id) } });
    }
  }

  return (
    <div className="bg-[#0B0B0B] min-h-screen pt-24 px-6 md:px-14 pb-16">
      {/* Search bar */}
      <div className="relative max-w-2xl mb-10">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, TV shows..."
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-12 pr-4 py-4 rounded-xl text-base placeholder-[#555] focus:outline-none focus:border-[#E50914] transition-colors"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-[#B3B3B3] text-sm mb-6">
          <div className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          Searching...
        </div>
      )}

      {/* Results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#555] text-lg">
            No results found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-[#3A3A3A] text-sm mt-2">
            Try a different search term
          </p>
        </div>
      )}

      {!query && (
        <div className="text-center py-24">
          <Search size={48} className="mx-auto text-[#2B2B2B] mb-4" />
          <p className="text-[#555] text-lg">Search for movies and TV shows</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="text-[#B3B3B3] text-sm mb-6">
            {results.length} results for &ldquo;{query}&rdquo;
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item) => (
              <button
                type="button"
                key={`${item.media_type}-${item.id}`}
                className="group cursor-pointer text-left"
                onClick={() => handleClickItem(item)}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  {item.poster_path ? (
                    <img
                      src={getPosterUrl(item.poster_path)}
                      alt={getTitle(item)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2B2B2B] flex items-center justify-center">
                      <span className="text-[#555] text-xs text-center px-2">
                        {getTitle(item)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        item.media_type === "movie"
                          ? "bg-[#E50914] text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {item.media_type === "movie" ? "Movie" : "TV"}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="flex items-center gap-1 text-[#46D369] text-xs">
                      <Star size={10} fill="currentColor" />
                      <span>{formatRating(item.vote_average)}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-[#B3B3B3] truncate">
                  {getTitle(item)}
                </p>
                <p className="text-[10px] text-[#555]">
                  {formatYear(getDate(item))}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
