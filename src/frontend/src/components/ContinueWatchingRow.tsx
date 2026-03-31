import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";

const IMG_BACKDROP = "https://image.tmdb.org/t/p/w500";
const IMG_POSTER = "https://image.tmdb.org/t/p/w342";
const TMDB_KEY = "49b128b9a6ea789ec26c298a504887a7";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

type WatchEntry = ReturnType<
  typeof useFirestoreWatchHistory
>["history"][number];

function useRuntime(entry: WatchEntry): number | null {
  const [runtime, setRuntime] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      try {
        let url: string;
        if (entry.type === "movie") {
          url = `https://api.themoviedb.org/3/movie/${entry.id}?api_key=${TMDB_KEY}`;
        } else {
          url = `https://api.themoviedb.org/3/tv/${entry.id}/season/${entry.season ?? 1}/episode/${entry.episode ?? 1}?api_key=${TMDB_KEY}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled && typeof data.runtime === "number") {
          setRuntime(data.runtime);
        }
      } catch {
        // silently ignore
      }
    }
    void fetch_();
    return () => {
      cancelled = true;
    };
  }, [entry.id, entry.type, entry.season, entry.episode]);

  return runtime;
}

function ContinueWatchingCard({
  entry,
  index,
  onRemove,
  onPlay,
  onInfo,
}: {
  entry: WatchEntry;
  index: number;
  onRemove: () => void;
  onPlay: () => void;
  onInfo: () => void;
}) {
  const runtime = useRuntime(entry);
  const currentTimeSecs = entry.currentTime ?? 0;
  const currentTimeMins = Math.floor(currentTimeSecs / 60);
  const minsLeft =
    runtime !== null ? Math.max(0, runtime - currentTimeMins) : null;
  const progressPct =
    runtime !== null && runtime > 0
      ? Math.min(100, (currentTimeSecs / (runtime * 60)) * 100)
      : null;

  const imgSrc = entry.backdropPath
    ? `${IMG_BACKDROP}${entry.backdropPath}`
    : entry.posterPath
      ? `${IMG_POSTER}${entry.posterPath}`
      : null;

  return (
    <button
      key={`${entry.type}-${entry.id}`}
      type="button"
      data-ocid={`continue_watching.item.${index + 1}`}
      className="relative flex-shrink-0 w-48 md:w-56 cursor-pointer group/card rounded-md overflow-hidden bg-[#1A1A1A] text-left"
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#2B2B2B]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={entry.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">
            No Image
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white ml-1" />
          </div>
        </div>
        {/* Remove button */}
        <button
          type="button"
          data-ocid={`continue_watching.delete_button.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
        >
          <X size={12} />
        </button>
        {/* Info (i) button — bottom right */}
        <button
          type="button"
          data-ocid={`continue_watching.open_modal_button.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
          className="absolute bottom-4 right-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
        >
          <Info size={12} />
        </button>
        {/* Progress bar */}
        {progressPct !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-[#E50914]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2">
        <p className="text-white text-xs font-semibold truncate">
          {entry.title}
        </p>
        {entry.type === "tv" && entry.season && entry.episode && (
          <p className="text-[#B3B3B3] text-xs mt-0.5">
            S{String(entry.season).padStart(2, "0")} E
            {String(entry.episode).padStart(2, "0")}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-[#B3B3B3]" />
            <span className="text-[#B3B3B3] text-xs">
              {timeAgo(entry.timestamp)}
            </span>
          </div>
          {minsLeft !== null && currentTimeSecs > 0 && (
            <span className="text-[#888] text-xs">{minsLeft} min left</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ContinueWatchingRow() {
  const { history, removeFromHistory } = useFirestoreWatchHistory();
  const navigate = useNavigate();
  const rowRef = useRef<HTMLDivElement>(null);

  if (history.length === 0) return null;

  function scroll(dir: "left" | "right") {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  }

  function handlePlay(entry: (typeof history)[number]) {
    if (entry.type === "movie") {
      void navigate({
        to: "/watch/movie/$id",
        params: { id: String(entry.id) },
      });
    } else {
      void navigate({
        to: "/watch/tv/$id/$season/$episode",
        params: {
          id: String(entry.id),
          season: String(entry.season ?? 1),
          episode: String(entry.episode ?? 1),
        },
      });
    }
  }

  function handleInfo(entry: (typeof history)[number]) {
    if (entry.type === "movie") {
      void navigate({ to: "/movie/$id", params: { id: String(entry.id) } });
    } else {
      void navigate({ to: "/tv/$id", params: { id: String(entry.id) } });
    }
  }

  return (
    <section className="px-6 md:px-14 mb-8">
      <h2 className="text-white text-xl md:text-2xl font-bold mb-4">
        Continue Watching
      </h2>
      <div className="relative group">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          data-ocid="continue_watching.pagination_prev"
        >
          <ChevronLeft size={18} />
        </button>
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none" }}
          data-ocid="continue_watching.list"
        >
          {history.map((entry, i) => (
            <ContinueWatchingCard
              key={`${entry.type}-${entry.id}`}
              entry={entry}
              index={i}
              onRemove={() => removeFromHistory(entry.id, entry.type)}
              onPlay={() => handlePlay(entry)}
              onInfo={() => handleInfo(entry)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          data-ocid="continue_watching.pagination_next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
