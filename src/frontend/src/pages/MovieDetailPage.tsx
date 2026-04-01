import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Play,
  Plus,
  RotateCcw,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import ContentRow from "../components/ContentRow";
import TrailerModal from "../components/TrailerModal";
import { useAuth } from "../contexts/AuthContext";
import { useFirestoreWatchHistory } from "../hooks/useFirestoreWatchHistory";
import { useFirestoreWatchlist } from "../hooks/useFirestoreWatchlist";
import {
  formatDate,
  formatRating,
  formatRuntime,
  truncate,
} from "../lib/helpers";
import { fetchIMDBRating } from "../lib/imdb";
import type { IMDBRating } from "../lib/imdb";
import { enterPlayerMode } from "../lib/playerUtils";
import {
  fetchMovieCredits,
  fetchMovieDetails,
  fetchMovieVideos,
  fetchSimilarMovies,
  getBackdropUrl,
  getPosterUrl,
  getProfileUrl,
} from "../lib/tmdb";
import type { CastMember, MediaItem, Movie, Video } from "../lib/types";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MovieDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history } = useFirestoreWatchHistory();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailer, setActiveTrailer] = useState<Video | null>(null);
  const [imdbRating, setImdbRating] = useState<IMDBRating | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { watchlistIds, toggleWatchlist } = useFirestoreWatchlist();

  const movieId = Number.parseInt(id, 10);
  const inWatchlist = watchlistIds.has(movieId);

  const watchEntry = history.find(
    (e) => e.id === movieId && e.type === "movie",
  );
  const hasProgress =
    !!user &&
    !!watchEntry &&
    typeof watchEntry.currentTime === "number" &&
    watchEntry.currentTime > 60;

  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setImdbRating(null);
      setIsMuted(true);
      try {
        const [m, c, v, s] = await Promise.all([
          fetchMovieDetails(movieId),
          fetchMovieCredits(movieId),
          fetchMovieVideos(movieId),
          fetchSimilarMovies(movieId),
        ]);
        if (!cancelled) {
          setMovie(m);
          setCast(c.cast.slice(0, 12));
          const trailers = v.results.filter(
            (vid) =>
              vid.site === "YouTube" &&
              (vid.type === "Trailer" || vid.type === "Teaser"),
          );
          setVideos(trailers);
          setSimilar(s.results.slice(0, 12));

          // Non-blocking IMDB fetch
          if (m.imdb_id) {
            fetchIMDBRating(m.imdb_id).then((rating) => {
              if (!cancelled) setImdbRating(rating);
            });
          }
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
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <p className="text-white">Movie not found.</p>
      </div>
    );
  }

  const trailer = videos[0] ?? null;
  const backdropUrl = getBackdropUrl(movie.backdrop_path, "original");
  const trailerSrc = trailer
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=0`
    : null;

  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      {/* Backdrop hero */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={movie.title}
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
              src={getPosterUrl(movie.poster_path, "w500")}
              alt={movie.title}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-4">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-[#E50914] text-sm italic mb-4">
                {movie.tagline}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div className="flex items-center gap-1 text-[#46D369] font-semibold">
                <Star size={16} fill="currentColor" />
                <span>{formatRating(movie.vote_average)}</span>
                <span className="text-[#555] text-sm">
                  ({movie.vote_count.toLocaleString()})
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
              {movie.release_date && (
                <span className="text-[#B3B3B3] text-sm">
                  {formatDate(movie.release_date)}
                </span>
              )}
              {movie.runtime ? (
                <div className="flex items-center gap-1 text-[#B3B3B3] text-sm">
                  <Clock size={14} />
                  <span>{formatRuntime(movie.runtime)}</span>
                </div>
              ) : null}
              {movie.status && (
                <span className="bg-[#2B2B2B] text-[#B3B3B3] text-xs px-2 py-1 rounded">
                  {movie.status}
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {movie.genres.map((g) => (
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
              {movie.overview}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {hasProgress ? (
                <>
                  {/* Resume button */}
                  <button
                    type="button"
                    data-ocid="movie.primary_button"
                    onClick={async () => {
                      await enterPlayerMode();
                      navigate({ to: "/watch/movie/$id", params: { id } });
                    }}
                    className="flex flex-col items-center justify-center bg-white text-black font-bold px-6 py-2.5 rounded-lg hover:bg-[#e0e0e0] transition-colors text-sm min-w-[120px]"
                  >
                    <span className="flex items-center gap-2">
                      <Play size={16} fill="currentColor" />
                      Resume
                    </span>
                    <span className="text-[10px] font-normal text-black/60 mt-0.5">
                      from {formatTime(watchEntry!.currentTime!)}
                    </span>
                  </button>

                  {/* Play from Beginning button */}
                  <button
                    type="button"
                    data-ocid="movie.secondary_button"
                    onClick={async () => {
                      await enterPlayerMode();
                      navigate({ to: "/watch/movie/$id", params: { id } });
                    }}
                    className="flex items-center gap-2 bg-[#2B2B2B] hover:bg-[#3A3A3A] text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm border border-[#3A3A3A]"
                  >
                    <RotateCcw size={16} />
                    Play from Beginning
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  data-ocid="movie.primary_button"
                  onClick={async () => {
                    await enterPlayerMode();
                    navigate({ to: "/watch/movie/$id", params: { id } });
                  }}
                  className="flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e0e0e0] transition-colors text-sm"
                >
                  <Play size={18} fill="currentColor" />
                  Play
                </button>
              )}
              {trailer && (
                <button
                  type="button"
                  data-ocid="movie.toggle"
                  onClick={() => setActiveTrailer(trailer)}
                  className="flex items-center gap-2 bg-[#2B2B2B] hover:bg-[#3A3A3A] text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm border border-[#3A3A3A]"
                >
                  <Play size={18} fill="currentColor" />
                  Trailer
                </button>
              )}
              <button
                type="button"
                data-ocid="movie.toggle"
                onClick={() => toggleWatchlist(movieId, "movie")}
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
                <button
                  type="button"
                  key={member.id}
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity w-full"
                  onClick={() =>
                    navigate({
                      to: "/person/$personId",
                      params: { personId: String(member.id) },
                    })
                  }
                >
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
                  <p className="text-[#555] text-[10px] truncate">
                    {truncate(member.character, 20)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* More trailers */}
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
