import { useNavigate } from "@tanstack/react-router";
import { Info, Play, Star, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { formatRating, formatYear, truncate } from "../lib/helpers";
import { getBackdropUrl } from "../lib/tmdb";
import { type MediaItem, getDate, getTitle, isMovie } from "../lib/types";

const TMDB_KEY = "49b128b9a6ea789ec26c298a504887a7";

interface HeroBannerProps {
  items: MediaItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % Math.min(items.length, 5));
    }, 20000);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    if (!items.length) return;
    const item = items[current];
    setTrailerKey(null);
    const mediaType = isMovie(item) ? "movie" : "tv";
    fetch(
      `https://api.themoviedb.org/3/${mediaType}/${item.id}/videos?api_key=${TMDB_KEY}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const results: { site: string; type: string; key: string }[] =
          data.results ?? [];
        const trailer =
          results.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
          results.find((v) => v.site === "YouTube" && v.type === "Teaser");
        setTrailerKey(trailer?.key ?? null);
      })
      .catch(() => setTrailerKey(null));
  }, [current, items]);

  if (!items.length) {
    return (
      <div className="h-[70vh] bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const item = items[current];
  const title = getTitle(item);
  const mediaType = isMovie(item) ? "movie" : "tv";
  const date = getDate(item);
  const backdrop = getBackdropUrl(item.backdrop_path, "original");

  const trailerSrc = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=0`
    : null;

  function goToDetail() {
    if (isMovie(item)) {
      void navigate({ to: "/movie/$id", params: { id: String(item.id) } });
    } else {
      void navigate({ to: "/tv/$id", params: { id: String(item.id) } });
    }
  }

  function goToWatch() {
    if (isMovie(item)) {
      void navigate({
        to: "/watch/movie/$id",
        params: { id: String(item.id) },
      });
    } else {
      void navigate({
        to: "/watch/tv/$id/$season/$episode",
        params: { id: String(item.id), season: "1", episode: "1" },
      });
    }
  }

  return (
    <div className="relative w-full h-[80vh] min-h-[520px] overflow-hidden">
      {/* Backdrop image (always shown as fallback/poster) */}
      {backdrop && (
        <img
          key={item.id}
          src={backdrop}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* YouTube trailer iframe */}
      {trailerSrc && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            key={`${trailerKey}-${isMuted ? 1 : 0}`}
            src={trailerSrc}
            allow="autoplay"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: "177.78vh",
              height: "56.25vw",
              minWidth: "100%",
              minHeight: "100%",
              border: "none",
            }}
            title="trailer"
          />
        </div>
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0Baa] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-[#0B0B0B44]" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1400px] mx-auto w-full px-6 md:px-14">
          <div className="max-w-lg mt-16">
            {/* Badge */}
            <span className="inline-block bg-[#E50914] text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-4">
              {mediaType === "movie" ? "Movie" : "TV Show"}
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight mb-4 drop-shadow-2xl">
              {title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 text-[#46D369] text-sm font-semibold">
                <Star size={14} fill="currentColor" />
                <span>{formatRating(item.vote_average)}</span>
              </div>
              {date && (
                <span className="text-[#B3B3B3] text-sm">
                  {formatYear(date)}
                </span>
              )}
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-[#B3B3B3] text-sm md:text-base leading-relaxed mb-6">
                {truncate(item.overview, 180)}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="hero.primary_button"
                onClick={goToWatch}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e0e0e0] transition-colors text-sm"
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>
              <button
                type="button"
                data-ocid="hero.secondary_button"
                onClick={goToDetail}
                className="flex items-center gap-2 bg-[#2B2B2Bcc] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#3A3A3A] border border-[#555] transition-colors text-sm backdrop-blur-sm"
              >
                <Info size={18} />
                More Info
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-right controls: mute button + dots */}
      <div className="absolute bottom-8 right-8 md:right-14 flex items-center gap-3">
        {/* Mute toggle (only shown when trailer is playing) */}
        {trailerKey && (
          <button
            type="button"
            data-ocid="hero.toggle"
            onClick={() => setIsMuted((m) => !m)}
            className="w-9 h-9 rounded-full bg-[#1a1a1acc] border border-[#555] flex items-center justify-center text-white hover:bg-[#2a2a2a] transition-colors backdrop-blur-sm"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="flex gap-2">
            {items.slice(0, 5).map((itm, i) => (
              <button
                type="button"
                key={itm.id}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? "bg-white w-4" : "bg-[#555] hover:bg-[#888]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
