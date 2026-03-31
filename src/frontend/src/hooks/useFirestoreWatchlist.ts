import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";

const GUEST_KEY = "streamflix_watchlist_guest";

interface WatchlistDoc {
  id: number;
  type: string;
}

function readGuestWatchlist(): WatchlistDoc[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as WatchlistDoc[]) : [];
  } catch {
    return [];
  }
}

function writeGuestWatchlist(items: WatchlistDoc[]) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function useFirestoreWatchlist() {
  const { user } = useAuth();
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());

  // Load initial guest watchlist
  useEffect(() => {
    if (!user) {
      const items = readGuestWatchlist();
      setWatchlistIds(new Set(items.map((i) => i.id)));
    }
  }, [user]);

  // Real-time Firestore sync when signed in
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, "users", user.uid, "watchlist");
    const unsub = onSnapshot(colRef, (snap) => {
      const ids = new Set<number>(
        snap.docs.map((d) => (d.data() as WatchlistDoc).id),
      );
      setWatchlistIds(ids);
    });
    return unsub;
  }, [user]);

  function toggleWatchlist(id: number, type: "movie" | "tv") {
    if (user) {
      const docId = `${type}_${id}`;
      const docRef = doc(db, "users", user.uid, "watchlist", docId);
      if (watchlistIds.has(id)) {
        void deleteDoc(docRef);
      } else {
        void setDoc(docRef, { id, type });
      }
    } else {
      const current = readGuestWatchlist();
      const exists = current.some((i) => i.id === id && i.type === type);
      const updated = exists
        ? current.filter((i) => !(i.id === id && i.type === type))
        : [...current, { id, type }];
      writeGuestWatchlist(updated);
      setWatchlistIds(new Set(updated.map((i) => i.id)));
    }
  }

  return { watchlistIds, toggleWatchlist };
}
