import { useState, useEffect, FormEvent, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import { MessageCircle } from "lucide-react";
import { signup, login, googleLogin, setToken, getUserCount } from "@/services/api";

const STORAGE_KEY = "chatterbox_user";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function getStoredUser(): { mobile: string; displayName: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { mobile: string; displayName: string };
    return data.mobile ? data : null;
  } catch {
    return null;
  }
}

export function setStoredUser(mobile: string, displayName: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ mobile, displayName }));
}

type Tab = "login" | "signup";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [mobile, setMobile] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userCount, setUserCount] = useState<number | null>(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    getUserCount()
      .then(({ count }) => setUserCount(count))
      .catch(() => setUserCount(null));
  }, []);

  // Google Sign-In callback
  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      setError("");
      setLoading(true);
      try {
        const res = await googleLogin(response.credential);
        setToken(res.token);
        setStoredUser(res.user.mobile, res.user.displayName);
        router.push(`/chats?mobile=${encodeURIComponent(res.user.mobile)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login failed");
        setLoading(false);
      }
    },
    [router],
  );

  // Initialize Google Identity Services once script loads
  const handleGsiLoad = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || !(window as any).google) return;
    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    setGsiReady(true);
  }, [handleGoogleCredential]);

  const triggerGoogleSignIn = () => {
    if (!(window as any).google) return;
    (window as any).google.accounts.id.prompt();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const m = mobile.trim().replace(/[^0-9+]/g, "");
    if (m.length < 5) {
      setError("Enter a valid mobile number");
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await login(m, password);
      setToken(res.token);
      setStoredUser(res.user.mobile, res.user.displayName);
      router.push(`/chats?mobile=${encodeURIComponent(res.user.mobile)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    const m = mobile.trim().replace(/[^0-9+]/g, "");
    if (m.length < 5) {
      setError("Enter a valid mobile number");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await signup(m, displayName.trim() || m, password);
      setToken(res.token);
      setStoredUser(res.user.mobile, res.user.displayName);
      router.push(`/chats?mobile=${encodeURIComponent(res.user.mobile)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setLoading(false);
    }
  };

  const handleSubmit = tab === "login" ? handleLogin : handleSignup;

  return (
    <>
      <Head>
        <title>ChatterBox - Login &amp; Sign up</title>
      </Head>

      {/* Google Identity Services script */}
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={handleGsiLoad}
        />
      )}

      <div className="flex items-center justify-center min-h-screen w-full p-4 bg-[#0a0e12] bg-gradient-to-b from-[#0d1117] to-[#0a0e12]">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center shadow-lg shadow-[#00a884]/20">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white">ChatterBox</h1>
          </div>

          <div className="bg-gradient-to-b from-[#1f2c34] to-[#1a2332] rounded-2xl shadow-2xl overflow-hidden border border-[#2a3942]/50">
            {/* Tabs */}
            <div className="flex border-b border-[#2a3942]">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setError("");
                }}
                className={`flex-1 py-3 text-sm font-medium transition ${tab === "login"
                  ? "text-[#00a884] border-b-2 border-[#00a884]"
                  : "text-[#8696a0] hover:text-white"
                  }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setError("");
                }}
                className={`flex-1 py-3 text-sm font-medium transition ${tab === "signup"
                  ? "text-[#00a884] border-b-2 border-[#00a884]"
                  : "text-[#8696a0] hover:text-white"
                  }`}
              >
                Sign up
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#8696a0] text-xs mb-1">Mobile number</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#2a3942] border border-[#2a3942] rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 focus:border-[#00a884] transition"
                    required
                    autoFocus
                  />
                </div>
                {tab === "signup" && (
                  <div>
                    <label className="block text-[#8696a0] text-xs mb-1">Your name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How others will see you"
                      className="w-full bg-[#2a3942] border border-[#2a3942] rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 focus:border-[#00a884] transition"
                      maxLength={50}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[#8696a0] text-xs mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === "login" ? "Your password" : "At least 6 characters"}
                    className="w-full bg-[#2a3942] border border-[#2a3942] rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 focus:border-[#00a884] transition"
                    required
                    minLength={tab === "signup" ? 6 : undefined}
                  />
                </div>
                {tab === "signup" && (
                  <div>
                    <label className="block text-[#8696a0] text-xs mb-1">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-[#2a3942] border border-[#2a3942] rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 focus:border-[#00a884] transition"
                      required
                    />
                  </div>
                )}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00a884]/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Please wait...</span>
                    </>
                  ) : tab === "login" ? "Log in" : "Create account"}
                </button>
              </form>

              {/* Google Sign-In divider and button */}
              {GOOGLE_CLIENT_ID && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#2a3942]"></div>
                    <span className="text-[#8696a0] text-xs uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-[#2a3942]"></div>
                  </div>
                  <button
                    type="button"
                    onClick={triggerGoogleSignIn}
                    disabled={loading || !gsiReady}
                    className="w-full bg-white hover:bg-gray-100 text-gray-800 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md"
                  >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Sign in with Google
                  </button>
                </>
              )}
            </div>
          </div>

          {userCount !== null && (
            <p className="text-[#8696a0] text-sm text-center mt-4">
              Join {userCount.toLocaleString()} users on OpenTalk
            </p>
          )}
          <p className="text-[#8696a0] text-xs text-center mt-4">
            {tab === "login"
              ? "Don't have an account? Sign up with your mobile number."
              : "Already have an account? Log in above."}
          </p>
        </div>
      </div>
    </>
  );
}
