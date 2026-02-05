const getBase = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const AUTH_TOKEN_KEY = "chatterbox_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return h;
}

export interface User {
  id: string;
  mobile: string;
  displayName: string;
  createdAt: number;
}

export interface ConversationSummary {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt: number;
  lastMessagePreview: string | null;
  otherParticipantMobile?: string;
  otherParticipantName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function signup(
  mobile: string,
  displayName: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${getBase()}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobile: mobile.trim(),
      displayName: displayName.trim() || mobile.trim(),
      password,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Signup failed");
  return data as AuthResponse;
}

export async function login(mobile: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${getBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: mobile.trim(), password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Login failed");
  return data as AuthResponse;
}

export async function register(mobile: string, displayName: string): Promise<User> {
  const res = await fetch(`${getBase()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: mobile.trim(), displayName: displayName.trim() || mobile.trim() }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

/** Get current user: use Bearer token if present, else mobile query param */
export async function getMe(mobile?: string): Promise<User | null> {
  const url = mobile
    ? `${getBase()}/api/users/me?mobile=${encodeURIComponent(mobile)}`
    : `${getBase()}/api/users/me`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function getOnlineMobiles(): Promise<string[]> {
  const res = await fetch(`${getBase()}/api/users/online`);
  if (!res.ok) return [];
  return res.json();
}

export async function getConversations(mobile: string): Promise<ConversationSummary[]> {
  const res = await fetch(`${getBase()}/api/conversations?mobile=${encodeURIComponent(mobile)}`);
  if (!res.ok) return [];
  const list = await res.json();
  return list;
}

export async function getOrCreateConversation(
  myMobile: string,
  otherUserMobile: string
): Promise<ConversationSummary & { otherParticipantName: string; otherParticipantMobile: string }> {
  const res = await fetch(`${getBase()}/api/conversations?mobile=${encodeURIComponent(myMobile)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otherUserMobile: otherUserMobile.trim() }),
  });
  if (!res.ok) throw new Error("Failed to start conversation");
  return res.json();
}

export async function getConversation(
  id: string,
  mobile: string
): Promise<{ otherParticipantName: string; otherParticipantMobile: string } | null> {
  const res = await fetch(
    `${getBase()}/api/conversations/${id}?mobile=${encodeURIComponent(mobile)}`
  );
  if (!res.ok) return null;
  return res.json();
}

export interface ChatMessage {
  id?: string;
  type: string;
  content?: string;
  sender: string;
  conversationId?: string;
  timestamp?: number;
  fileContent?: string;
  fileType?: string;
  messageIds?: string[];
}

export async function getMessages(
  conversationId: string,
  mobile: string,
  limit = 50
): Promise<ChatMessage[]> {
  const res = await fetch(
    `${getBase()}/api/conversations/${conversationId}/messages?mobile=${encodeURIComponent(mobile)}&limit=${limit}`
  );
  if (!res.ok) return [];
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  mobile: string,
  content: string
): Promise<ChatMessage> {
  const res = await fetch(
    `${getBase()}/api/conversations/${conversationId}/messages?mobile=${encodeURIComponent(mobile)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    }
  );
  if (!res.ok) throw new Error("Send failed");
  return res.json();
}

export async function sendFileMessage(
  conversationId: string,
  mobile: string,
  fileContent: string,
  fileType: string
): Promise<ChatMessage> {
  const res = await fetch(
    `${getBase()}/api/conversations/${conversationId}/messages?mobile=${encodeURIComponent(mobile)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileContent, fileType }),
    }
  );
  if (!res.ok) throw new Error("Send failed");
  return res.json();
}

// Profile management functions
export async function updateDisplayName(mobile: string, newName: string): Promise<User> {
  const res = await fetch(`${getBase()}/api/users/profile?mobile=${encodeURIComponent(mobile)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ displayName: newName.trim() }),
  });
  if (!res.ok) throw new Error("Failed to update name");
  return res.json();
}

export async function updateProfilePicture(mobile: string, base64Image: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/users/profile/picture?mobile=${encodeURIComponent(mobile)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ picture: base64Image }),
  });
  if (!res.ok) throw new Error("Failed to update profile picture");
}

export async function getProfilePicture(mobile: string): Promise<string | null> {
  const res = await fetch(`${getBase()}/api/users/profile/picture?mobile=${encodeURIComponent(mobile)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.picture || null;
}

// Conversation management functions
export async function deleteConversation(conversationId: string, mobile: string): Promise<boolean> {
  const res = await fetch(
    `${getBase()}/api/conversations/${conversationId}?mobile=${encodeURIComponent(mobile)}`,
    { method: "DELETE", headers: authHeaders() }
  );
  return res.ok;
}

export async function deleteMultipleConversations(conversationIds: string[], mobile: string): Promise<boolean[]> {
  return Promise.all(conversationIds.map((id) => deleteConversation(id, mobile)));
}
