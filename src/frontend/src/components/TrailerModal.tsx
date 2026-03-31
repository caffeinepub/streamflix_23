import { X } from "lucide-react";
import { useEffect } from "react";
import type { Video } from "../lib/types";

interface TrailerModalProps {
  video: Video;
  onClose: () => void;
}

export default function TrailerModal({ video, onClose }: TrailerModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close trailer"
      />
      <div className="relative w-full max-w-3xl mx-4 z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-[#E50914] transition-colors"
          aria-label="Close trailer"
        >
          <X size={28} />
        </button>
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`}
            title={video.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <p className="text-[#B3B3B3] text-sm mt-3 text-center">{video.name}</p>
      </div>
    </div>
  );
}
