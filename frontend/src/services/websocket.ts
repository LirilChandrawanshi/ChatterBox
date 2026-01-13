import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING' | 'FILE'
  content?: string
  sender: string
  fileContent?: string
  fileType?: string
  timestamp?: number
}

export class WebSocketService {
  private stompClient: Client | null = null
  private connected: boolean = false
  private username: string = ''
  private messageCallback: ((message: ChatMessage) => void) | null = null
  private connectionCallback: ((connected: boolean) => void) | null = null

  connect(username: string, onConnected: () => void, onError: (error: any) => void) {
    this.username = username
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'
    
    console.log('Creating WebSocket connection to:', wsUrl)
    console.log('Username:', username)
    
    // Create STOMP client
    this.stompClient = new Client({
      webSocketFactory: () => {
        console.log('Creating SockJS connection...')
        return new SockJS(wsUrl) as any
      },
      debug: (str) => {
        console.log('STOMP:', str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    // On connect
    this.stompClient.onConnect = () => {
      this.connected = true
      this.connectionCallback?.(true)
      
      // Subscribe to public channel
      this.stompClient?.subscribe('/topic/public', (message: IMessage) => {
        const chatMessage = JSON.parse(message.body) as ChatMessage
        this.messageCallback?.(chatMessage)
      })

      // Send join message
      this.sendJoinMessage()
      onConnected()
    }

    // On error
    this.stompClient.onStompError = (frame) => {
      this.connected = false
      this.connectionCallback?.(false)
      onError(frame)
    }

    // On disconnect
    this.stompClient.onDisconnect = () => {
      this.connected = false
      this.connectionCallback?.(false)
    }

    // Activate the connection
    this.stompClient.activate()
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate()
      this.connected = false
      this.connectionCallback?.(false)
    }
  }

  sendMessage(content: string) {
    if (this.stompClient && this.connected) {
      const chatMessage: ChatMessage = {
        sender: this.username,
        content: content,
        type: 'CHAT',
      }
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(chatMessage),
      })
    }
  }

  sendTyping() {
    if (this.stompClient && this.connected) {
      const typingMessage: ChatMessage = {
        sender: this.username,
        type: 'TYPING',
      }
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(typingMessage),
      })
    }
  }

  sendFile(fileContent: string, fileType: string) {
    if (this.stompClient && this.connected) {
      const fileMessage: ChatMessage = {
        sender: this.username,
        fileContent: fileContent,
        fileType: fileType,
        type: 'FILE',
      }
      
      const messageBody = JSON.stringify(fileMessage)
      const messageSizeKB = (messageBody.length / 1024).toFixed(2)
      console.log(`Sending file message: ${messageSizeKB}KB`)
      
      try {
        this.stompClient.publish({
          destination: '/app/chat.sendFile',
          body: messageBody,
        })
        console.log('File sent successfully')
      } catch (error) {
        console.error('Error sending file:', error)
        throw error
      }
    }
  }

  private sendJoinMessage() {
    if (this.stompClient && this.connected) {
      const joinMessage: ChatMessage = {
        sender: this.username,
        type: 'JOIN',
      }
      this.stompClient.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify(joinMessage),
      })
    }
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallback = callback
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallback = callback
  }

  isConnected(): boolean {
    return this.connected
  }

  getUsername(): string {
    return this.username
  }
}

export const wsService = new WebSocketService()
