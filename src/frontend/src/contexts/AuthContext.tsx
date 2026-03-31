import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { WatchHistoryEntry } from "../hooks/useWatchHistory";
import { auth, db, googleProvider } from "../lib/firebase";

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pw: string) => Promise<void>;
  signUpWithEmail: (email: string, pw: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInModalOpen: boolean;
  setSignInModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const HISTORY_STORAGE_KEY = "streamflix_watch_history";
const AUTH_SHOWN_KEY = "streamflix_auth_shown";

async function mergeLocalHistoryToFirestore(uid: string) {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return;
    const entries: WatchHistoryEntry[] = JSON.parse(raw);
    if (!entries.length) return;
    const histRef = collection(db, "users", uid, "watchHistory");
    const existing = await getDocs(histRef);
    const existingIds = new Set(existing.docs.map((d) => d.id));
    for (const entry of entries) {
      const docId = `${entry.type}_${entry.id}`;
      if (!existingIds.has(docId)) {
        await setDoc(doc(histRef, docId), entry);
      }
    }
  } catch (e) {
    console.error("Failed to merge local history:", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Show sign-in modal on first visit if not signed in
  useEffect(() => {
    if (authLoading) return;
    if (!user && localStorage.getItem(AUTH_SHOWN_KEY) !== "true") {
      setSignInModalOpen(true);
    }
  }, [authLoading, user]);

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    await mergeLocalHistoryToFirestore(result.user.uid);
    localStorage.setItem(AUTH_SHOWN_KEY, "true");
  }

  async function signInWithEmail(email: string, pw: string) {
    const result = await signInWithEmailAndPassword(auth, email, pw);
    await mergeLocalHistoryToFirestore(result.user.uid);
    localStorage.setItem(AUTH_SHOWN_KEY, "true");
  }

  async function signUpWithEmail(email: string, pw: string) {
    const result = await createUserWithEmailAndPassword(auth, email, pw);
    await mergeLocalHistoryToFirestore(result.user.uid);
    localStorage.setItem(AUTH_SHOWN_KEY, "true");
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        signInModalOpen,
        setSignInModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
