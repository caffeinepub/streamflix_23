import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMovieDetails } from "../lib/tmdb";
import type { Movie } from "../lib/types";

export default function WatchMoviePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  const movieId = Number.parseInt(id, 10);

  useEffect(() => {
    if (!movieId) return;
    let cancelled = false;
    fetchMovieDetails(movieId)
      .then((m) => {
        if (!cancelled) setMovie(m);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <button
          type="button"
          data-ocid="watch.back.button"
          onClick={() => navigate({ to: "/movie/$id", params: { id } })}
          className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex-1">
          {loading ? (
            <div className="h-5 w-48 bg-[#2B2B2B] rounded animate-pulse" />
          ) : (
            <h1 className="text-white font-bold text-base md:text-lg truncate">
              {movie?.title ?? "Movie"}
            </h1>
          )}
        </div>
      </div>

      {/* Player */}
      <div
        className="flex-1 flex items-center justify-center bg-black p-0"
        data-ocid="watch.canvas_target"
      >
        <iframe
          src={`https://www.vidking.net/embed/movie/${movieId}`}
          title={movie?.title ?? "Movie Player"}
          width="100%"
          style={{
            height: "80vh",
            border: "none",
            borderRadius: "8px",
            display: "block",
          }}
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}
