import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ListVideo, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";
import { useStreamingProvider } from "../hooks/useStreamingProvider";
import { enterPlayerMode, exitPlayerMode } from "../lib/playerUtils";
import { fetchTVDetails, fetchTVSeasonDetails } from "../lib/tmdb";
import type { TVShow } from "../lib/types";

export default function WatchTVPage() {
  const params = useParams({ strict: false }) as {
    id: string;
    season: string;
    episode: string;
  };
  const { id, season, episode } = params;
  const navigate = useNavigate();
  const { addToHistory } = useFirestoreWatchHistory();
  const [provider] = useStreamingProvider();

  const showId = Number.parseInt(id, 10);
  const seasonNum = Number.parseInt(season, 10);
  const episodeNum = Number.parseInt(episode, 10);

  const [show, setShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodeCount, setEpisodeCount] = useState<number>(20);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Videasy-only state
  const [autoplay, setAutoplay] = useState(true);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable refs so countdown effect doesn't need them as deps
  const seasonNumRef = useRef(seasonNum);
  const episodeNumRef = useRef(episodeNum);
  const episodeCountRef = useRef(episodeCount);
  const numSeasonsRef = useRef(show?.number_of_seasons ?? 1);
  seasonNumRef.current = seasonNum;
  episodeNumRef.current = episodeNum;
  episodeCountRef.current = episodeCount;
  numSeasonsRef.current = show?.number_of_seasons ?? 1;

  const stableAdd = useCallback(addToHistory, []);

  const numSeasons = show?.number_of_seasons ?? 1;
  const isLastEpisode = episodeNum >= episodeCount;
  const isLastSeasonLastEpisode = isLastEpisode && seasonNum >= numSeasons;

  const resetTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    setCountdownActive(false);
    setCountdown(10);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const handleUserInteraction = useCallback(() => {
    resetTimer();
    setCountdownActive((active) => {
      if (active) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }
        setCountdown(10);
        if (idleTimer.current) clearTimeout(idleTimer.current);
        return false;
      }
      return active;
    });
  }, [resetTimer]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetTimer]);

  // Start idle timer when autoplay is on (videasy)
  useEffect(() => {
    if (provider !== "videasy" || !autoplay || isLastSeasonLastEpisode) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setCountdownActive(true);
      setCountdown(10);
    }, 30000);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [provider, autoplay, isLastSeasonLastEpisode]);

  useEffect(() => {
    void enterPlayerMode();
    return () => {
      void exitPlayerMode();
    };
  }, []);

  // Countdown interval
  useEffect(() => {
    if (!countdownActive) return;
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current!);
          countdownTimer.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [countdownActive]);

  // When countdown hits 0, navigate to next episode
  useEffect(() => {
    if (countdown !== 0 || !countdownActive) return;
    setCountdownActive(false);
    setCountdown(10);
    const sNum = seasonNumRef.current;
    const eNum = episodeNumRef.current;
    const eCount = episodeCountRef.current;
    const nSeasons = numSeasonsRef.current;
    const lastEp = eNum >= eCount;
    const lastAll = lastEp && sNum >= nSeasons;
    if (!lastAll) {
      void navigate({
        to: "/watch/tv/$id/$season/$episode",
        params: {
          id,
          season: String(lastEp ? sNum + 1 : sNum),
          episode: String(lastEp ? 1 : eNum + 1),
        },
      });
    }
  }, [countdown, countdownActive, id, navigate]);

  useEffect(() => {
    if (!showId) return;
    let cancelled = false;
    fetchTVDetails(showId)
      .then((s) => {
        if (!cancelled) setShow(s);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showId]);

  useEffect(() => {
    if (!show) return;
    stableAdd({
      id: show.id,
      type: "tv",
      title: show.name,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      timestamp: Date.now(),
      season: seasonNum,
      episode: episodeNum,
    });
  }, [show, seasonNum, episodeNum, stableAdd]);

  useEffect(() => {
    if (!showId || !seasonNum) return;
    let cancelled = false;
    fetchTVSeasonDetails(showId, seasonNum)
      .then((s) => {
        if (!cancelled) setEpisodeCount(s.episodes.length || 20);
      })
      .catch(() => {
        if (!cancelled) setEpisodeCount(20);
      });
    return () => {
      cancelled = true;
    };
  }, [showId, seasonNum]);

  function goTo(s: number, e: number) {
    cancelCountdown();
    void navigate({
      to: "/watch/tv/$id/$season/$episode",
      params: { id, season: String(s), episode: String(e) },
    });
  }

  function handleNextEpisode() {
    if (isLastSeasonLastEpisode) return;
    if (isLastEpisode) {
      goTo(seasonNum + 1, 1);
    } else {
      goTo(seasonNum, episodeNum + 1);
    }
  }

  const iframeSrc =
    provider === "videasy"
      ? `https://player.videasy.net/tv/${showId}/${seasonNum}/${episodeNum}`
      : `https://www.vidking.net/embed/tv/${showId}/${seasonNum}/${episodeNum}`;

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
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onClick={handleUserInteraction}
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
              navigate({ to: "/tv/$id", params: { id } });
            }}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={22} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-4 w-52 bg-white/20 rounded animate-pulse" />
            ) : (
              <h1 className="text-white font-bold text-sm md:text-base truncate drop-shadow">
                {show?.name ?? "TV Show"}
                <span className="text-white/60 font-normal ml-2 text-xs">
                  S{String(seasonNum).padStart(2, "0")} E
                  {String(episodeNum).padStart(2, "0")}
                </span>
              </h1>
            )}
          </div>

          {/* Videasy autoplay toggle in header */}
          {provider === "videasy" && (
            <div className="flex items-center gap-2 mr-1">
              <span className="text-white/60 text-xs hidden sm:inline">
                Autoplay
              </span>
              <button
                type="button"
                data-ocid="watch.toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoplay((v) => !v);
                  if (countdownActive) cancelCountdown();
                }}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  autoplay ? "bg-[#E50914]" : "bg-white/20"
                }`}
                aria-label="Toggle autoplay"
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    autoplay ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Episode selector toggle */}
          <button
            type="button"
            data-ocid="watch.toggle"
            onClick={(e) => {
              e.stopPropagation();
              setSelectorOpen((v) => !v);
            }}
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors bg-black/40 rounded-lg px-3 py-1.5"
          >
            <ListVideo size={18} />
            <span className="text-xs font-medium hidden sm:inline">
              Episodes
            </span>
          </button>
        </div>
      </div>

      {/* Fullscreen iframe */}
      <iframe
        src={iframeSrc}
        title={`${show?.name ?? "Show"} S${seasonNum}E${episodeNum}`}
        data-ocid="watch.canvas_target"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          flex: 1,
        }}
        allowFullScreen
        allow="autoplay; fullscreen"
      />

      {/* Videasy: Next Episode button */}
      {provider === "videasy" && !isLastSeasonLastEpisode && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "24px",
            zIndex: 15,
            opacity: controlsVisible ? 1 : 0,
            transition: "opacity 0.4s",
            pointerEvents: controlsVisible ? "auto" : "none",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <button
            type="button"
            data-ocid="watch.primary_button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextEpisode();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/60 text-white rounded-lg text-sm font-medium backdrop-blur-sm transition-all"
          >
            <SkipForward size={18} />
            Next Episode
          </button>
        </div>
      )}

      {/* Videasy: Autoplay countdown overlay */}
      {provider === "videasy" &&
        countdownActive &&
        !isLastSeasonLastEpisode && (
          <div
            style={{
              position: "absolute",
              bottom: "130px",
              right: "24px",
              zIndex: 16,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex flex-col items-end gap-2 bg-black/70 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Up Next
              </p>
              <p className="text-white text-sm font-semibold">
                {isLastEpisode
                  ? `Season ${seasonNum + 1}, Episode 1`
                  : `Episode ${episodeNum + 1}`}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  data-ocid="watch.cancel_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelCountdown();
                  }}
                  className="text-white/60 hover:text-white text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="watch.primary_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextEpisode();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#E50914] hover:bg-[#C40812] text-white rounded-md text-xs font-semibold transition-colors"
                >
                  <SkipForward size={14} />
                  Play ({countdown}s)
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Season/Episode Selector overlay */}
      {selectorOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            background: "rgba(11,11,11,0.92)",
            backdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
          }}
        >
          <div className="flex flex-wrap items-center gap-4 px-4 py-4">
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
              Navigate
            </span>

            <div className="flex items-center gap-2">
              <label className="text-white/60 text-xs" htmlFor="season-select">
                Season
              </label>
              <Select
                value={String(seasonNum)}
                onValueChange={(val) => {
                  goTo(Number(val), 1);
                  setSelectorOpen(false);
                }}
              >
                <SelectTrigger
                  id="season-select"
                  className="w-28 bg-[#2B2B2B] border-[#3A3A3A] text-white text-sm h-8"
                  data-ocid="watch.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#3A3A3A]">
                  {Array.from({ length: numSeasons }, (_, i) => i + 1).map(
                    (s) => (
                      <SelectItem
                        key={s}
                        value={String(s)}
                        className="text-white hover:bg-[#2B2B2B]"
                      >
                        Season {s}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-white/60 text-xs" htmlFor="episode-select">
                Episode
              </label>
              <Select
                value={String(episodeNum)}
                onValueChange={(val) => {
                  goTo(seasonNum, Number(val));
                  setSelectorOpen(false);
                }}
              >
                <SelectTrigger
                  id="episode-select"
                  className="w-28 bg-[#2B2B2B] border-[#3A3A3A] text-white text-sm h-8"
                  data-ocid="watch.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#3A3A3A]">
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map(
                    (e) => (
                      <SelectItem
                        key={e}
                        value={String(e)}
                        className="text-white hover:bg-[#2B2B2B]"
                      >
                        Episode {e}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectorOpen(false);
              }}
              className="ml-auto text-white/50 hover:text-white text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
