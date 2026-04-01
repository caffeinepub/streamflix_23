import { useNavigate } from "@tanstack/react-router";
import { collection, onSnapshot } from "firebase/firestore";
import {
  BookmarkX,
  Clock,
  Download,
  Film,
  Globe,
  Info,
  List,
  LogOut,
  Play,
  Smartphone,
  Sparkles,
  Trash2,
  Tv2,
  User,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { useStreamingProvider } from "../hooks/useStreamingProvider";
import type { StreamingProvider } from "../hooks/useStreamingProvider";
import { db } from "../lib/firebase";

const IMG_BACKDROP = "https://image.tmdb.org/t/p/w500";
const IMG_POSTER = "https://image.tmdb.org/t/p/w342";
const TMDB_KEY = "49b128b9a6ea789ec26c298a504887a7";
const GUEST_KEY = "streamflix_watchlist_guest";
const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

interface WatchlistDoc {
  id: number;
  type: string;
}

interface WatchlistItem {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null;
  year: string;
  rating: number;
}

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

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "GU";
}

interface ProviderCardProps {
  id: StreamingProvider;
  label: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}

function ProviderCard({
  id,
  label,
  subtitle,
  active,
  onClick,
}: ProviderCardProps) {
  return (
    <button
      type="button"
      data-ocid={`profile.${id}.button`}
      onClick={onClick}
      className={`flex-1 min-w-[140px] flex flex-col gap-1 px-5 py-4 rounded-xl border-2 text-left transition-all ${
        active
          ? "border-[#E50914] bg-[#E50914]/10"
          : "border-[#2B2B2B] bg-[#1A1A1A] hover:border-[#3A3A3A]"
      }`}
    >
      <div className="flex items-center gap-2">
        {active && (
          <span className="w-2 h-2 rounded-full bg-[#E50914] flex-shrink-0" />
        )}
        <span
          className={`font-semibold text-sm ${active ? "text-white" : "text-[#B3B3B3]"}`}
        >
          {label}
        </span>
      </div>
      <span className="text-xs text-[#B3B3B3] leading-snug">{subtitle}</span>
    </button>
  );
}

const STAT_PILLS = [
  {
    icon: Zap,
    label: "4 Providers",
    sub: "Streaming sources",
    color: "#E50914",
  },
  {
    icon: Film,
    label: "10K+ Titles",
    sub: "Movies & TV shows",
    color: "#F5C518",
  },
  {
    icon: Smartphone,
    label: "PWA Ready",
    sub: "Install on any device",
    color: "#34D399",
  },
  {
    icon: Globe,
    label: "TMDB Powered",
    sub: "Real-time metadata",
    color: "#60A5FA",
  },
];

export default function ProfilePage() {
  const { history, removeFromHistory, clearHistory } =
    useFirestoreWatchHistory();
  const { user, signOut, setSignInModalOpen } = useAuth();
  const { toggleWatchlist } = useFirestoreWatchlist();
  const navigate = useNavigate();
  const [provider, setProvider] = useStreamingProvider();
  const { canInstall, isInstalled, install } = usePWAInstall();

  const [watchlistDocs, setWatchlistDocs] = useState<WatchlistDoc[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Load watchlist docs (id + type) from Firestore or localStorage
  useEffect(() => {
    if (user) {
      const colRef = collection(db, "users", user.uid, "watchlist");
      const unsub = onSnapshot(colRef, (snap) => {
        const docs = snap.docs.map((d) => d.data() as WatchlistDoc);
        setWatchlistDocs(docs);
      });
      return unsub;
    }
    const loadGuest = () => {
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        setWatchlistDocs(raw ? (JSON.parse(raw) as WatchlistDoc[]) : []);
      } catch {
        setWatchlistDocs([]);
      }
    };
    loadGuest();
    // Poll localStorage for guest updates (no native event for cross-component)
    const interval = setInterval(loadGuest, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch TMDB metadata for each watchlist doc
  useEffect(() => {
    if (watchlistDocs.length === 0) {
      setWatchlistItems([]);
      return;
    }
    setLoadingList(true);
    Promise.all(
      watchlistDocs.map(async (doc) => {
        const endpoint =
          doc.type === "movie"
            ? `https://api.themoviedb.org/3/movie/${doc.id}?api_key=${TMDB_KEY}`
            : `https://api.themoviedb.org/3/tv/${doc.id}?api_key=${TMDB_KEY}`;
        try {
          const res = await fetch(endpoint);
          const data = await res.json();
          const title: string = data.title ?? data.name ?? "Unknown";
          const date: string = data.release_date ?? data.first_air_date ?? "";
          return {
            id: doc.id,
            type: doc.type as "movie" | "tv",
            title,
            posterPath: data.poster_path ?? null,
            year: date ? date.slice(0, 4) : "",
            rating: data.vote_average ?? 0,
          } as WatchlistItem;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      setWatchlistItems(results.filter(Boolean) as WatchlistItem[]);
      setLoadingList(false);
    });
  }, [watchlistDocs]);

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

  function handleWatchlistCardClick(item: WatchlistItem) {
    void navigate({
      to: item.type === "movie" ? "/movie/$id" : "/tv/$id",
      params: { id: String(item.id) },
    });
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] pt-20 pb-24 px-6 md:px-14">
      <div className="max-w-[1400px] mx-auto">
        {/* Profile header */}
        <div className="flex flex-col items-center py-10 mb-10 border-b border-[#2A2A2A]">
          {user ? (
            <>
              <div className="w-24 h-24 rounded-full border-2 border-[#E50914] overflow-hidden mb-4 flex-shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? "Profile"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[#E50914] font-bold text-2xl">
                    {getInitials(user.displayName, user.email)}
                  </div>
                )}
              </div>
              <h1 className="text-white text-2xl font-bold">
                {user.displayName ?? "My Profile"}
              </h1>
              {user.email && (
                <p className="text-[#B3B3B3] text-sm mt-1">{user.email}</p>
              )}
              <button
                type="button"
                data-ocid="profile.secondary_button"
                onClick={() => void signOut()}
                className="mt-4 flex items-center gap-2 px-5 py-2 bg-[#2B2B2B] hover:bg-[#3A3A3A] text-[#B3B3B3] hover:text-white rounded-md text-sm font-medium transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
              {canInstall && (
                <button
                  type="button"
                  data-ocid="profile.install_button"
                  onClick={() => void install()}
                  className="mt-3 flex items-center gap-2 px-5 py-2 bg-[#E50914] hover:bg-[#C40812] text-white rounded-md text-sm font-semibold transition-colors"
                >
                  <Download size={15} />
                  Install App
                </button>
              )}
              {isInstalled && (
                <p className="mt-3 text-[#B3B3B3] text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  App is installed
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border-2 border-[#2B2B2B] flex items-center justify-center mb-4">
                <User size={44} className="text-[#555]" />
              </div>
              <h1 className="text-white text-2xl font-bold">Guest</h1>
              <p className="text-[#B3B3B3] text-sm mt-1">
                Sign in to sync your data across devices
              </p>
              <button
                type="button"
                data-ocid="profile.primary_button"
                onClick={() => setSignInModalOpen(true)}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-[#E50914] hover:bg-[#C40812] text-white rounded-md text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
              {canInstall && (
                <button
                  type="button"
                  data-ocid="profile.install_button"
                  onClick={() => void install()}
                  className="mt-3 flex items-center gap-2 px-5 py-2 bg-[#E50914] hover:bg-[#C40812] text-white rounded-md text-sm font-semibold transition-colors"
                >
                  <Download size={15} />
                  Install App
                </button>
              )}
              {isInstalled && (
                <p className="mt-3 text-[#B3B3B3] text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  App is installed
                </p>
              )}
            </>
          )}
        </div>

        {/* Streaming Source section */}
        <div className="mb-12 pb-10 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3 mb-2">
            <Tv2 size={22} className="text-[#E50914]" />
            <h2 className="text-white text-2xl font-bold">Streaming Source</h2>
          </div>
          <p className="text-[#B3B3B3] text-sm mb-5">
            Choose your preferred streaming provider. This setting persists
            across sessions.
          </p>
          <div
            className="flex flex-wrap gap-4"
            data-ocid="profile.streaming.panel"
          >
            <ProviderCard
              id="vidfast"
              label="Vidfast"
              subtitle="Native next episode, autoplay & subtitle support"
              active={provider === "vidfast"}
              onClick={() => setProvider("vidfast")}
            />
            <ProviderCard
              id="vidking"
              label="VidKing"
              subtitle="Reliable streaming provider"
              active={provider === "vidking"}
              onClick={() => setProvider("vidking")}
            />
            <ProviderCard
              id="videasy"
              label="Videasy"
              subtitle="Enhanced player with next episode & autoplay"
              active={provider === "videasy"}
              onClick={() => setProvider("videasy")}
            />
            <ProviderCard
              id="vidrock"
              label="VidRock"
              subtitle="Built-in episode selector, autoplay & next episode"
              active={provider === "vidrock"}
              onClick={() => setProvider("vidrock")}
            />
          </div>
          {provider === "vidfast" && (
            <p className="text-[#B3B3B3] text-xs mt-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />
              Vidfast is active — native next episode, autoplay, and subtitle
              support are enabled in the player.
            </p>
          )}
          {provider === "videasy" && (
            <p className="text-[#B3B3B3] text-xs mt-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />
              Videasy is active — next episode button, autoplay, and episode
              selector are enabled in the player.
            </p>
          )}
          {provider === "vidrock" && (
            <p className="text-[#B3B3B3] text-xs mt-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />
              VidRock is active — episode selector, autoplay, and next episode
              are handled natively in the player.
            </p>
          )}
        </div>

        {/* My List section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <List size={22} className="text-[#E50914]" />
            <h2 className="text-white text-2xl font-bold">My List</h2>
            {watchlistItems.length > 0 && (
              <span className="text-[#B3B3B3] text-sm">
                ({watchlistItems.length})
              </span>
            )}
          </div>

          {loadingList ? (
            <div
              data-ocid="profile.loading_state"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {SKELETON_KEYS.map((sk) => (
                <div
                  key={sk}
                  className="rounded-md overflow-hidden bg-[#1A1A1A] animate-pulse"
                >
                  <div className="aspect-[2/3] bg-[#2B2B2B]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#2B2B2B] rounded w-3/4" />
                    <div className="h-3 bg-[#2B2B2B] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : watchlistItems.length === 0 ? (
            <div
              data-ocid="mylist.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-6">
                <BookmarkX size={32} className="text-[#B3B3B3]" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                Your list is empty
              </h3>
              <p className="text-[#B3B3B3] text-sm max-w-sm">
                Add movies and TV shows to your list by clicking the + button on
                any title.
              </p>
              <button
                type="button"
                data-ocid="mylist.primary_button"
                onClick={() => navigate({ to: "/" })}
                className="mt-6 px-6 py-2.5 bg-[#E50914] hover:bg-[#C40812] text-white rounded-md text-sm font-semibold transition-colors"
              >
                Browse Content
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              data-ocid="mylist.list"
            >
              {watchlistItems.map((item, i) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  data-ocid={`mylist.item.${i + 1}`}
                  className="relative group/card cursor-pointer rounded-md overflow-hidden bg-[#1A1A1A] text-left w-full"
                  onClick={() => handleWatchlistCardClick(item)}
                >
                  <div className="relative aspect-[2/3] bg-[#2B2B2B]">
                    {item.posterPath ? (
                      <img
                        src={`${IMG_POSTER}${item.posterPath}`}
                        alt={item.title}
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
                      data-ocid={`mylist.delete_button.${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(item.id, item.type);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-[#E50914] text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all z-10"
                      title="Remove from My List"
                    >
                      <X size={13} />
                    </button>
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          item.type === "movie"
                            ? "bg-[#E50914] text-white"
                            : "bg-[#0072F5] text-white"
                        }`}
                      >
                        {item.type === "movie" ? "Movie" : "TV"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.year && (
                        <span className="text-[#B3B3B3] text-xs">
                          {item.year}
                        </span>
                      )}
                      {item.rating > 0 && (
                        <span className="text-[#F5C518] text-xs">
                          ★ {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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

        {/* ── About section ── */}
        <section
          data-ocid="about.section"
          className="mb-12 pb-10 border-t border-[#2A2A2A] pt-10"
          style={{ marginTop: "3rem" }}
        >
          {/* Section heading */}
          <div className="flex items-center gap-3 mb-8">
            <Info size={22} className="text-[#E50914]" />
            <h2 className="text-white text-2xl font-bold">About</h2>
          </div>

          {/* Main glassmorphism card */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(229,9,20,0.25)",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(229,9,20,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Animated glow border pulse */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(229,9,20,0.1) 0%, transparent 50%, rgba(229,9,20,0.05) 100%)",
                animation: "aboutGlowPulse 4s ease-in-out infinite",
              }}
            />

            <div className="relative z-10 p-8 md:p-10">
              {/* App identity row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
                {/* App icon / logo mark */}
                <div
                  className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #E50914 0%, #8B0000 100%)",
                    boxShadow:
                      "0 4px 24px rgba(229,9,20,0.4), 0 1px 0 rgba(255,255,255,0.15) inset",
                  }}
                >
                  <Film size={36} className="text-white" />
                </div>

                <div>
                  <h3 className="text-white text-3xl font-extrabold tracking-wide leading-tight">
                    StreamFlix
                  </h3>
                  <p
                    className="text-sm font-medium mt-1"
                    style={{
                      background: "linear-gradient(90deg, #E50914, #FF6B6B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Your universe of entertainment
                  </p>
                  <p className="text-[#B3B3B3] text-xs mt-2">
                    Version v52 · {new Date().getFullYear()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#B3B3B3] text-sm leading-relaxed mb-8 max-w-2xl">
                A modern streaming discovery platform powered by TMDB,
                delivering seamless playback across multiple providers. Browse
                thousands of movies and TV shows, build your watchlist, track
                your progress across devices, and enjoy a fully immersive
                cinematic experience — all in one place.
              </p>

              {/* Stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {STAT_PILLS.map((pill) => (
                  <div
                    key={pill.label}
                    className="flex flex-col gap-1.5 rounded-xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow:
                        "0 2px 12px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.06) inset",
                    }}
                  >
                    <pill.icon
                      size={18}
                      style={{ color: pill.color }}
                      className="flex-shrink-0"
                    />
                    <span className="text-white text-sm font-bold">
                      {pill.label}
                    </span>
                    <span className="text-[#B3B3B3] text-xs leading-snug">
                      {pill.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div
                className="w-full h-px mb-8"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(229,9,20,0.4), transparent)",
                }}
              />

              {/* Credit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-[#B3B3B3] text-xs uppercase tracking-widest mb-1">
                    Designed &amp; Developed by
                  </p>
                  <p
                    className="text-2xl font-extrabold tracking-wide"
                    style={{
                      background:
                        "linear-gradient(90deg, #FFFFFF 0%, #E50914 50%, #FF6B6B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 0 12px rgba(229,9,20,0.5))",
                    }}
                  >
                    Shadym
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[#B3B3B3] text-sm">
                  <Sparkles
                    size={15}
                    className="text-[#E50914] flex-shrink-0"
                  />
                  <span>Made with passion for cinema</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyframe injection */}
          <style>{`
            @keyframes aboutGlowPulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </section>
      </div>
    </div>
  );
}
