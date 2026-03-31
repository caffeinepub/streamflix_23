import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { type WatchHistoryEntry, useWatchHistory } from "./useWatchHistory";

const MAX_ENTRIES = 50;

/**
 * When signed in: syncs watch history with Firestore (real-time).
 * When guest: delegates to the localStorage-based useWatchHistory hook.
 */
export function useFirestoreWatchHistory() {
  const { user } = useAuth();
  const local = useWatchHistory();

  const [firestoreHistory, setFirestoreHistory] = useState<WatchHistoryEntry[]>(
    [],
  );

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, "users", user.uid, "watchHistory");
    const unsub = onSnapshot(colRef, (snap) => {
      const entries = snap.docs.map((d) => d.data() as WatchHistoryEntry);
      entries.sort((a, b) => b.timestamp - a.timestamp);
      setFirestoreHistory(entries.slice(0, MAX_ENTRIES));
    });
    return unsub;
  }, [user]);

  const addToHistory = useCallback(
    (entry: WatchHistoryEntry) => {
      if (user) {
        const docId = `${entry.type}_${entry.id}`;
        void setDoc(doc(db, "users", user.uid, "watchHistory", docId), {
          ...entry,
          timestamp: Date.now(),
        });
      } else {
        local.addToHistory(entry);
      }
    },
    [user, local],
  );

  const removeFromHistory = useCallback(
    (id: number, type: "movie" | "tv") => {
      if (user) {
        const docId = `${type}_${id}`;
        void deleteDoc(doc(db, "users", user.uid, "watchHistory", docId));
      } else {
        local.removeFromHistory(id, type);
      }
    },
    [user, local],
  );

  const clearHistory = useCallback(() => {
    if (user) {
      // Delete all docs
      const colRef = collection(db, "users", user.uid, "watchHistory");
      import("firebase/firestore").then(({ getDocs }) => {
        void getDocs(colRef).then((snap) => {
          for (const d of snap.docs) {
            void deleteDoc(d.ref);
          }
        });
      });
    } else {
      local.clearHistory();
    }
  }, [user, local]);

  if (user) {
    return {
      history: firestoreHistory,
      addToHistory,
      removeFromHistory,
      clearHistory,
    };
  }

  return {
    history: local.history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
