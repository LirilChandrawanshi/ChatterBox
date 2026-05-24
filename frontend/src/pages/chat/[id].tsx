import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, Paperclip, Smile, Send, Check, CheckCheck, Trash2, Reply, X, File, Image, Contact, BarChart3, CalendarDays, Plus, MapPin } from "lucide-react";
import { wsService, type ChatMessage } from "@/services/websocket";
import ProfileModal from "@/components/ProfileModal";
import Loader from "@/components/Loader";
import {
  getMessages,
  sendMessage as apiSendMessage,
  sendFileMessage as apiSendFileMessage,
  deleteMessages,
  getConversation,
  getProfilePicture,
} from "@/services/api";
import { getStoredUser } from "../index";
import { getEmojiList } from "@/utils/emojis";

const EMOJI_LIST = getEmojiList();

export default function ConversationPage() {
  const router = useRouter();
  const { id: conversationId, mobile: queryMobile } = router.query;
  const stored = getStoredUser();
  const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");
  const convId = typeof conversationId === "string" ? conversationId : "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherMobile, setOtherMobile] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [sendingFile, setSendingFile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [otherLastReadAt, setOtherLastReadAt] = useState<number>(0);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingSentRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Message selection & Reply state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressActiveRef = useRef(false);
  const [viewingProfile, setViewingProfile] = useState(false);
  const [otherProfilePic, setOtherProfilePic] = useState<string | null>(null);

  // Handlers
  const handleLongPress = (msgId: string) => {
    if (!msgId) return;
    longPressActiveRef.current = true;
    setSelectionMode(true);
    setSelectedMessageIds(new Set([msgId]));
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
  };

  const handleTouchStart = (e: React.TouchEvent, msgId: string) => {
    if (selectionMode) return;
    longPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => handleLongPress(msgId), 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // Prevent click if long press was activated
    if (longPressActiveRef.current) {
      e.preventDefault();
      longPressActiveRef.current = false;
    }
  };

  const handleTouchMove = () => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  const toggleSelection = (msgId: string) => {
    if (!selectionMode) return;
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedMessageIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Delete ${selectedMessageIds.size} messages?`)) {
      const ids = Array.from(selectedMessageIds);
      const success = await deleteMessages(ids);
      if (success) {
        // Optimistic update
        setMessages((prev) => prev.filter((m) => !selectedMessageIds.has(m.id!)));
        cancelSelection();
      }
    }
  };

  const handleReplyAction = () => {
    if (selectedMessageIds.size !== 1) return;
    const msgId = Array.from(selectedMessageIds)[0];
    const msg = messages.find((m) => m.id === msgId);
    if (msg) {
      setReplyToMessage(msg);
      cancelSelection();
      inputRef.current?.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  useEffect(() => {
    if (!router.isReady || !myMobile || !convId) return;
    getConversation(convId, myMobile).then((data) => {
      if (data) {
        setOtherName(data.otherParticipantName);
        setOtherMobile(data.otherParticipantMobile);
        // Store when the other user last read (for persistent blue ticks)
        if (data.otherLastReadAt) {
          setOtherLastReadAt(data.otherLastReadAt);
        }
      }
    });
    setLoadingMessages(true);
    getMessages(convId, myMobile).then((list) =>
      setMessages(list as ChatMessage[])
    ).finally(() => setLoadingMessages(false));
    // Mark messages as read when opening chat (via WebSocket when connected)
  }, [router.isReady, myMobile, convId]);

  // Fetch other user's profile picture
  useEffect(() => {
    if (!otherMobile) return;
    getProfilePicture(otherMobile).then((pic) => {
      if (pic) setOtherProfilePic(pic);
    }).catch(() => { });
  }, [otherMobile]);

  // Mark messages as read based on persisted otherLastReadAt
  useEffect(() => {
    if (otherLastReadAt > 0 && messages.length > 0) {
      setReadMessageIds((prev) => {
        const next = new Set(prev);
        messages.forEach((m) => {
          // Mark my messages as read if they were sent before the other user's last read time
          if (m.sender === myMobile && m.id && m.timestamp && m.timestamp <= otherLastReadAt) {
            next.add(m.id);
          }
        });
        return next;
      });
    }
  }, [otherLastReadAt, messages, myMobile]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!myMobile || !convId) return;
    wsService.connect(
      myMobile,
      () => {
        setConnected(true);
        setConnecting(false);
        setConnectionError("");
        // Send read receipt via WebSocket when connected
        wsService.sendReadReceipt(convId);
      },
      () => {
        setConnecting(false);
        setConnectionError("Could not connect. Make sure the backend is running.");
      }
    );
    const handler = (message: ChatMessage) => {
      if (message.conversationId !== convId) return;

      // Handle typing indicator
      if (message.type === "TYPING" && message.sender !== myMobile) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        return;
      }

      // Handle read receipt
      if (message.type === "READ" && message.sender !== myMobile) {
        // Mark all messages as read by other user
        setReadMessageIds((prev) => {
          const next = new Set(prev);
          messagesRef.current.forEach((m) => {
            if (m.sender === myMobile && m.id) next.add(m.id);
          });
          return next;
        });
        return;
      }

      if (message.type === "DELETED" && message.messageIds?.length) {
        setMessages((prev) =>
          prev.filter((m) => !message.messageIds!.includes(m.id!))
        );
        return;
      }
      if (message.type === "CHAT" || message.type === "FILE") {
        setMessages((prev) => [...prev, message]);
        // If message from other, mark as read via WebSocket
        if (message.sender !== myMobile && connected) {
          wsService.sendReadReceipt(convId);
        }
      }
    };
    wsService.onMessage(handler);
    return () => wsService.disconnect();
  }, [myMobile, convId]);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !convId || !myMobile || !connected) return;
    setInputMessage("");
    setShowEmoji(false);
    isTypingSentRef.current = false;

    // Capture reply state then clear it
    const replyTo = replyToMessage ? {
      id: replyToMessage.id!,
      content: replyToMessage.content || "Media",
      sender: replyToMessage.sender
    } : undefined;
    setReplyToMessage(null);

    try {
      await apiSendMessage(convId, myMobile, text, replyTo);
    } catch {
      setInputMessage(text);
      // Restore reply state on failure if needed, but simplifying for now
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    // Send typing indicator via WebSocket (throttled)
    if (value.trim() && connected && !isTypingSentRef.current) {
      wsService.sendTypingToConversation(convId);
      isTypingSentRef.current = true;
      if (sendTypingTimeoutRef.current) clearTimeout(sendTypingTimeoutRef.current);
      sendTypingTimeoutRef.current = setTimeout(() => {
        isTypingSentRef.current = false;
      }, 3000);
    }
  };

  // Close attach menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachMenu]);

  const handleEmojiClick = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convId || !myMobile || !connected) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB.");
      e.target.value = "";
      return;
    }
    setSendingFile(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) {
        setSendingFile(false);
        return;
      }
      try {
        await apiSendFileMessage(convId, myMobile, base64, file.type);
      } catch {
        alert("Failed to send file.");
      }
      setSendingFile(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendPoll = async () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2 || !convId || !myMobile || !connected) return;
    const pollData = JSON.stringify({ question: q, options: opts, votes: {} });
    try {
      await apiSendMessage(convId, myMobile, `__POLL__${pollData}`);
    } catch { /* ignore */ }
    setShowPollModal(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handleVotePoll = async (msgId: string, optionIndex: number) => {
    if (!convId || !myMobile || !connected) return;
    const voteData = JSON.stringify({ pollMessageId: msgId, optionIndex, voter: myMobile });
    try {
      await apiSendMessage(convId, myMobile, `__POLL_VOTE__${voteData}`);
    } catch { /* ignore */ }
  };

  const handleSendContact = async () => {
    const name = contactName.trim();
    const phone = contactPhone.trim();
    if (!name || !phone || !convId || !myMobile || !connected) return;
    const contactData = JSON.stringify({ name, phone });
    try {
      await apiSendMessage(convId, myMobile, `__CONTACT__${contactData}`);
    } catch { /* ignore */ }
    setShowContactModal(false);
    setContactName("");
    setContactPhone("");
  };

  const handleSendEvent = async () => {
    const title = eventTitle.trim();
    if (!title || !eventDate || !convId || !myMobile || !connected) return;
    const eventData = JSON.stringify({ title, date: eventDate, time: eventTime, location: eventLocation.trim() });
    try {
      await apiSendMessage(convId, myMobile, `__EVENT__${eventData}`);
    } catch { /* ignore */ }
    setShowEventModal(false);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
  };

  // Helper: collect poll votes from messages
  const getPollVotes = (pollMsgId: string): Record<number, string[]> => {
    const votes: Record<number, string[]> = {};
    messages.forEach(m => {
      if (m.content?.startsWith("__POLL_VOTE__")) {
        try {
          const v = JSON.parse(m.content.slice(13));
          if (v.pollMessageId === pollMsgId) {
            if (!votes[v.optionIndex]) votes[v.optionIndex] = [];
            // Only keep last vote per voter
            Object.values(votes).forEach(arr => {
              const idx = arr.indexOf(v.voter);
              if (idx !== -1) arr.splice(idx, 1);
            });
            if (!votes[v.optionIndex]) votes[v.optionIndex] = [];
            votes[v.optionIndex].push(v.voter);
          }
        } catch { /* ignore */ }
      }
    });
    return votes;
  };

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvatarColor = (sender: string) => {
    const colors = ["#00a884", "#128c7e", "#25d366", "#34b7f1", "#667eea", "#764ba2", "#f093fb", "#4facfe"];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) hash = 31 * hash + sender.charCodeAt(i);
    return colors[Math.abs(hash % colors.length)];
  };

  useEffect(() => {
    if (router.isReady && convId && !myMobile) router.replace("/");
  }, [router, router.isReady, convId, myMobile]);

  if (!myMobile || !convId) return null;

  return (
    <>
      <Head>
        <title>{otherName || "Chat"} - ChatterBox</title>
      </Head>

      <div className="flex flex-col h-screen bg-[#0a0e12]">
        {/* Header */}
        {/* Header / Action Bar */}
        <header className={`px-4 py-3 flex items-center gap-3 border-b border-[#2a3942]/80 shadow-lg ${selectionMode ? "bg-[#1f2c34]" : "bg-gradient-to-r from-[#1a2332] to-[#1f2c34]"}`}>
          {selectionMode ? (
            <>
              <button
                onClick={cancelSelection}
                className="p-2 -ml-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 text-white font-semibold text-lg">{selectedMessageIds.size} selected</div>
              <div className="flex items-center gap-2">
                {selectedMessageIds.size === 1 && (
                  <button
                    onClick={handleReplyAction}
                    className="p-2 rounded-full text-white hover:bg-white/10 transition"
                    title="Reply"
                  >
                    <Reply className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleDeleteSelected}
                  className="p-2 rounded-full text-white hover:bg-white/10 transition hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push(`/chats?mobile=${encodeURIComponent(myMobile)}`)}
                className="p-2 -ml-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewingProfile(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-md ring-2 ring-white/10 hover:ring-[#00a884] transition cursor-pointer overflow-hidden"
                style={{ backgroundColor: getAvatarColor(otherMobile || "?") }}
              >
                {otherProfilePic ? (
                  <img src={otherProfilePic} alt={otherName} className="w-full h-full object-cover" />
                ) : (
                  (otherName || otherMobile || "?").charAt(0).toUpperCase()
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewingProfile(true)}
                className="flex-1 min-w-0 text-left hover:opacity-80 transition"
              >
                <h1 className="text-white font-semibold truncate text-lg">{otherName || otherMobile || "Chat"}</h1>
                <p className="text-xs text-[#8696a0]">
                  {isTyping ? (
                    <span className="text-[#00a884] animate-pulse">typing...</span>
                  ) : (
                    otherMobile || ""
                  )}
                </p>
              </button>
            </>
          )}
        </header>

        {connecting && !connectionError && (
          <div className="px-4 py-2 bg-[#1a2332]/80 text-[#8696a0] text-sm text-center animate-fade-in">
            Connecting…
          </div>
        )}
        {connectionError && (
          <div className="px-4 py-2 bg-red-500/20 text-red-300 text-sm text-center border-b border-red-500/30">
            {connectionError}
          </div>
        )}

        {/* Messages */}
        <div
          ref={messageAreaRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-3 scrollbar-hide bg-[#0a0e12] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d1117] to-[#0a0e12]"
        >
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader text="Loading messages..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#8696a0] text-sm">No messages yet. Say hello! 👋</p>
            </div>
          ) : (messages
            .filter((m) => (m.type === "CHAT" || m.type === "FILE") && !m.content?.startsWith("__POLL_VOTE__"))
            .map((msg, index) => {
              const isOwn = msg.sender === myMobile;
              const isRead = msg.id && readMessageIds.has(msg.id);
              return (
                <div
                  key={msg.id ?? `m-${index}`}
                  id={`msg-${msg.id}`}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-message-in`}
                >
                  <div
                    onClick={() => selectionMode ? toggleSelection(msg.id!) : null}
                    onTouchStart={(e) => handleTouchStart(e, msg.id!)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onContextMenu={(e) => { e.preventDefault(); handleLongPress(msg.id!); }}
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-lg relative transition-all duration-300 select-none ${isOwn
                      ? "bg-gradient-to-br from-[#005c4b] to-[#004d40] text-white rounded-br-md"
                      : "bg-[#1f2c34] text-[#e9edef] rounded-bl-md border border-[#2a3942]/50"
                      } ${selectedMessageIds.has(msg.id!) ? "ring-2 ring-[#00a884] scale-[0.98]" : ""} ${highlightedMessageId === msg.id ? "ring-2 ring-yellow-400 bg-yellow-400/20 animate-pulse" : ""}`}
                  >
                    {/* Quoted Reply - Clickable */}
                    {msg.replyToId && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyToId!); }}
                        className={`w-full text-left mb-2 rounded-lg p-2 text-sm border-l-4 cursor-pointer hover:opacity-80 transition ${isOwn ? "bg-black/20 border-white/50" : "bg-black/20 border-[#00a884]"}`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isOwn ? "text-white/80" : "text-[#00a884]"}`}>
                          {msg.replyToSender === myMobile ? "You" : msg.replyToSender || "Someone"}
                        </div>
                        <div className="truncate opacity-80">{msg.replyToContent || "Message"}</div>
                      </button>
                    )}
                    {msg.type === "CHAT" && msg.content?.startsWith("__POLL__") && (() => {
                      try {
                        const poll = JSON.parse(msg.content!.slice(8));
                        const votes = getPollVotes(msg.id!);
                        const totalVotes = Object.values(votes).reduce((s, arr) => s + arr.length, 0);
                        const myVoteOption = Object.entries(votes).find(([, voters]) => voters.includes(myMobile))?.[0];
                        return (
                          <div className="min-w-[220px]">
                            <div className="flex items-center gap-2 mb-2">
                              <BarChart3 className="w-4 h-4 text-[#ffbc38]" />
                              <span className="text-xs font-medium opacity-70">POLL</span>
                            </div>
                            <p className="font-medium text-sm mb-3">{poll.question}</p>
                            <div className="space-y-2">
                              {poll.options.map((opt: string, i: number) => {
                                const count = (votes[i] || []).length;
                                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                const isMyVote = String(i) === myVoteOption;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleVotePoll(msg.id!, i); }}
                                    className={`w-full text-left rounded-lg px-3 py-2 text-sm relative overflow-hidden transition ${isMyVote ? "ring-2 ring-[#00a884]" : "hover:opacity-80"}`}
                                    style={{ background: isOwn ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.08)" }}
                                  >
                                    <div className="absolute inset-0 bg-[#00a884]/30 transition-all" style={{ width: `${pct}%` }} />
                                    <div className="relative flex justify-between">
                                      <span>{opt}</span>
                                      {totalVotes > 0 && <span className="text-xs opacity-70">{pct}%</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] opacity-50 mt-2">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
                          </div>
                        );
                      } catch { return <p className="text-[15px] break-words leading-relaxed">{msg.content}</p>; }
                    })()}
                    {msg.type === "CHAT" && msg.content?.startsWith("__CONTACT__") && (() => {
                      try {
                        const c = JSON.parse(msg.content!.slice(11));
                        return (
                          <div className="min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2">
                              <Contact className="w-4 h-4 text-[#009de2]" />
                              <span className="text-xs font-medium opacity-70">CONTACT</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#009de2] flex items-center justify-center text-white font-bold text-lg">
                                {c.name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                <p className="text-xs opacity-70">{c.phone}</p>
                              </div>
                            </div>
                          </div>
                        );
                      } catch { return <p className="text-[15px] break-words leading-relaxed">{msg.content}</p>; }
                    })()}
                    {msg.type === "CHAT" && msg.content?.startsWith("__EVENT__") && (() => {
                      try {
                        const ev = JSON.parse(msg.content!.slice(9));
                        return (
                          <div className="min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarDays className="w-4 h-4 text-[#00a884]" />
                              <span className="text-xs font-medium opacity-70">EVENT</span>
                            </div>
                            <p className="font-medium text-sm mb-1">{ev.title}</p>
                            <div className="space-y-1 text-xs opacity-80">
                              <p>{new Date(ev.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}{ev.time ? ` at ${ev.time}` : ""}</p>
                              {ev.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</p>}
                            </div>
                          </div>
                        );
                      } catch { return <p className="text-[15px] break-words leading-relaxed">{msg.content}</p>; }
                    })()}
                    {msg.type === "CHAT" && !msg.content?.startsWith("__POLL__") && !msg.content?.startsWith("__CONTACT__") && !msg.content?.startsWith("__EVENT__") && (
                      <p className="text-[15px] break-words leading-relaxed">{msg.content}</p>
                    )}
                    {msg.type === "FILE" && msg.fileContent && (
                      msg.fileType?.startsWith("image/") ? (
                        <img
                          src={`data:${msg.fileType};base64,${msg.fileContent}`}
                          alt="Shared"
                          className="max-w-full rounded-xl max-h-72 object-contain"
                        />
                      ) : msg.fileType === "application/pdf" ? (
                        <a
                          href={`data:${msg.fileType};base64,${msg.fileContent}`}
                          download="file.pdf"
                          className="flex items-center gap-2 bg-[#1a2332] rounded-lg px-3 py-2 hover:bg-[#233040] transition"
                        >
                          <File className="w-8 h-8 text-[#ff5252]" />
                          <div>
                            <p className="text-white text-sm font-medium">PDF Document</p>
                            <p className="text-[#8696a0] text-xs">Tap to download</p>
                          </div>
                        </a>
                      ) : msg.fileType?.startsWith("video/") ? (
                        <video
                          src={`data:${msg.fileType};base64,${msg.fileContent}`}
                          controls
                          className="max-w-full rounded-xl max-h-72"
                        />
                      ) : (
                        <a
                          href={`data:${msg.fileType};base64,${msg.fileContent}`}
                          download="file"
                          className="flex items-center gap-2 bg-[#1a2332] rounded-lg px-3 py-2 hover:bg-[#233040] transition"
                        >
                          <File className="w-8 h-8 text-[#7c94ff]" />
                          <div>
                            <p className="text-white text-sm font-medium">File</p>
                            <p className="text-[#8696a0] text-xs">Tap to download</p>
                          </div>
                        </a>
                      )
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <span
                        className={`text-[11px] ${isOwn ? "text-[#99b0a6]" : "text-[#8696a0]"
                          }`}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                      {/* Checkmarks for own messages */}
                      {isOwn && (
                        <span className="ml-1">
                          {isRead ? (
                            <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                          ) : (
                            <CheckCheck className="w-4 h-4 text-[#99b0a6]" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))
          }
        </div>

        {/* Emoji picker */}
        {showEmoji && (
          <div className="border-t border-[#2a3942] bg-[#1f2c34] p-3 animate-fade-in">
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
              {EMOJI_LIST.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-[#2a3942] transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="bg-[#1a2332] border-t border-[#2a3942] flex flex-col"
        >
          {replyToMessage && (
            <div className="px-4 py-2 bg-[#1f2c34] border-l-4 border-[#00a884] flex items-center justify-between animate-fade-in relative z-10">
              <div className="overflow-hidden">
                <div className="text-[#00a884] text-sm font-medium mb-0.5">
                  Replying to {replyToMessage.sender === myMobile ? "yourself" : replyToMessage.sender}
                </div>
                <div className="text-[#8696a0] text-sm truncate">
                  {replyToMessage.content || "Media"}
                </div>
              </div>
              <button onClick={handleCancelReply} className="p-1 rounded-full bg-[#374248] text-[#8696a0]">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="p-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              className="p-2.5 rounded-full text-[#8696a0] hover:bg-[#2a3942] hover:text-[#00a884] transition"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => { setShowAttachMenu((s) => !s); setShowEmoji(false); }}
                className="p-2.5 rounded-full text-[#8696a0] hover:bg-[#2a3942] hover:text-[#00a884] transition"
                title="Attach"
              >
                <Plus className={`w-5 h-5 transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-[#233138] rounded-xl shadow-xl border border-[#2a3942] py-2 w-52 z-50 animate-fade-in">
                  <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a3942] cursor-pointer transition text-white text-sm">
                    <File className="w-5 h-5 text-[#7c94ff]" />
                    File
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => { handleFileUpload(e); setShowAttachMenu(false); }}
                      className="hidden"
                      disabled={!connected || sendingFile}
                    />
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a3942] cursor-pointer transition text-white text-sm">
                    <Image className="w-5 h-5 text-[#bf59cf]" />
                    Photos & Videos
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*,video/*"
                      onChange={(e) => { handleFileUpload(e); setShowAttachMenu(false); }}
                      className="hidden"
                      disabled={!connected || sendingFile}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowContactModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a3942] w-full text-left transition text-white text-sm"
                  >
                    <Contact className="w-5 h-5 text-[#009de2]" />
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowPollModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a3942] w-full text-left transition text-white text-sm"
                  >
                    <BarChart3 className="w-5 h-5 text-[#ffbc38]" />
                    Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowEventModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a3942] w-full text-left transition text-white text-sm"
                  >
                    <CalendarDays className="w-5 h-5 text-[#00a884]" />
                    Event
                  </button>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type a message"
              className="flex-1 bg-[#2a3942] border border-[#2a3942] rounded-2xl px-4 py-2.5 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 focus:border-[#00a884] text-[15px]"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!connected || !inputMessage.trim()}
              className="p-2.5 rounded-full bg-[#00a884] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#06cf9c] hover:scale-105 active:scale-95 transition shadow-lg shadow-[#00a884]/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        {sendingFile && (
          <p className="text-center text-xs text-[#8696a0] py-1">Sending…</p>
        )}
      </div>

      {/* Profile Modal */}
      {viewingProfile && otherMobile && (
        <ProfileModal
          mobile={otherMobile}
          onClose={() => setViewingProfile(false)}
        />
      )}

      {/* Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowPollModal(false)}>
          <div className="bg-[#1f2c34] rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#ffbc38]" />Create Poll</h3>
              <button onClick={() => setShowPollModal(false)} className="text-[#8696a0] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 mb-4 placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm"
              autoFocus
            />
            <p className="text-[#8696a0] text-xs mb-2">Options</p>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  value={opt}
                  onChange={e => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-2.5 placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm"
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-[#8696a0] hover:text-red-400"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-[#00a884] text-sm hover:underline mb-4">+ Add option</button>
            )}
            <button
              onClick={handleSendPoll}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="w-full bg-[#00a884] text-white rounded-lg py-3 mt-2 font-medium hover:bg-[#06cf9c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Poll
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowContactModal(false)}>
          <div className="bg-[#1f2c34] rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2"><Contact className="w-5 h-5 text-[#009de2]" />Share Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-[#8696a0] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 mb-3 placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm"
              autoFocus
            />
            <input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 mb-4 placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm"
            />
            <button
              onClick={handleSendContact}
              disabled={!contactName.trim() || !contactPhone.trim()}
              className="w-full bg-[#00a884] text-white rounded-lg py-3 font-medium hover:bg-[#06cf9c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Contact
            </button>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowEventModal(false)}>
          <div className="bg-[#1f2c34] rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-[#00a884]" />Create Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-[#8696a0] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="Event title"
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 mb-3 placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm"
              autoFocus
            />
            <div className="flex gap-3 mb-3">
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm [color-scheme:dark]"
              />
              <input
                type="time"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
                className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm [color-scheme:dark]"
              />
            </div>
            <input
              value={eventLocation}
              onChange={e => setEventLocation(e.target.value)}
              placeholder="Location (optional)"
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 mb-4 placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 text-sm"
            />
            <button
              onClick={handleSendEvent}
              disabled={!eventTitle.trim() || !eventDate}
              className="w-full bg-[#00a884] text-white rounded-lg py-3 font-medium hover:bg-[#06cf9c] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Event
            </button>
          </div>
        </div>
      )}
    </>
  );
}

