import { Clapperboard, Film, Search, Star, Tv } from "lucide-react";
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
  const [focused, setFocused] = useState(false);
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
      {/* 3D Glassmorphism Search Bar */}
      <div className="relative max-w-2xl mb-10">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{ color: focused ? "#E50914" : "#555" }}
        />
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: focused
              ? "1px solid rgba(229,9,20,0.6)"
              : "1px solid rgba(255,255,255,0.1)",
            boxShadow: focused
              ? "0 8px 32px rgba(0,0,0,0.6), 0 0 0 2px rgba(229,9,20,0.3), 0 0 20px rgba(229,9,20,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search movies, TV shows..."
            className="w-full bg-transparent text-white pl-12 pr-4 py-4 rounded-[16px] text-base placeholder-[#555] focus:outline-none"
            data-ocid="search.input"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-[#B3B3B3] text-sm mb-6">
          <div className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          Searching...
        </div>
      )}

      {/* No results state */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-20" style={{ perspective: "1000px" }}>
          <div
            className="mx-auto mb-6 flex items-center justify-center animate-pulse-glow"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(229,9,20,0.25) 0%, rgba(229,9,20,0.05) 70%)",
              boxShadow:
                "0 0 40px rgba(229,9,20,0.3), 0 0 80px rgba(229,9,20,0.1)",
              border: "1px solid rgba(229,9,20,0.2)",
            }}
          >
            <Search size={36} style={{ color: "#E50914" }} />
          </div>
          <p className="text-white font-semibold text-xl mb-2">
            No results for &ldquo;
            <span style={{ color: "#E50914" }}>{query}</span>&rdquo;
          </p>
          <p className="text-[#555] text-sm">Try a different search term</p>
        </div>
      )}

      {/* Idle/empty state — rich 3D animated prompt */}
      {!query && (
        <div
          className="flex flex-col items-center justify-center py-24 relative"
          style={{ perspective: "1000px" }}
        >
          {/* Atmospheric background glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(229,9,20,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Orbital container */}
          <div
            className="relative flex items-center justify-center mb-10"
            style={{ width: 180, height: 180 }}
          >
            {/* Orbiting decorative icons */}
            <div
              className="absolute animate-orbit"
              style={{
                top: 8,
                left: 12,
                animationDelay: "0s",
                animationDuration: "6s",
              }}
            >
              <Film size={22} style={{ color: "rgba(229,9,20,0.7)" }} />
            </div>
            <div
              className="absolute animate-orbit"
              style={{
                top: 14,
                right: 10,
                animationDelay: "-1.5s",
                animationDuration: "7s",
              }}
            >
              <Tv size={20} style={{ color: "rgba(100,140,255,0.7)" }} />
            </div>
            <div
              className="absolute animate-orbit"
              style={{
                bottom: 10,
                left: 20,
                animationDelay: "-3s",
                animationDuration: "8s",
              }}
            >
              <Star size={18} style={{ color: "rgba(255,200,50,0.7)" }} />
            </div>
            <div
              className="absolute animate-orbit"
              style={{
                bottom: 14,
                right: 16,
                animationDelay: "-4.5s",
                animationDuration: "6.5s",
              }}
            >
              <Clapperboard size={20} style={{ color: "rgba(229,9,20,0.5)" }} />
            </div>

            {/* Central glowing orb */}
            <div
              className="animate-float animate-pulse-glow flex items-center justify-center"
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 35%, rgba(229,9,20,0.4) 0%, rgba(229,9,20,0.15) 50%, rgba(0,0,0,0.6) 100%)",
                boxShadow:
                  "0 0 40px rgba(229,9,20,0.4), 0 0 80px rgba(229,9,20,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                border: "1px solid rgba(229,9,20,0.3)",
              }}
            >
              <Search
                size={40}
                style={{
                  color: "#E50914",
                  filter: "drop-shadow(0 0 8px rgba(229,9,20,0.8))",
                }}
              />
            </div>
          </div>

          {/* Text */}
          <h2
            className="text-white font-bold text-2xl md:text-3xl mb-3 text-center"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            Discover Something Amazing
          </h2>
          <p className="text-[#B3B3B3] text-base text-center">
            Search movies, TV shows, and more
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <p className="text-[#B3B3B3] text-sm mb-6">
            <span className="text-white font-semibold">{results.length}</span>
            {" results for "}
            <span style={{ color: "#E50914" }}>&ldquo;{query}&rdquo;</span>
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
