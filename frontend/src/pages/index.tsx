import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MessageCircle } from "lucide-react";
import { signup, login, setToken, getUserCount } from "@/services/api";

const STORAGE_KEY = "chatterbox_user";

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

  useEffect(() => {
    getUserCount()
      .then(({ count }) => setUserCount(count))
      .catch(() => setUserCount(null));
  }, []);

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
        <title>ChatterBox - Login & Sign up</title>
      </Head>

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
