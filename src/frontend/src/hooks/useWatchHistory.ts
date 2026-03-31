import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "streamflix_watch_history";
const MAX_ENTRIES = 50;

export interface WatchHistoryEntry {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  timestamp: number;
  currentTime?: number;
  season?: number;
  episode?: number;
}

function readHistory(): WatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchHistoryEntry[];
  } catch {
    return [];
  }
}

function writeHistory(entries: WatchHistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryEntry[]>(readHistory);

  const sync = useCallback(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [sync]);

  const addToHistory = useCallback((entry: WatchHistoryEntry) => {
    const current = readHistory();
    const idx = current.findIndex(
      (e) => e.id === entry.id && e.type === entry.type,
    );
    let updated: WatchHistoryEntry[];
    if (idx >= 0) {
      updated = [
        { ...current[idx], ...entry, timestamp: Date.now() },
        ...current.slice(0, idx),
        ...current.slice(idx + 1),
      ];
    } else {
      updated = [entry, ...current];
    }
    updated = updated.slice(0, MAX_ENTRIES);
    writeHistory(updated);
    setHistory(updated);
  }, []);

  const removeFromHistory = useCallback((id: number, type: "movie" | "tv") => {
    const updated = readHistory().filter(
      (e) => !(e.id === id && e.type === type),
    );
    writeHistory(updated);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
