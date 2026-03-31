import { useState } from "react";
import { setApiKey } from "../lib/tmdb";

interface ApiKeySetupProps {
  onSaved: () => void;
}

export default function ApiKeySetup({ onSaved }: ApiKeySetupProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter your TMDB API key.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/configuration?api_key=${trimmed}`,
      );
      if (!res.ok) {
        setError("Invalid API key. Please check and try again.");
        setLoading(false);
        return;
      }
      setApiKey(trimmed);
      onSaved();
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#E50914] tracking-wider mb-2">
            STREAMFLIX
          </h1>
          <p className="text-[#B3B3B3] text-sm">Powered by TMDB</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-[#2A2A2A]">
          <h2 className="text-white text-xl font-bold mb-2">Connect to TMDB</h2>
          <p className="text-[#8E8E8E] text-sm mb-6">
            StreamFlix uses the TMDB API to display movies and TV shows. Enter
            your free API key to get started.
          </p>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="tmdb-api-key"
                className="block text-[#B3B3B3] text-xs font-medium uppercase tracking-wider mb-2"
              >
                TMDB API Key (v3)
              </label>
              <input
                id="tmdb-api-key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="Enter your API key..."
                className="w-full bg-[#2B2B2B] border border-[#3A3A3A] text-white rounded-lg px-4 py-3 text-sm placeholder-[#555] focus:outline-none focus:border-[#E50914] transition-colors"
              />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#E50914] hover:bg-[#c50813] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Start Watching"}
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-[#2A2A2A]">
            <p className="text-[#8E8E8E] text-xs">
              Don&apos;t have a TMDB API key?{" "}
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E50914] hover:underline"
              >
                Get one free at themoviedb.org &rarr;
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
