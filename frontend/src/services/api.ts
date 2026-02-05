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
  bio?: string;
  profilePicture?: string;
}

export interface UserProfile {
  mobile: string;
  displayName: string;
  bio: string;
  profilePicture: string;
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
  if (!res.ok) {
    // Try to extract error message from response
    let errorMessage = "Failed to start conversation";
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use generic message
    }
    throw new Error(errorMessage);
  }
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
  // Reply-to-message fields
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
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

export async function deleteMessages(ids: string[]): Promise<boolean> {
  const res = await fetch(`${getBase()}/api/messages`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids),
  });
  return res.ok;
}

export async function sendMessage(
  conversationId: string,
  mobile: string,
  content: string,
  replyTo?: { id: string; content: string; sender: string }
): Promise<ChatMessage> {
  const payload: any = { content: content.trim() };
  if (replyTo) {
    payload.replyToId = replyTo.id;
    payload.replyToContent = replyTo.content;
    payload.replyToSender = replyTo.sender;
  }
  const res = await fetch(
    `${getBase()}/api/conversations/${conversationId}/messages?mobile=${encodeURIComponent(mobile)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

export async function updateBio(mobile: string, bio: string): Promise<User> {
  const res = await fetch(`${getBase()}/api/users/profile/bio?mobile=${encodeURIComponent(mobile)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ bio: bio.trim() }),
  });
  if (!res.ok) throw new Error("Failed to update bio");
  return res.json();
}

export async function getBio(mobile: string): Promise<string> {
  const res = await fetch(`${getBase()}/api/users/profile/bio?mobile=${encodeURIComponent(mobile)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.bio || "";
}

export async function getUserProfile(mobile: string): Promise<UserProfile | null> {
  const res = await fetch(`${getBase()}/api/users/profile/${encodeURIComponent(mobile)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
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

// ==================== STATUS API ====================

export interface StatusItem {
  id: string;
  userMobile: string;
  userName: string;
  content: string;
  imageBase64?: string;
  imageType?: string;
  createdAt: number;
  expiresAt: number;
  viewedBy: string[];
}

export interface UserStatuses {
  userMobile: string;
  userName: string;
  statuses: StatusItem[];
  isOwn: boolean;
}

export async function createStatus(
  mobile: string,
  data: { content?: string; imageBase64?: string; imageType?: string }
): Promise<StatusItem> {
  const res = await fetch(`${getBase()}/api/status?mobile=${encodeURIComponent(mobile)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create status");
  return res.json();
}

export async function getStatuses(mobile: string): Promise<UserStatuses[]> {
  const res = await fetch(`${getBase()}/api/status?mobile=${encodeURIComponent(mobile)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getMyStatuses(mobile: string): Promise<StatusItem[]> {
  const res = await fetch(`${getBase()}/api/status/my?mobile=${encodeURIComponent(mobile)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function viewStatus(statusId: string, mobile: string): Promise<void> {
  await fetch(`${getBase()}/api/status/${statusId}/view?mobile=${encodeURIComponent(mobile)}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function deleteStatus(statusId: string, mobile: string): Promise<boolean> {
  const res = await fetch(`${getBase()}/api/status/${statusId}?mobile=${encodeURIComponent(mobile)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.ok;
}

// ==================== COMMUNITY API ====================

export interface CommentItem {
  authorMobile: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface CommunityPost {
  id: string;
  authorMobile: string;
  authorName: string;
  content: string;
  imageBase64?: string;
  imageType?: string;
  createdAt: number;
  likes: string[];
  comments: CommentItem[];
}

export async function createCommunityPost(
  mobile: string,
  data: { content?: string; imageBase64?: string; imageType?: string }
): Promise<CommunityPost> {
  const res = await fetch(`${getBase()}/api/community?mobile=${encodeURIComponent(mobile)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  const res = await fetch(`${getBase()}/api/community`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function togglePostLike(postId: string, mobile: string): Promise<CommunityPost> {
  const res = await fetch(`${getBase()}/api/community/${postId}/like?mobile=${encodeURIComponent(mobile)}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to like post");
  return res.json();
}

export async function addPostComment(
  postId: string,
  mobile: string,
  content: string
): Promise<CommunityPost> {
  const res = await fetch(`${getBase()}/api/community/${postId}/comment?mobile=${encodeURIComponent(mobile)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

export async function deleteCommunityPost(postId: string, mobile: string): Promise<boolean> {
  const res = await fetch(`${getBase()}/api/community/${postId}?mobile=${encodeURIComponent(mobile)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.ok;
}
