import { useNavigate } from "@tanstack/react-router";
import { Check, Plus, Star } from "lucide-react";
import { useState } from "react";
import { formatRating, formatYear } from "../lib/helpers";
import { getPosterUrl } from "../lib/tmdb";
import { type MediaItem, getDate, getTitle, isMovie } from "../lib/types";

interface MediaCardProps {
  item: MediaItem;
  inWatchlist?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
}

export default function MediaCard({
  item,
  inWatchlist,
  onToggleWatchlist,
}: MediaCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const title = getTitle(item);
  const date = getDate(item);
  const mediaType = isMovie(item) ? "movie" : "tv";

  function handleClick() {
    if (mediaType === "movie") {
      void navigate({ to: "/movie/$id", params: { id: String(item.id) } });
    } else {
      void navigate({ to: "/tv/$id", params: { id: String(item.id) } });
    }
  }

  function handleWatchlist(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleWatchlist?.(item);
  }

  return (
    <button
      type="button"
      className="shrink-0 w-32 md:w-40 lg:w-44 cursor-pointer group text-left"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div
        className={`relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 ${
          hovered ? "ring-2 ring-white shadow-2xl" : ""
        }`}
        style={{
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {item.poster_path ? (
          <img
            src={getPosterUrl(item.poster_path)}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#2B2B2B] flex items-center justify-center">
            <span className="text-[#555] text-xs text-center px-2">
              {title}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        {hovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-[#00000055] to-transparent flex flex-col justify-end p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[#46D369] text-xs font-semibold">
                <Star size={10} fill="currentColor" />
                <span>{formatRating(item.vote_average)}</span>
              </div>
              {onToggleWatchlist && (
                <button
                  type="button"
                  onClick={handleWatchlist}
                  className={`p-1 rounded-full transition-colors ${
                    inWatchlist
                      ? "bg-[#46D369] text-black"
                      : "bg-[#2B2B2Bcc] text-white hover:bg-[#E50914]"
                  }`}
                >
                  {inWatchlist ? <Check size={12} /> : <Plus size={12} />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[9px] font-bold bg-[#E50914] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
            {mediaType === "movie" ? "M" : "TV"}
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-[#B3B3B3] truncate">{title}</p>
      {date && <p className="text-[10px] text-[#555]">{formatYear(date)}</p>}
    </button>
  );
}
