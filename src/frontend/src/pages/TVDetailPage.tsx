import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Play, Plus, Star, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { ItemType } from "../backend";
import ContentRow from "../components/ContentRow";
import TrailerModal from "../components/TrailerModal";
import { useActor } from "../hooks/useActor";
import { formatDate, formatRating, truncate } from "../lib/helpers";
import { enterPlayerMode } from "../lib/playerUtils";
import {
  fetchSimilarTV,
  fetchTVCredits,
  fetchTVDetails,
  fetchTVVideos,
  getBackdropUrl,
  getPosterUrl,
  getProfileUrl,
} from "../lib/tmdb";
import type { CastMember, MediaItem, TVShow, Video } from "../lib/types";

export default function TVDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [show, setShow] = useState<TVShow | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [similar, setSimilar] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailer, setActiveTrailer] = useState<Video | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const { actor } = useActor();

  const showId = Number.parseInt(id, 10);

  useEffect(() => {
    if (!showId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
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
    if (!actor || !showId) return;
    void actor.getWatchlist().then((list) => {
      setInWatchlist(list.some((i) => Number(i.id) === showId));
    });
  }, [actor, showId]);

  async function toggleWatchlist() {
    if (!actor) return;
    await actor.toggleItem(BigInt(showId), ItemType.tv);
    const list = await actor.getWatchlist();
    setInWatchlist(list.some((i) => Number(i.id) === showId));
  }

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

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-1 text-[#46D369] font-semibold">
                <Star size={16} fill="currentColor" />
                <span>{formatRating(show.vote_average)}</span>
                <span className="text-[#555] text-sm">
                  ({show.vote_count.toLocaleString()})
                </span>
              </div>
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

            {/* Genres */}
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

            {/* Overview */}
            <p className="text-[#B3B3B3] text-sm md:text-base leading-relaxed mb-6">
              {show.overview}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-ocid="tv.primary_button"
                onClick={async () => {
                  await enterPlayerMode();
                  navigate({
                    to: "/watch/tv/$id/$season/$episode",
                    params: { id, season: "1", episode: "1" },
                  });
                }}
                className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e0e0e0] transition-colors text-sm"
              >
                <Play size={18} fill="currentColor" />
                Play
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
                onClick={toggleWatchlist}
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

      {/* Trailer modal */}
      {activeTrailer && (
        <TrailerModal
          video={activeTrailer}
          onClose={() => setActiveTrailer(null)}
        />
      )}
    </div>
  );
}
