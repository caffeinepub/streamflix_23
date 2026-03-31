import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ListVideo } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";
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

  const showId = Number.parseInt(id, 10);
  const seasonNum = Number.parseInt(season, 10);
  const episodeNum = Number.parseInt(episode, 10);

  const [show, setShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodeCount, setEpisodeCount] = useState<number>(20);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const numSeasons = show?.number_of_seasons ?? 1;

  function goTo(s: number, e: number) {
    void navigate({
      to: "/watch/tv/$id/$season/$episode",
      params: { id, season: String(s), episode: String(e) },
    });
  }

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
          {/* Episode selector toggle */}
          <button
            type="button"
            data-ocid="watch.toggle"
            onClick={() => setSelectorOpen((v) => !v)}
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
        src={`https://www.vidking.net/embed/tv/${showId}/${seasonNum}/${episodeNum}`}
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
              onClick={() => setSelectorOpen(false)}
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
