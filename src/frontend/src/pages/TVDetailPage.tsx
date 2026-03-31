import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Play,
  Plus,
  Star,
  Tv,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import ContentRow from "../components/ContentRow";
import TrailerModal from "../components/TrailerModal";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import { formatDate, formatRating, truncate } from "../lib/helpers";
import { fetchIMDBRating } from "../lib/imdb";
import type { IMDBRating } from "../lib/imdb";
import { enterPlayerMode } from "../lib/playerUtils";
import {
  fetchSimilarTV,
  fetchTVCredits,
  fetchTVDetails,
  fetchTVExternalIds,
  fetchTVSeasonDetails,
  fetchTVVideos,
  getBackdropUrl,
  getPosterUrl,
  getProfileUrl,
  getStillUrl,
} from "../lib/tmdb";
import type {
  CastMember,
  Episode,
  MediaItem,
  TVShow,
  Video,
} from "../lib/types";

export default function TVDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [show, setShow] = useState<TVShow | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [similar, setSimilar] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailer, setActiveTrailer] = useState<Video | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [imdbRating, setImdbRating] = useState<IMDBRating | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { watchlistIds, toggleWatchlist } = useFirestoreWatchlist();
  const { history } = useFirestoreWatchHistory();

  const showId = Number.parseInt(id, 10);
  const inWatchlist = watchlistIds.has(showId);
  const lastWatched = history.find((e) => e.type === "tv" && e.id === showId);

  useEffect(() => {
    if (lastWatched?.season) {
      setSelectedSeason(lastWatched.season);
    }
  }, [lastWatched?.season]);

  useEffect(() => {
    if (!showId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setImdbRating(null);
      setIsMuted(true);
      try {
        const [s, c, v, sim] = await Promise.all([
          fetchTVDetails(showId),
          fetchTVCredits(showId),
          fetchTVVideos(showId),
          fetchSimilarTV(showId),
        ]);
        if (!cancelled) {
          setShow(s);
          const castWithChar = c.cast.slice(0, 12).map((m) => ({
            ...m,
            character: m.character ?? "",
          }));
          setCast(castWithChar);
          const trailers = v.results.filter(
            (vid) =>
              vid.site === "YouTube" &&
              (vid.type === "Trailer" || vid.type === "Teaser"),
          );
          setVideos(trailers);
          setSimilar(sim.results.slice(0, 12));

          // Non-blocking IMDB fetch (chained: external IDs -> IMDB rating)
          fetchTVExternalIds(showId)
            .then((ext) => {
              if (!cancelled && ext.imdb_id) {
                return fetchIMDBRating(ext.imdb_id);
              }
              return null;
            })
            .then((rating) => {
              if (!cancelled) setImdbRating(rating);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showId]);

  useEffect(() => {
    if (!showId) return;
    let cancelled = false;
    const load = async () => {
      setEpisodesLoading(true);
      try {
        const data = await fetchTVSeasonDetails(showId, selectedSeason);
        if (!cancelled) setEpisodes(data.episodes ?? []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setEpisodes([]);
      } finally {
        if (!cancelled) setEpisodesLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [showId, selectedSeason]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <p className="text-white">Show not found.</p>
      </div>
    );
  }

  const trailer = videos[0] ?? null;
  const backdropUrl = getBackdropUrl(show.backdrop_path, "original");
  const numSeasons = show.number_of_seasons ?? 1;
  const trailerSrc = trailer
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=0`
    : null;

  const handlePlay = async () => {
    await enterPlayerMode();
    const season = lastWatched?.season ?? 1;
    const episode = lastWatched?.episode ?? 1;
    navigate({
      to: "/watch/tv/$id/$season/$episode",
      params: { id, season: String(season), episode: String(episode) },
    });
  };

  const handleEpisodeClick = async (epNum: number) => {
    await enterPlayerMode();
    navigate({
      to: "/watch/tv/$id/$season/$episode",
      params: { id, season: String(selectedSeason), episode: String(epNum) },
    });
  };

  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      {/* Backdrop hero */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={show.name}
            className="w-full h-full object-cover object-top"
          />
        )}
        {trailerSrc && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <iframe
              key={`${trailer!.key}-${isMuted ? 1 : 0}`}
              src={trailerSrc}
              allow="autoplay"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "177.78vh",
                height: "56.25vw",
                minWidth: "100%",
                minHeight: "100%",
                border: "none",
              }}
              title="trailer"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0B0B44] to-[#0B0B0B]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] to-transparent" />
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="absolute top-20 left-6 md:left-14 flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        {trailer && (
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="absolute bottom-6 right-6 md:right-14 w-9 h-9 rounded-full bg-[#1a1a1acc] border border-[#555] flex items-center justify-center text-white hover:bg-[#2a2a2a] transition-colors backdrop-blur-sm"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-14 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0 w-40 md:w-56 self-start">
            <img
              src={getPosterUrl(show.poster_path, "w500")}
              alt={show.name}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-4">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
              {show.name}
            </h1>
            {show.tagline && (
              <p className="text-[#E50914] text-sm italic mb-4">
                {show.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-1 text-[#46D369] font-semibold">
                <Star size={16} fill="currentColor" />
                <span>{formatRating(show.vote_average)}</span>
                <span className="text-[#555] text-sm">
                  ({show.vote_count.toLocaleString()})
                </span>
              </div>
              {imdbRating && (
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="bg-[#F5C518] text-black font-black text-[10px] px-1.5 py-0.5 rounded leading-none">
                    IMDb
                  </span>
                  <Star size={14} fill="#F5C518" className="text-[#F5C518]" />
                  <span className="text-white text-sm">
                    {imdbRating.value.toFixed(1)}
                  </span>
                  <span className="text-[#555] text-xs">
                    ({imdbRating.voteCount.toLocaleString()})
                  </span>
                </div>
              )}
              {show.first_air_date && (
                <span className="text-[#B3B3B3] text-sm">
                  {formatDate(show.first_air_date)}
                </span>
              )}
              {show.number_of_seasons ? (
                <div className="flex items-center gap-1 text-[#B3B3B3] text-sm">
                  <Tv size={14} />
                  <span>
                    {show.number_of_seasons} Season
                    {show.number_of_seasons !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : null}
              {show.status && (
                <span className="bg-[#2B2B2B] text-[#B3B3B3] text-xs px-2 py-1 rounded">
                  {show.status}
                </span>
              )}
            </div>

            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="bg-[#2B2B2B] text-[#B3B3B3] text-xs px-3 py-1 rounded-full border border-[#3A3A3A]"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[#B3B3B3] text-sm md:text-base leading-relaxed mb-6">
              {show.overview}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-ocid="tv.primary_button"
                onClick={handlePlay}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e0e0e0] transition-colors text-sm"
              >
                <Play size={18} fill="currentColor" />
                {lastWatched ? "Resume" : "Play"}
              </button>
              {trailer && (
                <button
                  type="button"
                  data-ocid="tv.secondary_button"
                  onClick={() => setActiveTrailer(trailer)}
                  className="flex items-center gap-2 bg-[#2B2B2B] hover:bg-[#3A3A3A] text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm border border-[#3A3A3A]"
                >
                  <Play size={18} fill="currentColor" />
                  Trailer
                </button>
              )}
              <button
                type="button"
                data-ocid="tv.toggle"
                onClick={() => toggleWatchlist(showId, "tv")}
                className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors text-sm border ${
                  inWatchlist
                    ? "bg-[#46D369] text-black border-[#46D369]"
                    : "bg-[#2B2B2B] text-white border-[#3A3A3A] hover:bg-[#3A3A3A]"
                }`}
              >
                {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
                {inWatchlist ? "In My List" : "My List"}
              </button>
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className="mt-12" data-ocid="tv.panel">
          <h2 className="text-white font-bold text-xl mb-5">Episodes</h2>

          {/* Season tabs */}
          <div
            className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-[#2B2B2B]"
            style={{ scrollbarWidth: "none" }}
          >
            {Array.from({ length: numSeasons }, (_, i) => i + 1).map((s) => (
              <button
                type="button"
                key={s}
                data-ocid="tv.tab"
                onClick={() => setSelectedSeason(s)}
                className={`shrink-0 px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  selectedSeason === s
                    ? "text-white border-white"
                    : "text-[#777] border-transparent hover:text-[#B3B3B3]"
                }`}
              >
                Season {s}
              </button>
            ))}
          </div>

          {/* Episode list */}
          {episodesLoading ? (
            <div className="space-y-3" data-ocid="tv.loading_state">
              {["s1", "s2", "s3", "s4", "s5"].map((sk) => (
                <div
                  key={sk}
                  className="flex gap-4 bg-[#1A1A1A] rounded-lg p-3 animate-pulse"
                >
                  <div className="shrink-0 w-[160px] aspect-video rounded-md bg-[#2B2B2B]" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-[#2B2B2B] rounded w-3/4" />
                    <div className="h-3 bg-[#2B2B2B] rounded w-full" />
                    <div className="h-3 bg-[#2B2B2B] rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {episodes.map((ep, idx) => {
                const isLastWatched =
                  lastWatched?.season === selectedSeason &&
                  lastWatched?.episode === ep.episode_number;
                const stillUrl = getStillUrl(ep.still_path, "w300");

                const progressState =
                  lastWatched?.season === selectedSeason
                    ? ep.episode_number < (lastWatched?.episode ?? 0)
                      ? "watched"
                      : ep.episode_number === lastWatched?.episode
                        ? "inProgress"
                        : "unwatched"
                    : "unwatched";

                return (
                  <button
                    type="button"
                    key={ep.id}
                    data-ocid={`tv.item.${idx + 1}`}
                    onClick={() => handleEpisodeClick(ep.episode_number)}
                    className={`w-full flex gap-4 rounded-lg p-3 text-left transition-colors group ${
                      isLastWatched
                        ? "bg-[#1F1010] border-l-4 border-[#E50914] hover:bg-[#2B1515]"
                        : "bg-[#1A1A1A] border-l-4 border-transparent hover:bg-[#2B2B2B]"
                    }`}
                  >
                    <div className="shrink-0 w-[120px] md:w-[160px] aspect-video rounded-md overflow-hidden bg-[#2B2B2B] relative">
                      {stillUrl ? (
                        <img
                          src={stillUrl}
                          alt={ep.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play size={28} className="text-[#555]" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <Play size={18} fill="white" className="text-white" />
                        </div>
                      </div>
                      {progressState !== "unwatched" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                          <div
                            className={`h-full rounded-sm ${
                              progressState === "inProgress"
                                ? "bg-[#E50914]"
                                : "bg-[#6B6B6B]"
                            }`}
                            style={{
                              width:
                                progressState === "inProgress" ? "65%" : "100%",
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-white font-bold text-sm leading-snug">
                          E{ep.episode_number} — {ep.name}
                        </span>
                        {ep.runtime ? (
                          <span className="shrink-0 text-[#777] text-xs mt-0.5">
                            {ep.runtime}m
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[#777] text-xs leading-relaxed line-clamp-3">
                        {ep.overview || "No description available."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white font-bold text-xl mb-5">Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {cast.map((member) => (
                <div key={member.id} className="text-center">
                  <div
                    className="w-full aspect-square rounded-full overflow-hidden bg-[#2B2B2B] mb-2 mx-auto"
                    style={{ maxWidth: "80px" }}
                  >
                    {member.profile_path ? (
                      <img
                        src={getProfileUrl(member.profile_path)}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">
                        {member.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium truncate">
                    {member.name}
                  </p>
                  {member.character && (
                    <p className="text-[#555] text-[10px] truncate">
                      {truncate(member.character, 20)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trailers */}
        {videos.length > 1 && (
          <div className="mt-12">
            <h2 className="text-white font-bold text-xl mb-5">
              Trailers &amp; Videos
            </h2>
            <div
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              {videos.slice(0, 6).map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setActiveTrailer(v)}
                  className="shrink-0 w-56 text-left group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1A1A1A] mb-2">
                    <img
                      src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                      alt={v.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 rounded-full p-3">
                        <Play size={20} fill="white" className="text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[#B3B3B3] text-xs truncate">{v.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-12">
            <ContentRow title="More Like This" items={similar as MediaItem[]} />
          </div>
        )}
      </div>

      {activeTrailer && (
        <TrailerModal
          video={activeTrailer}
          onClose={() => setActiveTrailer(null)}
        />
      )}
    </div>
  );
}
