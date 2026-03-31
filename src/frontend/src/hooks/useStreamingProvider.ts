import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";

export type StreamingProvider = "vidking" | "videasy" | "vidrock" | "vidfast";

const LS_KEY = "streamflix_streaming_provider";
const PREF_DOC = (uid: string) =>
  doc(db, "users", uid, "preferences", "streaming");

export function useStreamingProvider(): [
  StreamingProvider,
  (p: StreamingProvider) => void,
] {
  const { user } = useAuth();
  const [provider, setProviderState] = useState<StreamingProvider>(
    () =>
      (localStorage.getItem(LS_KEY) as StreamingProvider | null) ?? "vidfast",
  );

  // On mount (or when user changes), read Firestore first if logged in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getDoc(PREF_DOC(user.uid))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const val = snap.data()?.provider as StreamingProvider | undefined;
          if (
            val === "vidking" ||
            val === "videasy" ||
            val === "vidrock" ||
            val === "vidfast"
          ) {
            setProviderState(val);
            localStorage.setItem(LS_KEY, val);
          }
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [user]);

  function setProvider(p: StreamingProvider) {
    setProviderState(p);
    localStorage.setItem(LS_KEY, p);
    if (user) {
      setDoc(PREF_DOC(user.uid), { provider: p }, { merge: true }).catch(
        console.error,
      );
    }
  }

  return [provider, setProvider];
}
