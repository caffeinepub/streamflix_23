import { X } from "lucide-react";
import { useState } from "react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "../contexts/AuthContext";

const AUTH_SHOWN_KEY = "streamflix_auth_shown";

export default function SignInModal() {
  const {
    signInModalOpen,
    setSignInModalOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!signInModalOpen) return null;

  function handleDismiss() {
    localStorage.setItem(AUTH_SHOWN_KEY, "true");
    setSignInModalOpen(false);
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      setSignInModalOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (tab === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (tab === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      setSignInModalOpen(false);
    } catch (e: any) {
      const code = e?.code ?? "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("Email is already in use.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(e?.message ?? "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      data-ocid="signin.modal"
    >
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click */}
      <div className="absolute inset-0 bg-black/75" onClick={handleDismiss} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#141414] rounded-xl shadow-2xl border border-[#2B2B2B] overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 pt-8 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#E50914] font-black text-2xl tracking-tight">
              STREAM
            </span>
            <span className="text-white font-black text-2xl tracking-tight">
              FLIX
            </span>
          </div>
          <button
            type="button"
            data-ocid="signin.close_button"
            onClick={handleDismiss}
            className="absolute right-4 top-4 text-[#B3B3B3] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2B2B2B]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mb-6 bg-[#0B0B0B] rounded-lg p-1">
          <button
            type="button"
            data-ocid="signin.tab"
            onClick={() => {
              setTab("signin");
              setError("");
            }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === "signin"
                ? "bg-[#E50914] text-white"
                : "text-[#B3B3B3] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            data-ocid="signin.tab"
            onClick={() => {
              setTab("signup");
              setError("");
            }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === "signup"
                ? "bg-[#E50914] text-white"
                : "text-[#B3B3B3] hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="px-6 pb-8">
          {/* Google button */}
          <button
            type="button"
            data-ocid="signin.primary_button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#E50914] hover:bg-[#C40812] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors mb-4"
          >
            <SiGoogle size={18} />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#2B2B2B]" />
            <span className="text-[#555] text-xs">or</span>
            <div className="flex-1 h-px bg-[#2B2B2B]" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                data-ocid="signin.input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#2B2B2B] border border-[#3A3A3A] focus:border-[#E50914] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                data-ocid="signin.input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#2B2B2B] border border-[#3A3A3A] focus:border-[#E50914] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>
            {tab === "signup" && (
              <div>
                <input
                  type="password"
                  data-ocid="signin.input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#2B2B2B] border border-[#3A3A3A] focus:border-[#E50914] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
            )}

            {error && (
              <p
                data-ocid="signin.error_state"
                className="text-[#E50914] text-xs"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              data-ocid="signin.submit_button"
              disabled={loading}
              className="w-full bg-white hover:bg-[#e0e0e0] disabled:opacity-60 text-black font-bold py-3 rounded-lg transition-colors text-sm"
            >
              {loading
                ? "Please wait..."
                : tab === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          {/* Guest link */}
          <div className="mt-5 text-center">
            <button
              type="button"
              data-ocid="signin.secondary_button"
              onClick={handleDismiss}
              className="text-[#B3B3B3] hover:text-white text-sm underline-offset-2 hover:underline transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
