import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface ChatMessage {
  id?: string;
  type: "CHAT" | "JOIN" | "LEAVE" | "TYPING" | "FILE" | "DELETED" | "READ" | "DELIVERED";
  content?: string;
  sender: string;
  conversationId?: string;
  fileContent?: string;
  fileType?: string;
  timestamp?: number;
  messageIds?: string[];
  // Reply-to-message fields
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
}

export class WebSocketService {
  private stompClient: Client | null = null;
  private connected = false;
  private mobile = "";
  private messageCallback: ((message: ChatMessage) => void) | null = null;
  private connectionCallback: ((connected: boolean) => void) | null = null;

  connect(
    mobile: string,
    onConnected: () => void,
    onError: (error: unknown) => void
  ) {
    this.mobile = mobile.replace(/[^0-9]/g, "");
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";
    const urlWithMobile = `${wsUrl}?mobile=${encodeURIComponent(this.mobile)}`;

    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      wsUrl.startsWith("http:")
    ) {
      const msg =
        "WebSocket URL must use HTTPS in production. Set NEXT_PUBLIC_WS_URL.";
      console.error(msg);
      onError({ message: msg });
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(urlWithMobile) as unknown as WebSocket,
      debug: (str) => console.log("STOMP:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      this.connected = true;
      this.connectionCallback?.(true);
      this.stompClient?.subscribe("/user/queue/messages", (message: IMessage) => {
        const chatMessage = JSON.parse(message.body) as ChatMessage;
        this.messageCallback?.(chatMessage);
      });
      onConnected();
    };

    this.stompClient.onStompError = (frame) => {
      this.connected = false;
      this.connectionCallback?.(false);
      onError(frame);
    };

    this.stompClient.onDisconnect = () => {
      this.connected = false;
      this.connectionCallback?.(false);
    };

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate();
      this.connected = false;
      this.connectionCallback?.(false);
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getMobile(): string {
    return this.mobile;
  }

  sendMessage(content: string) {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify({
        type: "CHAT",
        sender: this.mobile,
        content,
      }),
    });
  }

  sendTyping() {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        type: "TYPING",
        sender: this.mobile,
      }),
    });
  }

  sendFile(fileContent: string, fileType: string) {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: "/app/chat.sendFile",
      body: JSON.stringify({
        type: "FILE",
        sender: this.mobile,
        fileContent,
        fileType,
      }),
    });
  }

  // Send typing indicator for 1:1 conversation (via WebSocket)
  sendTypingToConversation(conversationId: string) {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        type: "TYPING",
        sender: this.mobile,
        conversationId,
      }),
    });
  }

  // Send read receipt via WebSocket
  sendReadReceipt(conversationId: string) {
    if (!this.connected || !this.stompClient) return;
    this.stompClient.publish({
      destination: "/app/chat.read",
      body: JSON.stringify({
        type: "READ",
        sender: this.mobile,
        conversationId,
      }),
    });
  }
}

export const wsService = new WebSocketService();

