import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MessageCircle, Plus, LogOut, User } from "lucide-react";
import {
  getConversations,
  getOnlineMobiles,
  getOrCreateConversation,
  clearToken,
  type ConversationSummary,
} from "@/services/api";
import { getStoredUser } from "./index";

export default function Chats() {
  const router = useRouter();
  const { mobile: queryMobile } = router.query;
  const stored = getStoredUser();
  const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [onlineMobiles, setOnlineMobiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newContactMobile, setNewContactMobile] = useState("");
  const [newChatError, setNewChatError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (!myMobile) {
      router.replace("/");
      return;
    }
    getConversations(myMobile).then(setConversations);
    getOnlineMobiles().then((list) => setOnlineMobiles(new Set(list)));
    const t = setInterval(() => getOnlineMobiles().then((list) => setOnlineMobiles(new Set(list))), 10000);
    setLoading(false);
    return () => clearInterval(t);
  }, [router.isReady, myMobile]);

  useEffect(() => {
    if (!myMobile) return;
    const interval = setInterval(() => {
      getConversations(myMobile).then(setConversations);
    }, 5000);
    return () => clearInterval(interval);
  }, [myMobile]);

  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const other = newContactMobile.trim().replace(/[^0-9+]/g, "");
    if (other.length < 5) {
      setNewChatError("Enter a valid mobile number");
      return;
    }
    if (other === myMobile) {
      setNewChatError("You cannot chat with yourself");
      return;
    }
    setNewChatError("");
    setCreating(true);
    try {
      const conv = await getOrCreateConversation(myMobile, other);
      setShowNewChat(false);
      setNewContactMobile("");
      router.push(`/chat/${conv.id}?mobile=${encodeURIComponent(myMobile)}`);
    } catch {
      setNewChatError("Could not start conversation");
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (d.getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!myMobile) return null;

  return (
    <>
      <Head>
        <title>ChatterBox - Chats</title>
      </Head>

      <div className="flex flex-col h-screen bg-[#0a0e12]">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#1a2332] to-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]/80 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white/10">
              {myMobile.slice(-2)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Chats</h1>
              <p className="text-xs text-[#8696a0]">{myMobile}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="p-2.5 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-[#00a884] transition"
              title="New chat"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("chatterbox_user");
                clearToken();
                router.push("/");
              }}
              className="p-2.5 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-white transition"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* New chat modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-[#1f2c34] to-[#1a2332] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-[#2a3942]/50">
              <h2 className="text-xl font-semibold text-white mb-2">New chat</h2>
              <p className="text-[#8696a0] text-sm mb-4">
                Enter the mobile number of the person you want to chat with.
              </p>
              <form onSubmit={handleNewChat}>
                <input
                  type="tel"
                  value={newContactMobile}
                  onChange={(e) => setNewContactMobile(e.target.value)}
                  placeholder="Mobile number"
                  className="w-full bg-[#2a3942] border border-[#2a3942] rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 focus:border-[#00a884] mb-3"
                  autoFocus
                />
                {newChatError && <p className="text-red-400 text-sm mb-2">{newChatError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewChat(false);
                      setNewContactMobile("");
                      setNewChatError("");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl bg-[#00a884] text-white hover:bg-[#06cf9c] disabled:opacity-50 transition shadow-lg shadow-[#00a884]/20"
                  >
                    {creating ? "Starting…" : "Start chat"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-[#8696a0] text-center">Loading…</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#1f2c34] flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-[#00a884]" />
              </div>
              <p className="text-[#e9edef] font-medium mb-1">No chats yet</p>
              <p className="text-sm text-[#8696a0] mb-5">
                Tap the + button to start a chat with someone on the app.
              </p>
              <button
                type="button"
                onClick={() => setShowNewChat(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a884] text-white hover:bg-[#06cf9c] transition shadow-lg shadow-[#00a884]/20"
              >
                <Plus className="w-4 h-4" />
                New chat
              </button>
            </div>
          ) : (
            <ul className="py-1">
              {conversations.map((conv) => {
                const otherMobile = conv.otherParticipantMobile ?? (conv.participant1 === myMobile ? conv.participant2 : conv.participant1);
                const name = conv.otherParticipantName ?? otherMobile;
                const isOnline = onlineMobiles.has(otherMobile);
                const colors = ["#00a884", "#667eea", "#f093fb", "#4facfe", "#43e97b"];
                const str = otherMobile ?? "";
                const color = colors[Math.abs(str.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/chat/${conv.id}?mobile=${encodeURIComponent(myMobile)}`)
                      }
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1f2c34]/80 active:bg-[#1f2c34] border-b border-[#1a2332] text-left transition"
                    >
                      <div className="relative shrink-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md ring-2 ring-white/5"
                          style={{ backgroundColor: color }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        {isOnline && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] border-2 border-[#0a0e12]"
                            title="Online"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{name}</p>
                        <p className="text-sm text-[#8696a0] truncate">
                          {conv.lastMessagePreview || "No messages yet"}
                        </p>
                      </div>
                      <span className="text-xs text-[#8696a0] shrink-0">
                        {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
