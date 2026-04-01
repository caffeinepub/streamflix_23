import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { MediaItem } from "../lib/types";
import MediaCard from "./MediaCard";
import SkeletonCard from "./SkeletonCard";

interface ContentRowProps {
  title: string;
  items: MediaItem[];
  loading?: boolean;
  watchlistIds?: Set<number>;
  onToggleWatchlist?: (item: MediaItem) => void;
  onViewAll?: () => void;
}

export default function ContentRow({
  title,
  items,
  loading,
  watchlistIds,
  onToggleWatchlist,
  onViewAll,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="py-4 group/row">
      <div className="flex items-center justify-between px-6 md:px-14 mb-3">
        <h2 className="text-white font-semibold text-lg md:text-xl">{title}</h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            data-ocid="content_row.view_all_button"
            className="text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full border border-white/30 text-white/80 hover:border-white hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-1 shrink-0"
          >
            View All <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="relative overflow-visible">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-[60] bg-[#0B0B0Bcc] text-white p-2 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-[#1A1A1A] border border-[#2A2A2A]"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrollable row — pt-8 gives headroom so scaled/tilted cards aren't clipped at the top */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-6 md:px-14 pt-8 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique id
                <SkeletonCard key={i} />
              ))
            : items.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  inWatchlist={watchlistIds?.has(item.id)}
                  onToggleWatchlist={onToggleWatchlist}
                />
              ))}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-[60] bg-[#0B0B0Bcc] text-white p-2 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-[#1A1A1A] border border-[#2A2A2A]"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
