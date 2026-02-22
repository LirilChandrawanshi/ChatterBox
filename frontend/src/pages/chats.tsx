import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MessageCircle, Plus, User, Trash2, X } from "lucide-react";
import ProfileModal from "@/components/ProfileModal";
import {
  getConversations,
  getOnlineMobiles,
  getOrCreateConversation,
  getProfilePicture,
  deleteConversation,
  type ConversationSummary,
} from "@/services/api";
import { getStoredUser } from "./index";
import BottomNav from "@/components/BottomNav";

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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const displayName = stored?.displayName ?? myMobile;

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [contactPics, setContactPics] = useState<Record<string, string>>({});
  const fetchedPicsRef = useRef<Set<string>>(new Set());

  // Desktop detection - redirect to desktop view only on initial load
  useEffect(() => {
    if (router.isReady && window.innerWidth >= 1024 && myMobile) {
      router.replace(`/desktop?mobile=${encodeURIComponent(myMobile)}`);
    }
  }, [router.isReady, myMobile]);
  const longPressHandledRef = useRef(false);
  const LONG_PRESS_MS = 500;

  useEffect(() => {
    if (!router.isReady) return;
    if (!myMobile) {
      router.replace("/");
      return;
    }

    // Fetch conversations first, then hide loader
    const loadData = async () => {
      try {
        const [convs, onlineList] = await Promise.all([
          getConversations(myMobile),
          getOnlineMobiles(),
        ]);
        setConversations(convs);
        setOnlineMobiles(new Set(onlineList));
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Load profile picture separately (non-blocking)
    getProfilePicture(myMobile).then((pic) => {
      if (pic) setProfilePicture(pic);
    }).catch(() => { });

    // Poll for online status
    const t = setInterval(() => getOnlineMobiles().then((list) => setOnlineMobiles(new Set(list))), 10000);
    return () => clearInterval(t);
  }, [router.isReady, myMobile]);

  useEffect(() => {
    if (!myMobile) return;
    const interval = setInterval(() => {
      getConversations(myMobile).then(setConversations);
    }, 5000);
    return () => clearInterval(interval);
  }, [myMobile]);

  // Fetch profile pictures for all conversation participants
  useEffect(() => {
    if (conversations.length === 0) return;
    const mobilesToFetch = conversations
      .map((conv) => conv.otherParticipantMobile ?? (conv.participant1 === myMobile ? conv.participant2 : conv.participant1))
      .filter((m) => m && !fetchedPicsRef.current.has(m));

    // Deduplicate
    const unique = Array.from(new Set(mobilesToFetch));
    if (unique.length === 0) return;

    unique.forEach((mobile) => {
      fetchedPicsRef.current.add(mobile); // Mark as in-flight immediately
      getProfilePicture(mobile).then((pic) => {
        if (pic) {
          setContactPics((prev) => ({ ...prev, [mobile]: pic }));
        }
      }).catch(() => { });
    });
  }, [conversations]);

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
    } catch (err: unknown) {
      setNewChatError(err instanceof Error ? err.message : "Could not start conversation");
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

  // Selection mode handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const selectAll = () => {
    setSelectedIds(new Set(conversations.map((c) => c.id)));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => deleteConversation(id, myMobile))
      );
      setConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      clearSelection();
    } finally {
      setDeleting(false);
    }
  };

  const startLongPress = (id: string) => {
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressHandledRef.current = true;
      setSelectionMode(true);
      setSelectedIds((prev) => new Set(prev).add(id));
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleChatClick = (conv: ConversationSummary) => {
    if (selectionMode) {
      if (longPressHandledRef.current) {
        longPressHandledRef.current = false;
        return;
      }
      toggleSelect(conv.id);
    } else {
      router.push(`/chat/${conv.id}?mobile=${encodeURIComponent(myMobile)}`);
    }
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
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white/10">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{displayName}</h1>
              <p className="text-xs text-[#8696a0]">{myMobile}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowNewChat(true)}
            className="p-2.5 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-[#00a884] transition"
            title="New chat"
          >
            <Plus className="w-6 h-6" />
          </button>
        </header>

        {/* Selection toolbar */}
        {selectionMode && (
          <div className="bg-[#1f2c34] border-b border-[#2a3942] px-4 py-2 flex items-center justify-between gap-2 animate-fade-in">
            <span className="text-sm text-white">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#2a3942] text-[#8696a0] hover:bg-[#3a4952] hover:text-white transition"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || deleting}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-600 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="p-1.5 rounded-lg hover:bg-[#2a3942] transition"
                title="Cancel"
              >
                <X className="w-4 h-4 text-[#8696a0]" />
              </button>
            </div>
          </div>
        )}

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
                    className="flex-1 py-2.5 rounded-xl bg-[#00a884] text-white hover:bg-[#06cf9c] disabled:opacity-50 transition shadow-lg shadow-[#00a884]/20 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Starting...</span>
                      </>
                    ) : "Start chat"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[#8696a0]">Loading chats...</p>
            </div>
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
                const isSelected = selectedIds.has(conv.id);
                const colors = ["#00a884", "#667eea", "#f093fb", "#4facfe", "#43e97b"];
                const str = otherMobile ?? "";
                const color = colors[Math.abs(str.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => handleChatClick(conv)}
                      onTouchStart={() => startLongPress(conv.id)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onMouseDown={() => startLongPress(conv.id)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSelectionMode(true);
                        setSelectedIds((prev) => new Set(prev).add(conv.id));
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1f2c34]/80 active:bg-[#1f2c34] border-b border-[#1a2332] text-left transition ${isSelected ? "bg-[#1f2c34] ring-2 ring-inset ring-[#00a884]/50" : ""
                        }`}
                    >
                      {/* Checkbox in selection mode */}
                      {selectionMode && (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${isSelected
                            ? "bg-[#00a884] border-[#00a884]"
                            : "border-[#8696a0]"
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(conv.id);
                          }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectionMode) {
                              setViewingProfile(otherMobile);
                            }
                          }}
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md ring-2 ring-white/5 hover:ring-[#00a884] transition cursor-pointer overflow-hidden"
                          style={{ backgroundColor: color }}
                        >
                          {contactPics[otherMobile] ? (
                            <img src={contactPics[otherMobile]} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </button>
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

        {/* Bottom Navigation */}
        <BottomNav activeTab="chats" mobile={myMobile} />
      </div>

      {/* Profile Modal */}
      {viewingProfile && (
        <ProfileModal
          mobile={viewingProfile}
          onClose={() => setViewingProfile(null)}
        />
      )}
    </>
  );
}

