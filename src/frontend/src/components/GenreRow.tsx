import { useEffect, useRef, useState } from "react";
import { fetchMoviesByGenre, fetchTVByGenre } from "../lib/tmdb";
import type { MediaItem, Movie, TVShow } from "../lib/types";
import ContentRow from "./ContentRow";

interface GenreRowProps {
  title: string;
  genreId: number;
  mediaType: "movie" | "tv";
  watchlistIds?: Set<number>;
  onToggleWatchlist?: (item: MediaItem) => void;
  onViewAll?: () => void;
}

export default function GenreRow({
  title,
  genreId,
  mediaType,
  watchlistIds,
  onToggleWatchlist,
  onViewAll,
}: GenreRowProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loaded) {
          observer.disconnect();
          setLoading(true);
          const fetch = async () => {
            try {
              if (mediaType === "movie") {
                const res = await fetchMoviesByGenre(genreId);
                setItems((res.results as Movie[]).slice(0, 20) as MediaItem[]);
              } else {
                const res = await fetchTVByGenre(genreId);
                setItems((res.results as TVShow[]).slice(0, 20) as MediaItem[]);
              }
            } catch (err) {
              console.error(`Failed to load genre row "${title}":`, err);
            } finally {
              setLoading(false);
              setLoaded(true);
            }
          };
          void fetch();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [genreId, mediaType, loaded, title]);

  return (
    <div ref={containerRef}>
      <ContentRow
        title={title}
        items={items}
        loading={loading || (!loaded && items.length === 0)}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onViewAll={onViewAll}
      />
    </div>
  );
}
