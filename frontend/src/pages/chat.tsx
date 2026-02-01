import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, Sun, Moon, Smile, Paperclip, Send } from "lucide-react";
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

  const messageAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingSentRef = useRef<boolean>(false);

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

    return (
      <li
        key={index}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } mb-4 animate-fade-in`}
      >
        <div
          className={`max-w-[80%] ${
            isOwnMessage
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
          } rounded-2xl px-4 py-3 shadow-md`}
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

          {message.type === "CHAT" && (
            <p className="text-sm">{message.content}</p>
          )}

          {message.type === "FILE" && message.fileContent && (
            <img
              src={`data:${message.fileType};base64,${message.fileContent}`}
              alt="Shared file"
              className="max-w-full rounded-lg mt-2"
            />
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
            {messages.map((message, index) => renderMessage(message, index))}
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
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 ltext-black"
              disabled={!connected}
            />

            <label className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={!connected}
              />
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </label>

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
    </>
  );
}
