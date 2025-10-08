import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { env } from '../config/env.js'
import { supabase } from '../config/database.js'

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

      // 用户认证和加入
      socket.on('join', async (data: { userId: string, sessionId?: string }) => {
        try {
          const user: SocketUser = {
            id: socket.id,
            userId: data.userId,
            sessionId: data.sessionId,
            connectedAt: new Date()
          }

          this.connectedUsers.set(socket.id, user)

          // 加入用户专属房间
          socket.join(`user:${data.userId}`)
          
          // 如果有会话ID，加入会话房间
          if (data.sessionId) {
            socket.join(`session:${data.sessionId}`)
          }

          // 通知用户连接成功
          socket.emit('joined', {
            success: true,
            userId: data.userId,
            sessionId: data.sessionId
          })

          console.log(`User ${data.userId} joined session ${data.sessionId}`)
        } catch (error) {
          console.error('Join error:', error)
          socket.emit('error', { message: '加入失败' })
        }
      })

      // 处理输入状态
      socket.on('typing', (data: TypingData) => {
        const user = this.connectedUsers.get(socket.id)
        if (user && data.sessionId) {
          // 向同一会话的其他用户广播输入状态
          socket.to(`session:${data.sessionId}`).emit('user_typing', {
            userId: data.userId,
            isTyping: data.isTyping,
            sessionId: data.sessionId
          })
        }
      })

      // 处理新消息广播
      socket.on('new_message', (data: MessageData) => {
        const user = this.connectedUsers.get(socket.id)
        if (user && data.sessionId) {
          // 向同一会话的其他用户广播新消息
          socket.to(`session:${data.sessionId}`).emit('message_received', data)
        }
      })

      // 处理会话状态更新
      socket.on('session_update', (data: { sessionId: string, status: string }) => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          // 向同一会话的其他用户广播会话状态更新
          socket.to(`session:${data.sessionId}`).emit('session_status_changed', {
            sessionId: data.sessionId,
            status: data.status,
            updatedBy: user.userId
          })
        }
      })

      // 处理断线
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          console.log(`User ${user.userId} disconnected`)
          
          // 通知同一会话的其他用户
          if (user.sessionId) {
            socket.to(`session:${user.sessionId}`).emit('user_disconnected', {
              userId: user.userId,
              sessionId: user.sessionId
            })
          }
          
          this.connectedUsers.delete(socket.id)
        }
      })

      // 处理错误
      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    })
  }

  // 向特定用户发送消息
  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  // 向特定会话发送消息
  public sendToSession(sessionId: string, event: string, data: any) {
    this.io.to(`session:${sessionId}`).emit(event, data)
  }

  // 广播给所有连接的用户
  public broadcast(event: string, data: any) {
    this.io.emit(event, data)
  }

  // 获取连接的用户数量
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  // 获取特定会话的连接用户
  public getSessionUsers(sessionId: string): SocketUser[] {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.sessionId === sessionId)
  }

  // 记录连接统计到数据库
  public async logConnectionStats() {
    try {
      const stats = {
        connected_users: this.getConnectedUsersCount(),
        timestamp: new Date().toISOString()
      }

      // 这里可以添加到数据库记录连接统计
      console.log('Connection stats:', stats)
    } catch (error) {
      console.error('Failed to log connection stats:', error)
    }
  }
}

// 导出单例实例
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