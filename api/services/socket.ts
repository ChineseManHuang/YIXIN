import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { env } from '../config/env.js'

export interface SocketUser {
  id: string
  userId: string
  sessionId?: string
  connectedAt: Date
}

export interface TypingData {
  sessionId: string
  userId: string
  isTyping: boolean
}

export interface MessageData {
  sessionId: string
  messageId: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export class SocketService {
  private io: SocketIOServer
  private connectedUsers: Map<string, SocketUser> = new Map()

  constructor(server: HTTPServer) {
    const allowedOrigins = env.CLIENT_ORIGINS.length > 0 ? env.CLIENT_ORIGINS : true;

    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      // 鐢ㄦ埛璁よ瘉鍜屽姞鍏?
      socket.on('join', async (data: { userId: string; sessionId?: string }) => {
        try {
          const user: SocketUser = {
            id: socket.id,
            userId: data.userId,
            sessionId: data.sessionId,
            connectedAt: new Date()
          }

          this.connectedUsers.set(socket.id, user)

          // 鍔犲叆鐢ㄦ埛涓撳睘鎴块棿
          socket.join(`user:${data.userId}`)
          
          // 濡傛灉鏈変細璇滻D锛屽姞鍏ヤ細璇濇埧闂?
          if (data.sessionId) {
            socket.join(`session:${data.sessionId}`)
          }

          // 閫氱煡鐢ㄦ埛杩炴帴鎴愬姛
          socket.emit('joined', {
            success: true,
            userId: data.userId,
            sessionId: data.sessionId
          })

          console.log(`User ${data.userId} joined session ${data.sessionId}`)
        } catch (error: unknown) {
          console.error('Join error:', error)
          socket.emit('error', { message: '鍔犲叆澶辫触' })
        }
      })

      // 澶勭悊杈撳叆鐘舵€?
      socket.on('typing', (data: TypingData) => {
        const user = this.connectedUsers.get(socket.id)
        if (user && data.sessionId) {
          // 鍚戝悓涓€浼氳瘽鐨勫叾浠栫敤鎴峰箍鎾緭鍏ョ姸鎬?
          socket.to(`session:${data.sessionId}`).emit('user_typing', {
            userId: data.userId,
            isTyping: data.isTyping,
            sessionId: data.sessionId
          })
        }
      })

      // 澶勭悊鏂版秷鎭箍鎾?
      socket.on('new_message', (data: MessageData) => {
        const user = this.connectedUsers.get(socket.id)
        if (user && data.sessionId) {
          // 鍚戝悓涓€浼氳瘽鐨勫叾浠栫敤鎴峰箍鎾柊娑堟伅
          socket.to(`session:${data.sessionId}`).emit('message_received', data)
        }
      })

      // 澶勭悊浼氳瘽鐘舵€佹洿鏂?
      socket.on('session_update', (data: { sessionId: string, status: string }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          // 鍚戝悓涓€浼氳瘽鐨勫叾浠栫敤鎴峰箍鎾細璇濈姸鎬佹洿鏂?
          socket.to(`session:${data.sessionId}`).emit('session_status_changed', {
            sessionId: data.sessionId,
            status: data.status,
            updatedBy: user.userId
          })
        }
      })

      // 澶勭悊鏂嚎
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          console.log(`User ${user.userId} disconnected`)
          
          // 閫氱煡鍚屼竴浼氳瘽鐨勫叾浠栫敤鎴?
          if (user.sessionId) {
            socket.to(`session:${user.sessionId}`).emit('user_disconnected', {
              userId: user.userId,
              sessionId: user.sessionId
            })
          }
          
          this.connectedUsers.delete(socket.id)
        }
      })

      // 澶勭悊閿欒
      socket.on('error', (error: unknown) => {
        console.error('Socket error:', error)
      })
    })
  }

  // 鍚戠壒瀹氱敤鎴峰彂閫佹秷鎭?
  public sendToUser(userId: string, event: string, data: unknown) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  // 鍚戠壒瀹氫細璇濆彂閫佹秷鎭?
  public sendToSession(sessionId: string, event: string, data: unknown) {
    this.io.to(`session:${sessionId}`).emit(event, data)
  }

  // 骞挎挱缁欐墍鏈夎繛鎺ョ殑鐢ㄦ埛
  public broadcast(event: string, data: unknown) {
    this.io.emit(event, data)
  }

  // 鑾峰彇杩炴帴鐨勭敤鎴锋暟閲?
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  // 鑾峰彇鐗瑰畾浼氳瘽鐨勮繛鎺ョ敤鎴?
  public getSessionUsers(sessionId: string): SocketUser[] {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.sessionId === sessionId)
  }

  // 璁板綍杩炴帴缁熻鍒版暟鎹簱
  public async logConnectionStats() {
    try {
      const stats = {
        connected_users: this.getConnectedUsersCount(),
        timestamp: new Date().toISOString()
      }

      // 杩欓噷鍙互娣诲姞鍒版暟鎹簱璁板綍杩炴帴缁熻
      console.log('Connection stats:', stats)
    } catch (error: unknown) {
      console.error('Failed to log connection stats:', error)
    }
  }
}

// 瀵煎嚭鍗曚緥瀹炰緥
let socketService: SocketService | null = null

export const initializeSocket = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server)
  }
  return socketService
}

export const getSocketService = (): SocketService | null => {
  return socketService
}
