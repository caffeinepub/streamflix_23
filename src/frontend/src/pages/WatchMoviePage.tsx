import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";
import { useStreamingProvider } from "../hooks/useStreamingProvider";
import { enterPlayerMode, exitPlayerMode } from "../lib/playerUtils";
import { fetchMovieDetails } from "../lib/tmdb";
import type { Movie } from "../lib/types";

const VIDFAST_ORIGINS = [
  "https://vidfast.pro",
  "https://vidfast.in",
  "https://vidfast.io",
  "https://vidfast.me",
  "https://vidfast.net",
  "https://vidfast.pm",
  "https://vidfast.xyz",
];

export default function WatchMoviePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const { addToHistory } = useFirestoreWatchHistory();
  const [provider] = useStreamingProvider();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const movieId = Number.parseInt(id, 10);

  const stableAdd = useCallback(addToHistory, []);

  const resetTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetTimer]);

  useEffect(() => {
    void enterPlayerMode();
    return () => {
      void exitPlayerMode();
    };
  }, []);

  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    fetchMovieDetails(movieId)
      .then((m) => {
        if (!cancelled) {
          setMovie(m);
          stableAdd({
            id: m.id,
            type: "movie",
            title: m.title,
            posterPath: m.poster_path,
            backdropPath: m.backdrop_path,
            timestamp: Date.now(),
          });
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId, stableAdd]);

  // VidRock postMessage listener for Continue Watching
  useEffect(() => {
    if (provider !== "vidrock") return;
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://vidrock.net") return;
      const data = event.data;
      if (data?.type === "PLAYER_EVENT") {
        const { event: eventType } = data.data ?? {};
        if (eventType === "timeupdate" || eventType === "ended") {
          if (movie) {
            stableAdd({
              id: movie.id,
              type: "movie",
              title: movie.title,
              posterPath: movie.poster_path,
              backdropPath: movie.backdrop_path,
              timestamp: Date.now(),
            });
          }
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [provider, movie, stableAdd]);

  // Vidfast postMessage listener for Continue Watching
  useEffect(() => {
    if (provider !== "vidfast") return;
    function handleMessage(event: MessageEvent) {
      if (!VIDFAST_ORIGINS.includes(event.origin)) return;
      const data = event.data;
      if (data?.type === "PLAYER_EVENT") {
        const { event: eventType } = data.data ?? {};
        if (eventType === "timeupdate" || eventType === "ended") {
          if (movie) {
            stableAdd({
              id: movie.id,
              type: "movie",
              title: movie.title,
              posterPath: movie.poster_path,
              backdropPath: movie.backdrop_path,
              timestamp: Date.now(),
            });
          }
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [provider, movie, stableAdd]);

  const iframeSrc =
    provider === "videasy"
      ? `https://player.videasy.net/movie/${movieId}`
      : provider === "vidrock"
        ? `https://vidrock.net/movie/${movieId}?autoplay=true&download=false&lang=en`
        : provider === "vidfast"
          ? `https://vidfast.pro/movie/${movieId}?autoPlay=true&title=true&fullscreenButton=true&sub=en&poster=true`
          : `https://www.vidking.net/embed/movie/${movieId}`;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: click is for activity detection only
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
      onMouseMove={resetTimer}
      onTouchStart={resetTimer}
      onClick={resetTimer}
    >
      {/* Overlay header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.4s",
          pointerEvents: controlsVisible ? "auto" : "none",
        }}
      >
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            type="button"
            data-ocid="watch.back.button"
            onClick={async () => {
              await exitPlayerMode();
              navigate({ to: "/movie/$id", params: { id } });
            }}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={22} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-4 w-40 bg-white/20 rounded animate-pulse" />
            ) : (
              <h1 className="text-white font-bold text-sm md:text-base truncate drop-shadow">
                {movie?.title ?? "Movie"}
              </h1>
            )}
          </div>
          {provider === "videasy" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
              Videasy
            </span>
          )}
          {provider === "vidrock" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
              VidRock
            </span>
          )}
          {provider === "vidfast" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
              Vidfast
            </span>
          )}
        </div>
      </div>

      {/* Fullscreen iframe */}
      <iframe
        src={iframeSrc}
        title={movie?.title ?? "Movie Player"}
        data-ocid="watch.canvas_target"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          flex: 1,
        }}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
      />
    </div>
  );
}
