import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MediaCard from "../components/MediaCard";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import { searchMulti } from "../lib/tmdb";
import type { MediaItem } from "../lib/types";
import { isMovie } from "../lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { watchlistIds, toggleWatchlist } = useFirestoreWatchlist();

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
          data-ocid="search.input"
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
          <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-visible">
            {results.map((item, index) => (
              <div
                key={`${item.media_type}-${item.id}`}
                className="card-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MediaCard
                  className="w-full"
                  item={item}
                  inWatchlist={watchlistIds.has(item.id)}
                  onToggleWatchlist={() =>
                    toggleWatchlist(item.id, isMovie(item) ? "movie" : "tv")
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
