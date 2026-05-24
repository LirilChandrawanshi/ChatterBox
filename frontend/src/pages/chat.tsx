import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, Sun, Moon, Paperclip, Send, Trash2, X, File, Image, Contact, BarChart3, CalendarDays, Plus, MapPin } from "lucide-react";
import { wsService, ChatMessage } from "@/services/websocket";

export default function Chat() {
  const router = useRouter();
  const { username } = router.query;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
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

  const messageAreaRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingSentRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressHandledRef = useRef(false);
  const LONG_PRESS_MS = 500;

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return;

    if (!username || typeof username !== "string") {
      router.push("/");
      return;
    }

    // Check for dark mode preference
    if (typeof window !== "undefined") {
      const isDark = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
    }

    // Fetch message history from API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${apiUrl}/api/messages?limit=50`)
      .then((res) => (res.ok ? res.json() : []))
      .then((history: ChatMessage[]) => setMessages(history || []))
      .catch(() => {});

    // Connect to WebSocket
    console.log("Connecting to WebSocket as:", username);
    wsService.connect(
      username,
      () => {
        console.log("WebSocket connected successfully");
        setConnected(true);
        setConnecting(false);
        setConnectionError("");
      },
      (error) => {
        console.error("WebSocket connection error:", error);
        setConnecting(false);
        setConnectionError(
          "Could not connect to chat server. Make sure backend is running on port 8080."
        );
      }
    );

    // Listen for messages
    wsService.onMessage((message) => {
      // Handle typing indicators (don't add to messages)
      if (message.type === "TYPING") {
        if (message.sender !== username) {
          setTypingUsers((prev) => new Set(prev).add(message.sender));
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(message.sender);
              return newSet;
            });
          }, 3000);
        }
        // Don't add typing messages to chat
        return;
      }

      // Handle bulk delete broadcast: remove deleted message ids from local state
      if (message.type === "DELETED" && message.messageIds?.length) {
        setMessages((prev) =>
          prev.filter((m) => !message.messageIds!.includes(m.id!))
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          message.messageIds!.forEach((id) => next.delete(id));
          return next;
        });
        setSelectionMode((mode) => (mode ? false : mode));
        return;
      }

      // Add all other messages (CHAT, JOIN, LEAVE, FILE) to the chat
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      wsService.disconnect();
    };
  }, [username, router, router.isReady]);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && connected) {
      wsService.sendMessage(inputMessage.trim());
      setInputMessage("");

      // Reset typing indicator
      isTypingSentRef.current = false;
      if (sendTypingTimeoutRef.current)
        clearTimeout(sendTypingTimeoutRef.current);
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);

    // Send typing indicator (throttled - only once every 3 seconds)
    if (value.trim() && connected && !isTypingSentRef.current) {
      wsService.sendTyping();
      isTypingSentRef.current = true;

      // Reset after 3 seconds
      if (sendTypingTimeoutRef.current)
        clearTimeout(sendTypingTimeoutRef.current);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];
        wsService.sendFile(base64Data, file.type);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("File size exceeds 5MB limit.");
    }
    e.target.value = "";
  };

  const handleSendPoll = () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!q || opts.length < 2 || !connected) return;
    const pollData = JSON.stringify({ question: q, options: opts, votes: {} });
    wsService.sendMessage(`__POLL__${pollData}`);
    setShowPollModal(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handleVotePoll = (msgId: string, optionIndex: number) => {
    if (!connected) return;
    const voteData = JSON.stringify({ pollMessageId: msgId, optionIndex, voter: username });
    wsService.sendMessage(`__POLL_VOTE__${voteData}`);
  };

  const handleSendContact = () => {
    const name = contactName.trim();
    const phone = contactPhone.trim();
    if (!name || !phone || !connected) return;
    const contactData = JSON.stringify({ name, phone });
    wsService.sendMessage(`__CONTACT__${contactData}`);
    setShowContactModal(false);
    setContactName("");
    setContactPhone("");
  };

  const handleSendEvent = () => {
    const title = eventTitle.trim();
    if (!title || !eventDate || !connected) return;
    const eventData = JSON.stringify({ title, date: eventDate, time: eventTime, location: eventLocation.trim() });
    wsService.sendMessage(`__EVENT__${eventData}`);
    setShowEventModal(false);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
  };

  const getPollVotes = (pollMsgId: string): Record<number, string[]> => {
    const votes: Record<number, string[]> = {};
    messages.forEach(m => {
      if (m.content?.startsWith("__POLL_VOTE__")) {
        try {
          const v = JSON.parse(m.content.slice(13));
          if (v.pollMessageId === pollMsgId) {
            if (!votes[v.optionIndex]) votes[v.optionIndex] = [];
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", (!darkMode).toString());
  };

  const getAvatarColor = (sender: string) => {
    const colors = [
      "#2196F3",
      "#32c787",
      "#00BCD4",
      "#ff5652",
      "#ffc107",
      "#ff85af",
      "#FF9800",
      "#39bbb0",
    ];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = 31 * hash + sender.charCodeAt(i);
    }
    return colors[Math.abs(hash % colors.length)];
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDeletable = (message: ChatMessage) =>
    (message.type === "CHAT" || message.type === "FILE") && message.id;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllDeletable = () => {
    const ids = messages.filter(isDeletable).map((m) => m.id!);
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${apiUrl}/api/messages`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Array.from(selectedIds)),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id!)));
        setSelectedIds(new Set());
        setSelectionMode(false);
      }
    } catch {
      // ignore
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.sender === username;

    if (message.type === "JOIN" || message.type === "LEAVE") {
      const content =
        message.type === "JOIN"
          ? `${message.sender} joined!`
          : `${message.sender} left!`;
      return (
        <li key={index} className="flex justify-center my-2">
          <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-sm italic">
            {content}
          </div>
        </li>
      );
    }

    const canDelete = isDeletable(message);
    const isSelected = message.id && selectedIds.has(message.id);
    const showCheckbox = selectionMode && canDelete;

    const startLongPress = () => {
      if (!canDelete || !message.id) return;
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressHandledRef.current = true;
        setSelectionMode(true);
        setSelectedIds((prev) => new Set(prev).add(message.id!));
      }, LONG_PRESS_MS);
    };

    const cancelLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleBubbleClick = () => {
      if (!selectionMode || !canDelete || !message.id) return;
      if (longPressHandledRef.current) {
        longPressHandledRef.current = false;
        return;
      }
      toggleSelect(message.id);
    };

    return (
      <li
        key={message.id ?? `idx-${index}`}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } mb-4 animate-fade-in group`}
      >
        {showCheckbox && (
          <label
            className="flex items-center mr-2 self-center cursor-pointer shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={() => message.id && toggleSelect(message.id)}
              className="w-4 h-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500"
            />
          </label>
        )}
        <div
          role="button"
          tabIndex={0}
          className={`max-w-[80%] select-none ${
            isSelected ? "ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900" : ""
          } ${
            isOwnMessage
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
          } rounded-2xl px-4 py-3 shadow-md active:opacity-90 ${
            canDelete ? "cursor-pointer" : ""
          }`}
          onClick={handleBubbleClick}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onContextMenu={(e) => {
            if (canDelete) e.preventDefault();
          }}
        >
          <div className="flex items-center mb-1">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2"
              style={{ backgroundColor: getAvatarColor(message.sender) }}
            >
              {message.sender[0].toUpperCase()}
            </span>
            <span className="font-semibold text-sm">{message.sender}</span>
          </div>

          {message.type === "CHAT" && message.content?.startsWith("__POLL__") && (() => {
            try {
              const poll = JSON.parse(message.content!.slice(8));
              const votes = getPollVotes(message.id!);
              const totalVotes = Object.values(votes).reduce((s, arr) => s + arr.length, 0);
              const myVoteOption = Object.entries(votes).find(([, voters]) => voters.includes(username as string))?.[0];
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
                          onClick={(e) => { e.stopPropagation(); handleVotePoll(message.id!, i); }}
                          className={`w-full text-left rounded-lg px-3 py-2 text-sm relative overflow-hidden transition ${isMyVote ? "ring-2 ring-blue-400" : "hover:opacity-80"}`}
                          style={{ background: isOwnMessage ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)" }}
                        >
                          <div className="absolute inset-0 bg-blue-400/30 transition-all" style={{ width: `${pct}%` }} />
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
            } catch { return <p className="text-sm">{message.content}</p>; }
          })()}

          {message.type === "CHAT" && message.content?.startsWith("__CONTACT__") && (() => {
            try {
              const c = JSON.parse(message.content!.slice(11));
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
            } catch { return <p className="text-sm">{message.content}</p>; }
          })()}

          {message.type === "CHAT" && message.content?.startsWith("__EVENT__") && (() => {
            try {
              const ev = JSON.parse(message.content!.slice(9));
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
            } catch { return <p className="text-sm">{message.content}</p>; }
          })()}

          {message.type === "CHAT" && !message.content?.startsWith("__POLL__") && !message.content?.startsWith("__CONTACT__") && !message.content?.startsWith("__EVENT__") && (
            <p className="text-sm">{message.content}</p>
          )}

          {message.type === "FILE" && message.fileContent && (
            message.fileType?.startsWith("image/") ? (
              <img
                src={`data:${message.fileType};base64,${message.fileContent}`}
                alt="Shared file"
                className="max-w-full rounded-lg mt-2"
              />
            ) : message.fileType === "application/pdf" ? (
              <a
                href={`data:${message.fileType};base64,${message.fileContent}`}
                download="file.pdf"
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mt-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <File className="w-8 h-8 text-[#ff5252]" />
                <div>
                  <p className="text-gray-800 dark:text-white text-sm font-medium">PDF Document</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Tap to download</p>
                </div>
              </a>
            ) : message.fileType?.startsWith("video/") ? (
              <video
                src={`data:${message.fileType};base64,${message.fileContent}`}
                controls
                className="max-w-full rounded-lg mt-2 max-h-72"
              />
            ) : (
              <a
                href={`data:${message.fileType};base64,${message.fileContent}`}
                download="file"
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mt-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <File className="w-8 h-8 text-[#7c94ff]" />
                <div>
                  <p className="text-gray-800 dark:text-white text-sm font-medium">File</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Tap to download</p>
                </div>
              </a>
            )
          )}

          <div
            className={`text-xs mt-1 ${
              isOwnMessage
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </li>
    );
  };

  if (!username) return null;

  return (
    <>
      <Head>
        <title>ChatterBox - Chat Room</title>
      </Head>

      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="mr-3 hover:bg-white/20 p-2 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">ChatterBox</h2>
          </div>

          <button
            onClick={toggleDarkMode}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Connecting indicator */}
        {connecting && !connectionError && (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-center text-sm">
            Connecting to chat server...
          </div>
        )}

        {/* Selection toolbar (WhatsApp-style: shown when in selection mode) */}
        {selectionMode && (
          <div className="bg-blue-100 dark:bg-blue-900/50 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {selectedIds.size} message{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllDeletable}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete selected
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                title="Cancel"
              >
                <X className="w-4 h-4 text-blue-800 dark:text-blue-200" />
              </button>
            </div>
          </div>
        )}

        {/* Connection error */}
        {connectionError && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 text-center text-sm">
            {connectionError}
            <button
              onClick={() => window.location.reload()}
              className="ml-3 underline hover:font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          ref={messageAreaRef}
          className="flex-1 overflow-y-auto px-4 py-6 space-y-2"
        >
          <ul>
            {messages.filter(m => !m.content?.startsWith("__POLL_VOTE__")).map((msg, index) => renderMessage(msg, index))}
          </ul>
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 italic">
            {Array.from(typingUsers).join(", ")}{" "}
            {typingUsers.size > 1 ? "are" : "is"} typing...
          </div>
        )}

        {/* Input form */}
        <form
          onSubmit={handleSendMessage}
          className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: getAvatarColor(username as string) }}
            >
              {(username as string)[0].toUpperCase()}
            </div>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-black"
              disabled={!connected}
            />

            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setShowAttachMenu((s) => !s)}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition"
                title="Attach"
              >
                <Plus className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
              </button>

              {showAttachMenu && (
                <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 w-52 z-50">
                  <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition text-gray-800 dark:text-white text-sm">
                    <File className="w-5 h-5 text-[#7c94ff]" />
                    File
                    <input
                      type="file"
                      onChange={(e) => { handleFileUpload(e); setShowAttachMenu(false); }}
                      className="hidden"
                      disabled={!connected}
                    />
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition text-gray-800 dark:text-white text-sm">
                    <Image className="w-5 h-5 text-[#bf59cf]" />
                    Photos & Videos
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => { handleFileUpload(e); setShowAttachMenu(false); }}
                      className="hidden"
                      disabled={!connected}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowContactModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition text-gray-800 dark:text-white text-sm"
                  >
                    <Contact className="w-5 h-5 text-[#009de2]" />
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowPollModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition text-gray-800 dark:text-white text-sm"
                  >
                    <BarChart3 className="w-5 h-5 text-[#ffbc38]" />
                    Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAttachMenu(false); setShowEventModal(true); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left transition text-gray-800 dark:text-white text-sm"
                  >
                    <CalendarDays className="w-5 h-5 text-[#00a884]" />
                    Event
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!connected || !inputMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowPollModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#ffbc38]" />Create Poll</h3>
              <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-4 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              autoFocus
            />
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Options</p>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  value={opt}
                  onChange={e => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-blue-500 text-sm hover:underline mb-4">+ Add option</button>
            )}
            <button
              onClick={handleSendPoll}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="w-full bg-blue-500 text-white rounded-lg py-3 mt-2 font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Poll
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowContactModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg flex items-center gap-2"><Contact className="w-5 h-5 text-[#009de2]" />Share Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-3 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              autoFocus
            />
            <input
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-4 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
            <button
              onClick={handleSendContact}
              disabled={!contactName.trim() || !contactPhone.trim()}
              className="w-full bg-blue-500 text-white rounded-lg py-3 font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Contact
            </button>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowEventModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-[#00a884]" />Create Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="Event title"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-3 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              autoFocus
            />
            <div className="flex gap-3 mb-3">
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm dark:[color-scheme:dark]"
              />
              <input
                type="time"
                value={eventTime}
                onChange={e => setEventTime(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm dark:[color-scheme:dark]"
              />
            </div>
            <input
              value={eventLocation}
              onChange={e => setEventLocation(e.target.value)}
              placeholder="Location (optional)"
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-4 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            />
            <button
              onClick={handleSendEvent}
              disabled={!eventTitle.trim() || !eventDate}
              className="w-full bg-blue-500 text-white rounded-lg py-3 font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Event
            </button>
          </div>
        </div>
      )}
    </>
  );
}
