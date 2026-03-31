import { useNavigate } from "@tanstack/react-router";
import { Info, Play, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatRating, formatYear, truncate } from "../lib/helpers";
import { getBackdropUrl } from "../lib/tmdb";
import { type MediaItem, getDate, getTitle, isMovie } from "../lib/types";

interface HeroBannerProps {
  items: MediaItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % Math.min(items.length, 5));
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

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

  function goToDetail() {
    if (isMovie(item)) {
      void navigate({ to: "/movie/$id", params: { id: String(item.id) } });
    } else {
      void navigate({ to: "/tv/$id", params: { id: String(item.id) } });
    }
  }

  return (
    <div className="relative w-full h-[80vh] min-h-[520px] overflow-hidden">
      {/* Backdrop image */}
      {backdrop && (
        <img
          key={item.id}
          src={backdrop}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
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
                onClick={goToDetail}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e0e0e0] transition-colors text-sm"
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>
              <button
                type="button"
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

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-8 right-8 md:right-14 flex gap-2">
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
  );
}
