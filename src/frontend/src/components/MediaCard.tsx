import { useNavigate } from "@tanstack/react-router";
import { Check, Info, Play, Plus, Star } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { formatRating, formatYear } from "../lib/helpers";
import { getPosterUrl } from "../lib/tmdb";
import { type MediaItem, getDate, getTitle, isMovie } from "../lib/types";

interface MediaCardProps {
  item: MediaItem;
  inWatchlist?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  className?: string;
}

const DEFAULT_ACCENT = "rgba(229, 9, 20, 0.85)";

function extractAccentColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 20;
        canvas.height = 30;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(DEFAULT_ACCENT);
          return;
        }
        ctx.drawImage(img, 0, 0, 20, 30);
        const data = ctx.getImageData(0, 0, 20, 30).data;

        let bestR = 229;
        let bestG = 9;
        let bestB = 20;
        let bestSat = -1;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 220) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat > bestSat) {
            bestSat = sat;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }
        resolve(`rgba(${bestR}, ${bestG}, ${bestB}, 0.85)`);
      } catch {
        resolve(DEFAULT_ACCENT);
      }
    };
    img.onerror = () => resolve(DEFAULT_ACCENT);
    img.src = src;
  });
}

function toAlpha(color: string, alpha: number): string {
  return color.replace(/,[\s\d.]+\)$/, `, ${alpha})`);
}

function MediaTypeBadge({ mediaType }: { mediaType: "movie" | "tv" }) {
  const isMovieType = mediaType === "movie";
  return (
    <span
      style={{
        background: isMovieType ? "rgba(229,9,20,0.9)" : "rgba(29,78,216,0.9)",
        boxShadow: isMovieType
          ? "0 2px 8px rgba(229,9,20,0.6), 0 0 12px rgba(229,9,20,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
          : "0 2px 8px rgba(29,78,216,0.6), 0 0 12px rgba(29,78,216,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        borderRadius: "4px",
        fontSize: "8px",
        fontWeight: 800,
        letterSpacing: "0.08em",
        padding: "2px 5px",
        color: "white",
        transform: "translateZ(4px)",
        display: "inline-block",
        textTransform: "uppercase",
      }}
    >
      {isMovieType ? "MOVIE" : "TV"}
    </span>
  );
}

export default function MediaCard({
  item,
  inWatchlist,
  onToggleWatchlist,
  className,
}: MediaCardProps) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const navigate = useNavigate();
  const title = getTitle(item);
  const date = getDate(item);
  const mediaType = isMovie(item) ? "movie" : "tv";

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -22, y: dx * 22 });
  }, []);

  const handleMouseEnter = useCallback(async () => {
    setHovered(true);
    if (item.poster_path) {
      const src = getPosterUrl(item.poster_path);
      const color = await extractAccentColor(src);
      setAccentColor(color);
    }
  }, [item.poster_path]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

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

  const hoverTransform = hovered
    ? `scale(1.18) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : "scale(1) rotateX(0deg) rotateY(0deg)";

  const accentAt40 = toAlpha(accentColor, 0.4);
  const accentAt50 = toAlpha(accentColor, 0.5);

  return (
    <div
      ref={cardRef}
      className={`cursor-pointer text-left ${
        className ?? "shrink-0 w-32 md:w-40 lg:w-44"
      }`}
      style={{
        position: "relative",
        zIndex: hovered ? 50 : "auto",
        perspective: "800px",
        filter: hovered
          ? `drop-shadow(0 0 12px ${accentColor}) drop-shadow(0 0 24px ${accentAt50})`
          : "none",
        transition: "filter 0.4s ease-out",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
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
              ref={imgRef}
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
            <MediaTypeBadge mediaType={mediaType} />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-[#B3B3B3] truncate">{title}</p>
        {date && <p className="text-[10px] text-[#555]">{formatYear(date)}</p>}
      </button>

      {/* Netflix-style hover popup with cursor-tracking tilt */}
      <div
        className="absolute inset-x-0 top-0 rounded-lg overflow-hidden"
        style={{
          transformOrigin: "center center",
          transformStyle: "preserve-3d",
          zIndex: 100,
          opacity: hovered ? 1 : 0,
          transform: hoverTransform,
          boxShadow: hovered
            ? `0 0 20px 8px ${accentColor}, 0 0 40px 15px ${accentAt40}, 0 30px 60px rgba(0,0,0,0.85), 0 0 0 2px rgba(255,255,255,0.15)`
            : "none",
          transition: hovered
            ? "transform 0.08s linear, opacity 0.3s ease-out, box-shadow 0.4s ease-out"
            : "transform 0.4s ease-out, opacity 0.3s ease-out, box-shadow 0.4s ease-out",
          pointerEvents: hovered ? "auto" : "none",
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
            <MediaTypeBadge mediaType={mediaType} />
          </div>

          {/* Gloss shimmer sweep on hover */}
          <div
            aria-hidden="true"
            className="card-gloss-shimmer"
            style={{
              opacity: hovered ? 1 : 0,
              animation: hovered ? "cardGloss 0.6s ease-out forwards" : "none",
            }}
          />

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
            <div
              className="flex items-center gap-2"
              style={{
                opacity: hovered ? 1 : 0,
                transition: "opacity 0.25s ease 0.15s",
              }}
            >
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
                  title={inWatchlist ? "Remove from My List" : "Add to My List"}
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
    </div>
  );
}
