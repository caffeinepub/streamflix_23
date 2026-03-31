import { useNavigate } from "@tanstack/react-router";
import { Clock, Play, Trash2, User, X } from "lucide-react";
import { useWatchHistory } from "../hooks/useWatchHistory";

const IMG_BACKDROP = "https://image.tmdb.org/t/p/w500";
const IMG_POSTER = "https://image.tmdb.org/t/p/w342";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

export default function ProfilePage() {
  const { history, removeFromHistory, clearHistory } = useWatchHistory();
  const navigate = useNavigate();

  function handleCardClick(entry: (typeof history)[number]) {
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

  return (
    <div className="min-h-screen bg-[#0B0B0B] pt-20 pb-24 px-6 md:px-14">
      <div className="max-w-[1400px] mx-auto">
        {/* Profile header */}
        <div className="flex flex-col items-center py-10 mb-10 border-b border-[#2A2A2A]">
          <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-[#E50914] flex items-center justify-center mb-4">
            <User size={44} className="text-[#E50914]" />
          </div>
          <h1 className="text-white text-2xl font-bold">My Profile</h1>
          <p className="text-[#B3B3B3] text-sm mt-1">
            Your personal streaming hub
          </p>
        </div>

        {/* Continue Watching section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Continue Watching</h2>
          {history.length > 0 && (
            <button
              type="button"
              data-ocid="profile.delete_button"
              onClick={clearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-[#2B2B2B] hover:bg-[#3A3A3A] text-[#B3B3B3] hover:text-white rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 size={15} />
              Clear All
            </button>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div
            data-ocid="profile.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-6">
              <Play size={32} className="text-[#B3B3B3] ml-1" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Nothing to continue watching yet
            </h3>
            <p className="text-[#B3B3B3] text-sm max-w-sm">
              Start watching a movie or TV show and it will appear here so you
              can pick up right where you left off.
            </p>
            <button
              type="button"
              data-ocid="profile.primary_button"
              onClick={() => navigate({ to: "/" })}
              className="mt-6 px-6 py-2.5 bg-[#E50914] hover:bg-[#C40812] text-white rounded-md text-sm font-semibold transition-colors"
            >
              Browse Content
            </button>
          </div>
        )}

        {/* Grid */}
        {history.length > 0 && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            data-ocid="profile.list"
          >
            {history.map((entry, i) => {
              const imgSrc = entry.backdropPath
                ? `${IMG_BACKDROP}${entry.backdropPath}`
                : entry.posterPath
                  ? `${IMG_POSTER}${entry.posterPath}`
                  : null;
              return (
                <button
                  key={`${entry.type}-${entry.id}`}
                  type="button"
                  data-ocid={`profile.item.${i + 1}`}
                  className="relative group/card cursor-pointer rounded-md overflow-hidden bg-[#1A1A1A] text-left w-full"
                  onClick={() => handleCardClick(entry)}
                >
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[12px] border-l-white ml-1" />
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid={`profile.delete_button.${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(entry.id, entry.type);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                    >
                      <X size={13} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-[#E50914]"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold truncate">
                      {entry.title}
                    </p>
                    {entry.type === "tv" && entry.season && entry.episode && (
                      <p className="text-[#B3B3B3] text-xs mt-0.5">
                        Season {entry.season} · Episode {entry.episode}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock size={11} className="text-[#B3B3B3]" />
                      <span className="text-[#B3B3B3] text-xs">
                        {timeAgo(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
