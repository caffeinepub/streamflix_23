import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useWatchHistory } from "../hooks/useWatchHistory";
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
  const { addToHistory } = useWatchHistory();

  const showId = Number.parseInt(id, 10);
  const seasonNum = Number.parseInt(season, 10);
  const episodeNum = Number.parseInt(episode, 10);

  const [show, setShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodeCount, setEpisodeCount] = useState<number>(20);

  const stableAdd = useCallback(addToHistory, []);

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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <button
          type="button"
          data-ocid="watch.back.button"
          onClick={async () => {
            await exitPlayerMode();
            navigate({ to: "/tv/$id", params: { id } });
          }}
          className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex-1">
          {loading ? (
            <div className="h-5 w-64 bg-[#2B2B2B] rounded animate-pulse" />
          ) : (
            <h1 className="text-white font-bold text-base md:text-lg truncate">
              {show?.name ?? "TV Show"}
              <span className="text-[#B3B3B3] font-normal ml-2">
                S{String(seasonNum).padStart(2, "0")} E
                {String(episodeNum).padStart(2, "0")}
              </span>
            </h1>
          )}
        </div>
      </div>

      {/* Player */}
      <div
        className="flex-1 bg-black"
        style={{ minHeight: 0 }}
        data-ocid="watch.canvas_target"
      >
        <iframe
          src={`https://www.vidking.net/embed/tv/${showId}/${seasonNum}/${episodeNum}`}
          title={`${show?.name ?? "Show"} S${seasonNum}E${episodeNum}`}
          width="100%"
          style={{ height: "80vh", border: "none", display: "block" }}
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      </div>

      {/* Season/Episode Selector */}
      <div className="bg-[#0B0B0B] border-t border-white/10 px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-4">
          <span className="text-[#B3B3B3] text-sm font-medium">Navigate:</span>

          <div className="flex items-center gap-2">
            <label className="text-[#B3B3B3] text-sm" htmlFor="season-select">
              Season
            </label>
            <Select
              value={String(seasonNum)}
              onValueChange={(val) => goTo(Number(val), 1)}
            >
              <SelectTrigger
                id="season-select"
                className="w-28 bg-[#2B2B2B] border-[#3A3A3A] text-white"
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
            <label className="text-[#B3B3B3] text-sm" htmlFor="episode-select">
              Episode
            </label>
            <Select
              value={String(episodeNum)}
              onValueChange={(val) => goTo(seasonNum, Number(val))}
            >
              <SelectTrigger
                id="episode-select"
                className="w-28 bg-[#2B2B2B] border-[#3A3A3A] text-white"
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
        </div>
      </div>
    </div>
  );
}
