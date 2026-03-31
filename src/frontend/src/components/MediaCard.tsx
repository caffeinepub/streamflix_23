import { useNavigate } from "@tanstack/react-router";
import { Check, Info, Play, Plus, Star } from "lucide-react";
import { useState } from "react";
import { formatRating, formatYear } from "../lib/helpers";
import { getPosterUrl } from "../lib/tmdb";
import { type MediaItem, getDate, getTitle, isMovie } from "../lib/types";

interface MediaCardProps {
  item: MediaItem;
  inWatchlist?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  className?: string;
}

export default function MediaCard({
  item,
  inWatchlist,
  onToggleWatchlist,
  className,
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

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (mediaType === "movie") {
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

  function handleMoreInfo(e: React.MouseEvent) {
    e.stopPropagation();
    handleClick();
  }

  return (
    <div
      className={`cursor-pointer text-left ${
        className ?? "shrink-0 w-32 md:w-40 lg:w-44"
      }`}
      style={{ position: "relative", zIndex: hovered ? 50 : "auto" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Base card */}
      <button
        type="button"
        className="w-full text-left"
        onClick={handleClick}
        tabIndex={hovered ? -1 : 0}
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
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

      {/* Netflix-style hover popup */}
      {hovered && (
        <div
          className="absolute inset-x-0 top-0 rounded-lg overflow-hidden shadow-2xl ring-2 ring-white/20"
          style={{
            transform: "scale(1.15)",
            transformOrigin: "center top",
            zIndex: 100,
          }}
        >
          {/* Poster - clicking navigates to detail page */}
          <button
            type="button"
            className="relative w-full aspect-[2/3] block cursor-pointer text-left"
            onClick={handleClick}
          >
            {item.poster_path ? (
              <img
                src={getPosterUrl(item.poster_path)}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#2B2B2B] flex items-center justify-center">
                <span className="text-[#555] text-xs text-center px-2">
                  {title}
                </span>
              </div>
            )}

            {/* Dark gradient overlay on bottom 60% */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Media type badge */}
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[9px] font-bold bg-[#E50914] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                {mediaType === "movie" ? "M" : "TV"}
              </span>
            </div>

            {/* Bottom overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-white font-bold text-[11px] truncate leading-tight mb-0.5">
                {title}
              </p>
              <div className="flex items-center gap-1.5 mb-2">
                {date && (
                  <span className="text-[#999] text-[9px]">
                    {formatYear(date)}
                  </span>
                )}
                <div className="flex items-center gap-0.5 text-[#46D369] text-[9px]">
                  <Star size={8} fill="currentColor" />
                  <span>{formatRating(item.vote_average)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Play button */}
                <button
                  type="button"
                  data-ocid="mediacard.play_button"
                  onClick={handlePlay}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E50914] hover:bg-[#f40612] transition-colors shadow-lg flex-shrink-0"
                  title={`Play ${title}`}
                >
                  <Play size={12} fill="white" className="text-white ml-0.5" />
                </button>

                {/* Add to My List button */}
                {onToggleWatchlist && (
                  <button
                    type="button"
                    data-ocid="mediacard.toggle"
                    onClick={handleWatchlist}
                    className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors flex-shrink-0 ${
                      inWatchlist
                        ? "border-[#46D369] bg-[#46D369]/20 text-[#46D369]"
                        : "border-white/70 bg-black/30 text-white hover:border-white"
                    }`}
                    title={
                      inWatchlist ? "Remove from My List" : "Add to My List"
                    }
                  >
                    {inWatchlist ? <Check size={12} /> : <Plus size={12} />}
                  </button>
                )}

                {/* More Info button */}
                <button
                  type="button"
                  data-ocid="mediacard.secondary_button"
                  onClick={handleMoreInfo}
                  className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-white/70 bg-black/30 text-white hover:border-white transition-colors flex-shrink-0"
                  title="More Info"
                >
                  <Info size={12} />
                </button>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
