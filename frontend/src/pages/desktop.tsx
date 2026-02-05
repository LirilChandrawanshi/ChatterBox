import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MessageCircle, Plus, User, Trash2, X, ArrowLeft, Paperclip, Smile, Send, Search, Check, CheckCheck, Camera, LogOut, Settings, Pencil, Lightbulb, Sparkles, Reply } from "lucide-react";
import {
    getConversations,
    getOnlineMobiles,
    getOrCreateConversation,
    getProfilePicture,
    deleteConversation,
    deleteMessages,
    getMessages,
    sendMessage as apiSendMessage,
    sendFileMessage as apiSendFileMessage,
    getConversation,
    updateDisplayName,
    updateProfilePicture,
    clearToken,
    type ConversationSummary,
} from "@/services/api";
import { getStoredUser, setStoredUser } from "./index";
import { wsService, type ChatMessage } from "@/services/websocket";
import { getEmojiList } from "@/utils/emojis";
import DesktopLayout from "@/components/DesktopLayout";
import BottomNav from "@/components/BottomNav";

const EMOJI_LIST = getEmojiList();

export default function DesktopChats() {
    const router = useRouter();
    const { mobile: queryMobile, chatId } = router.query;
    const stored = getStoredUser();
    const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");
    const selectedChatId = typeof chatId === "string" ? chatId : null;

    // Chat list state
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [onlineMobiles, setOnlineMobiles] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [newContactMobile, setNewContactMobile] = useState("");
    const [newChatError, setNewChatError] = useState("");
    const [creating, setCreating] = useState(false);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const displayName = stored?.displayName ?? myMobile;

    // Selection mode
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);

    // Chat view state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState("");
    const [otherName, setOtherName] = useState("");
    const [otherMobile, setOtherMobile] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [sendingFile, setSendingFile] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());

    // Message selection & Reply state
    const [messageSelectionMode, setMessageSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
    const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);

    const messageAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingSentRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings state
    const [showSettings, setShowSettings] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editableName, setEditableName] = useState(displayName);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Load conversations
    useEffect(() => {
        if (!router.isReady) return;
        if (!myMobile) {
            router.replace("/");
            return;
        }
        getConversations(myMobile).then(setConversations);
        getOnlineMobiles().then((list) => setOnlineMobiles(new Set(list)));
        getProfilePicture(myMobile).then((pic) => {
            if (pic) setProfilePicture(pic);
        }).catch(() => { });
        const t = setInterval(() => getOnlineMobiles().then((list) => setOnlineMobiles(new Set(list))), 10000);
        setLoading(false);
        return () => clearInterval(t);
    }, [router.isReady, myMobile]);

    // Refresh conversations periodically
    useEffect(() => {
        if (!myMobile) return;
        const interval = setInterval(() => {
            getConversations(myMobile).then(setConversations);
        }, 5000);
        return () => clearInterval(interval);
    }, [myMobile]);

    // Load selected chat
    useEffect(() => {
        if (!selectedChatId || !myMobile) return;
        setConnecting(true);
        getConversation(selectedChatId, myMobile).then((data) => {
            if (data) {
                setOtherName(data.otherParticipantName);
                setOtherMobile(data.otherParticipantMobile);
            }
        });
        getMessages(selectedChatId, myMobile).then((list) =>
            setMessages(list as ChatMessage[])
        );
    }, [selectedChatId, myMobile]);

    // WebSocket connection
    useEffect(() => {
        if (!myMobile || !selectedChatId) return;
        wsService.connect(
            myMobile,
            () => {
                setConnected(true);
                setConnecting(false);
                setConnectionError("");
                wsService.sendReadReceipt(selectedChatId);
            },
            () => {
                setConnecting(false);
                setConnectionError("Could not connect");
            }
        );
        const handler = (message: ChatMessage) => {
            if (message.conversationId !== selectedChatId) return;
            if (message.type === "TYPING" && message.sender !== myMobile) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                return;
            }
            if (message.type === "READ" && message.sender !== myMobile) {
                setReadMessageIds((prev) => {
                    const next = new Set(prev);
                    messages.forEach((m) => {
                        if (m.sender === myMobile && m.id) next.add(m.id);
                    });
                    return next;
                });
                return;
            }
            if (message.type === "CHAT" || message.type === "FILE") {
                setMessages((prev) => [...prev, message]);
                if (message.sender !== myMobile && connected) {
                    wsService.sendReadReceipt(selectedChatId);
                }
            }
        };
        wsService.onMessage(handler);
        return () => wsService.disconnect();
    }, [myMobile, selectedChatId, messages, connected]);

    // Scroll to bottom
    useEffect(() => {
        if (messageAreaRef.current) {
            messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const formatTime = (ts?: number) => {
        if (!ts) return "";
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (days === 1) return "Yesterday";
        if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const handleNewChat = async (e: FormEvent) => {
        e.preventDefault();
        const contactMobile = newContactMobile.trim().replace(/[^0-9+]/g, "");
        if (!contactMobile || contactMobile.length < 5) {
            setNewChatError("Enter a valid mobile number");
            return;
        }
        if (contactMobile === myMobile) {
            setNewChatError("You can't chat with yourself");
            return;
        }
        setCreating(true);
        setNewChatError("");
        try {
            const conv = await getOrCreateConversation(myMobile, contactMobile);
            if (conv?.id) {
                setShowNewChat(false);
                setNewContactMobile("");
                router.push(`/desktop?mobile=${encodeURIComponent(myMobile)}&chatId=${conv.id}`);
            } else {
                setNewChatError("Could not create conversation");
            }
        } catch {
            setNewChatError("Failed to start chat");
        }
        setCreating(false);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(conversations.map((c) => c.id)));
    const clearSelection = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        setDeleting(true);
        for (const id of Array.from(selectedIds)) {
            await deleteConversation(id, myMobile);
        }
        setConversations((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        clearSelection();
        setDeleting(false);
        if (selectedChatId && selectedIds.has(selectedChatId)) {
            router.push(`/desktop?mobile=${encodeURIComponent(myMobile)}`);
        }
    };

    const handleChatClick = (conv: ConversationSummary) => {
        if (selectionMode) {
            toggleSelect(conv.id);
        } else {
            router.push(`/desktop?mobile=${encodeURIComponent(myMobile)}&chatId=${conv.id}`, undefined, { shallow: true });
        }
    };

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        const text = inputMessage.trim();
        if (!text || !selectedChatId || !myMobile || !connected) return;
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
            await apiSendMessage(selectedChatId, myMobile, text, replyTo);
        } catch {
            setInputMessage(text);
        }
    };

    const handleInputChange = (value: string) => {
        setInputMessage(value);
        if (value.trim() && connected && !isTypingSentRef.current && selectedChatId) {
            wsService.sendTypingToConversation(selectedChatId);
            isTypingSentRef.current = true;
            if (sendTypingTimeoutRef.current) clearTimeout(sendTypingTimeoutRef.current);
            sendTypingTimeoutRef.current = setTimeout(() => {
                isTypingSentRef.current = false;
            }, 3000);
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setInputMessage((prev) => prev + emoji);
        inputRef.current?.focus();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChatId || !myMobile || !connected) return;
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
                await apiSendFileMessage(selectedChatId, myMobile, base64, file.type);
            } catch {
                alert("Failed to send file.");
            }
            setSendingFile(false);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const getAvatarColor = (sender: string) => {
        const colors = ["#00a884", "#128c7e", "#25d366", "#34b7f1", "#667eea", "#764ba2", "#f093fb", "#4facfe"];
        let hash = 0;
        for (let i = 0; i < sender.length; i++) hash = 31 * hash + sender.charCodeAt(i);
        return colors[Math.abs(hash % colors.length)];
    };

    const filteredConversations = conversations.filter((conv) => {
        const name = conv.otherParticipantName ?? conv.otherParticipantMobile ?? "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Settings handlers
    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleSaveName = async () => {
        if (!editableName.trim() || editableName.trim() === displayName) {
            setIsEditingName(false);
            return;
        }
        setIsSavingName(true);
        try {
            await updateDisplayName(myMobile, editableName.trim());
            setStoredUser(myMobile, editableName.trim());
            showSuccess("Name updated!");
        } catch {
            setStoredUser(myMobile, editableName.trim());
            showSuccess("Name updated locally!");
        } finally {
            setIsSavingName(false);
            setIsEditingName(false);
        }
    };

    const handlePictureChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        if (file.size > 5 * 1024 * 1024) return;

        setIsUploadingPicture(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setProfilePicture(base64);
            try {
                await updateProfilePicture(myMobile, base64);
                showSuccess("Picture updated!");
            } catch {
                showSuccess("Picture updated locally!");
            }
            setIsUploadingPicture(false);
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = () => {
        localStorage.removeItem("chatterbox_user");
        clearToken();
        router.push("/");
    };

    // Message selection handlers
    const toggleMessageSelection = (msgId: string) => {
        if (!messageSelectionMode) return;
        setSelectedMessageIds((prev) => {
            const next = new Set(prev);
            if (next.has(msgId)) {
                next.delete(msgId);
                if (next.size === 0) setMessageSelectionMode(false);
            } else {
                next.add(msgId);
            }
            return next;
        });
    };

    const cancelMessageSelection = () => {
        setMessageSelectionMode(false);
        setSelectedMessageIds(new Set());
    };

    const handleDeleteSelectedMessages = async () => {
        if (confirm(`Delete ${selectedMessageIds.size} messages?`)) {
            const ids = Array.from(selectedMessageIds);
            const success = await deleteMessages(ids);
            if (success) {
                setMessages((prev) => prev.filter((m) => !selectedMessageIds.has(m.id!)));
                cancelMessageSelection();
            }
        }
    };

    const handleReplyAction = () => {
        if (selectedMessageIds.size !== 1) return;
        const msgId = Array.from(selectedMessageIds)[0];
        const msg = messages.find((m) => m.id === msgId);
        if (msg) {
            setReplyToMessage(msg);
            cancelMessageSelection();
            inputRef.current?.focus();
        }
    };

    const handleCancelReply = () => {
        setReplyToMessage(null);
    };

    if (!myMobile) return null;

    // Sidebar component
    const Sidebar = (
        <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={() => setShowSettings(true)}
                        className="flex items-center gap-3 hover:opacity-80 transition"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center text-white ring-2 ring-transparent hover:ring-[#00a884]/50 transition">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-white font-medium text-sm">{displayName}</p>
                            <p className="text-[#8696a0] text-xs">{myMobile}</p>
                        </div>
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-[#00a884] transition"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowNewChat(true)}
                            className="p-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-[#00a884] transition"
                            title="New chat"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats"
                        className="w-full bg-[#202c33] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/50"
                    />
                </div>
            </div>

            {/* Selection toolbar */}
            {selectionMode && (
                <div className="px-4 py-2 bg-[#1f2c34] border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm text-white">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-2">
                        <button onClick={selectAll} className="text-xs px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition">
                            All
                        </button>
                        <button
                            onClick={handleDeleteSelected}
                            disabled={selectedIds.size === 0 || deleting}
                            className="text-xs px-2 py-1 rounded bg-red-500/80 text-white hover:bg-red-600 transition disabled:opacity-50"
                        >
                            {deleting ? "..." : <Trash2 className="w-3 h-3" />}
                        </button>
                        <button onClick={clearSelection} className="p-1 rounded hover:bg-white/10 transition">
                            <X className="w-4 h-4 text-[#8696a0]" />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-[#8696a0] text-center text-sm">Loading…</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-6 text-center">
                        <MessageCircle className="w-12 h-12 mx-auto text-[#8696a0]/30 mb-3" />
                        <p className="text-[#8696a0] text-sm">No chats yet</p>
                    </div>
                ) : (
                    <ul>
                        {filteredConversations.map((conv) => {
                            const convOtherMobile = conv.otherParticipantMobile ?? (conv.participant1 === myMobile ? conv.participant2 : conv.participant1);
                            const name = conv.otherParticipantName ?? convOtherMobile;
                            const isOnline = onlineMobiles.has(convOtherMobile);
                            const isSelected = selectedIds.has(conv.id);
                            const isActive = conv.id === selectedChatId;
                            return (
                                <li key={conv.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleChatClick(conv)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setSelectionMode(true);
                                            setSelectedIds((prev) => new Set(prev).add(conv.id));
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isActive
                                            ? "bg-[#00a884]/20 border-r-2 border-[#00a884]"
                                            : isSelected
                                                ? "bg-white/5"
                                                : "hover:bg-white/5"
                                            }`}
                                    >
                                        {selectionMode && (
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "bg-[#00a884] border-[#00a884]" : "border-[#8696a0]"
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                        <div className="relative shrink-0">
                                            <div
                                                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold"
                                                style={{ backgroundColor: getAvatarColor(convOtherMobile) }}
                                            >
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] border-2 border-[#111827]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-white text-sm truncate">{name}</p>
                                                <span className="text-[10px] text-[#8696a0]">{formatTime(conv.lastMessageAt)}</span>
                                            </div>
                                            <p className="text-xs text-[#8696a0] truncate">{conv.lastMessagePreview || "No messages yet"}</p>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );

    // Main chat panel
    const MainPanel = selectedChatId ? (
        <div className="flex flex-col h-full">
            {/* Chat header OR Action Bar */}
            {messageSelectionMode ? (
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#1f2c34]">
                    <div className="flex items-center gap-4">
                        <button onClick={cancelMessageSelection} className="p-2 -ml-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                        <span className="text-white font-semibold">{selectedMessageIds.size} selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedMessageIds.size === 1 && (
                            <button onClick={handleReplyAction} className="p-2 rounded-full text-white hover:bg-white/10 transition" title="Reply">
                                <Reply className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={handleDeleteSelectedMessages} className="p-2 rounded-full text-white hover:bg-white/10 transition hover:text-red-400" title="Delete">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 bg-[#111827]/50">
                    <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: getAvatarColor(otherMobile || "?") }}
                    >
                        {(otherName || otherMobile || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white font-semibold">{otherName || otherMobile || "Chat"}</h2>
                        <p className="text-xs text-[#8696a0]">
                            {isTyping ? (
                                <span className="text-[#00a884] animate-pulse">typing...</span>
                            ) : (
                                onlineMobiles.has(otherMobile) ? "Online" : "Offline"
                            )}
                        </p>
                    </div>
                </div>
            )}

            {connectionError && (
                <div className="px-4 py-2 bg-red-500/20 text-red-300 text-sm text-center">{connectionError}</div>
            )}

            {/* Messages */}
            <div
                ref={messageAreaRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gradient-to-b from-transparent to-black/10"
            >
                {messages
                    .filter((m) => m.type === "CHAT" || m.type === "FILE")
                    .map((msg, index) => {
                        const isOwn = msg.sender === myMobile;
                        const isRead = msg.id && readMessageIds.has(msg.id);
                        return (
                            <div key={msg.id ?? `m-${index}`} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                <div
                                    onClick={() => messageSelectionMode ? toggleMessageSelection(msg.id!) : null}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setMessageSelectionMode(true);
                                        setSelectedMessageIds((prev) => new Set(prev).add(msg.id!));
                                    }}
                                    className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-lg cursor-pointer ${isOwn
                                        ? "bg-gradient-to-br from-[#00a884] to-[#008f72] text-white rounded-br-sm"
                                        : "bg-[#1f2c34] text-white rounded-bl-sm"
                                        } ${selectedMessageIds.has(msg.id!) ? "ring-2 ring-white/50 bg-opacity-80" : ""}`}
                                >
                                    {/* Quoted Reply */}
                                    {msg.replyToId && (
                                        <div className={`mb-2 rounded-lg p-2 text-sm border-l-4 ${isOwn ? "bg-black/20 border-white/50" : "bg-black/20 border-[#00a884]"}`}>
                                            <div className={`text-xs font-medium mb-1 ${isOwn ? "text-white/80" : "text-[#00a884]"}`}>
                                                {msg.replyToSender === myMobile ? "You" : msg.replyToSender || "Someone"}
                                            </div>
                                            <div className="truncate opacity-80">{msg.replyToContent || "Message"}</div>
                                        </div>
                                    )}
                                    {msg.type === "CHAT" && <p className="text-sm leading-relaxed">{msg.content}</p>}
                                    {msg.type === "FILE" && msg.fileContent && (
                                        <img
                                            src={`data:${msg.fileType};base64,${msg.fileContent}`}
                                            alt="Shared"
                                            className="max-w-full rounded-xl max-h-60 object-contain"
                                        />
                                    )}
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-[10px] opacity-70">{formatTime(msg.timestamp)}</span>
                                        {isOwn && (
                                            <span className="ml-1">
                                                {isRead ? <CheckCheck className="w-3.5 h-3.5 text-cyan-300" /> : <CheckCheck className="w-3.5 h-3.5 opacity-50" />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Emoji picker */}
            {showEmoji && (
                <div className="border-t border-white/5 bg-[#1f2c34] p-3">
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {EMOJI_LIST.map((emoji, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleEmojiClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-white/10 transition"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="bg-[#111827]/30 border-t border-white/5 flex flex-col">
                {replyToMessage && (
                    <div className="px-6 py-2 bg-[#1f2c34] border-l-4 border-[#00a884] flex items-center justify-between animate-fade-in relative z-10">
                        <div className="overflow-hidden">
                            <div className="text-[#00a884] text-sm font-medium mb-0.5">
                                Replying to {replyToMessage.sender === myMobile ? "yourself" : replyToMessage.sender}
                            </div>
                            <div className="text-[#8696a0] text-sm truncate">
                                {replyToMessage.content || "Media"}
                            </div>
                        </div>
                        <button type="button" onClick={handleCancelReply} className="p-1 rounded-full bg-[#374248] text-[#8696a0]">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="px-6 py-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowEmoji((s) => !s)}
                        className="p-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-[#00a884] transition"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <label className="p-2 rounded-full text-[#8696a0] hover:bg-white/10 hover:text-[#00a884] transition cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={!connected || sendingFile}
                        />
                        <Paperclip className="w-5 h-5" />
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#2a3942] border border-transparent rounded-2xl px-4 py-2.5 text-white text-sm placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/50"
                        disabled={!connected}
                    />
                    <button
                        type="submit"
                        disabled={!connected || !inputMessage.trim()}
                        className="p-2.5 rounded-full bg-[#00a884] text-white disabled:opacity-50 hover:bg-[#06cf9c] transition shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
            {sendingFile && <p className="text-center text-xs text-[#8696a0] py-1">Sending…</p>}
        </div>
    ) : (
        // Empty state when no chat selected
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#0d1117] to-[#161b22]">
            <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#667eea]/20 flex items-center justify-center mb-6">
                    <MessageCircle className="w-12 h-12 text-[#00a884]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">ChatterBox</h2>
                <p className="text-[#8696a0] max-w-xs mx-auto">
                    Select a conversation from the sidebar or start a new chat.
                </p>
            </div>
        </div>
    );

    return (
        <>
            <Head>
                <title>ChatterBox</title>
            </Head>

            {/* New chat modal */}
            {showNewChat && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-gradient-to-b from-[#1f2c34] to-[#1a2332] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-white/10">
                        <h2 className="text-xl font-semibold text-white mb-2">New chat</h2>
                        <p className="text-[#8696a0] text-sm mb-4">Enter the mobile number of the person you want to chat with.</p>
                        <form onSubmit={handleNewChat}>
                            <input
                                type="tel"
                                value={newContactMobile}
                                onChange={(e) => setNewContactMobile(e.target.value)}
                                placeholder="Mobile number"
                                className="w-full bg-[#2a3942] border border-transparent rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/50 mb-3"
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
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-[#8696a0] hover:bg-white/5 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2.5 rounded-xl bg-[#00a884] text-white hover:bg-[#06cf9c] disabled:opacity-50 transition"
                                >
                                    {creating ? "Starting…" : "Start chat"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-gradient-to-b from-[#1f2c34] to-[#1a2332] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Settings</h2>
                            <button
                                type="button"
                                onClick={() => setShowSettings(false)}
                                className="p-2 rounded-full hover:bg-white/10 transition"
                            >
                                <X className="w-5 h-5 text-[#8696a0]" />
                            </button>
                        </div>

                        {/* Success Toast */}
                        {successMessage && (
                            <div className="mb-4 bg-[#00a884] text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                <span className="text-sm">{successMessage}</span>
                            </div>
                        )}

                        {/* Profile Picture */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4">
                                <div
                                    className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center shadow-xl ring-4 ring-[#1f2c34] ${isUploadingPicture ? 'animate-pulse' : ''}`}
                                >
                                    {profilePicture ? (
                                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-white/80" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingPicture}
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white flex items-center justify-center shadow-lg transition disabled:opacity-50"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePictureChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Display Name */}
                            {isEditingName ? (
                                <div className="flex items-center gap-2 w-full max-w-xs">
                                    <input
                                        type="text"
                                        value={editableName}
                                        onChange={(e) => setEditableName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveName();
                                            if (e.key === "Escape") setIsEditingName(false);
                                        }}
                                        className="flex-1 bg-[#2a3942] border border-[#00a884] rounded-xl px-4 py-2 text-white text-center focus:outline-none"
                                        maxLength={50}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveName}
                                        disabled={isSavingName}
                                        className="p-2 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white disabled:opacity-50"
                                    >
                                        {isSavingName ? (
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditableName(displayName);
                                        setIsEditingName(true);
                                    }}
                                    className="flex items-center gap-2 group"
                                >
                                    <span className="text-lg font-semibold text-white">{displayName}</span>
                                    <Pencil className="w-4 h-4 text-[#8696a0] group-hover:text-[#00a884] transition" />
                                </button>
                            )}
                            <p className="text-[#8696a0] text-sm mt-1">{myMobile}</p>
                        </div>

                        {/* Logout Button */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full px-4 py-3 flex items-center justify-center gap-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Log out</span>
                        </button>
                    </div>
                </div>
            )}

            <DesktopLayout sidebar={Sidebar} main={MainPanel} showMain={!!selectedChatId} />
        </>
    );
}
