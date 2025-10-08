import { io, Socket } from 'socket.io-client'

export interface SocketEvents {
  // 连接事件
  joined: (data: { success: boolean; userId: string; sessionId?: string }) => void
  error: (data: { message: string }) => void
  
  // 消息事件
  message_received: (data: MessageData) => void
  user_typing: (data: { userId: string; isTyping: boolean; sessionId: string }) => void
  
  // 会话事件
  session_status_changed: (data: { sessionId: string; status: string; updatedBy: string }) => void
  user_disconnected: (data: { userId: string; sessionId: string }) => void
}

export interface MessageData {
  sessionId: string
  messageId: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

export interface TypingData {
  sessionId: string
  userId: string
  isTyping: boolean
}

class SocketClient {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.setupSocket()
  }

  private setupSocket() {
    const socketUrl = this.resolveSocketUrl()

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    })

    this.setupEventHandlers()
  }

  private resolveSocketUrl(): string {
    const sanitize = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value)

    const configuredUrl = import.meta.env.VITE_SOCKET_URL?.trim()
    if (configuredUrl) {
      return sanitize(configuredUrl)
    }

    if (import.meta.env.DEV) {
      return 'http://localhost:3001'
    }

    if (typeof window !== 'undefined') {
      return sanitize(window.location.origin)
    }

    return 'http://localhost:3001'
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected', { socketId: this.socket?.id })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
      this.emit('disconnected', { reason })
      
      // 自动重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.reconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
      this.emit('connection_error', { error: error.message })
      this.reconnect()
    })

    // 设置服务器事件监听
    this.socket.on('joined', (data) => {
      this.emit('joined', data)
    })

    this.socket.on('error', (data) => {
      this.emit('error', data)
    })

    this.socket.on('message_received', (data) => {
      this.emit('message_received', data)
    })

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data)
    })

    this.socket.on('session_status_changed', (data) => {
      this.emit('session_status_changed', data)
    })

    this.socket.on('user_disconnected', (data) => {
      this.emit('user_disconnected', data)
    })
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('max_reconnect_attempts_reached', {})
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect()
      }
    }, delay)
  }

  // 加入会话
  public join(userId: string, sessionId?: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', { userId, sessionId })
    } else {
      console.warn('Socket not connected, cannot join')
    }
  }

  // 发送输入状态
  public sendTyping(data: TypingData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', data)
    }
  }

  // 发送新消息通知
  public sendMessage(data: MessageData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new_message', data)
    }
  }

  // 更新会话状态
  public updateSessionStatus(sessionId: string, status: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('session_update', { sessionId, status })
    }
  }

  // 事件监听
  public on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void
  public on(event: string, callback: Function): void
  public on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)?.push(callback)
  }

  // 移除事件监听
  public off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event)
      return
    }

    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 触发事件
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error)
        }
      })
    }
  }

  // 获取连接状态
  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // 手动重连
  public manualReconnect() {
    if (this.socket) {
      this.reconnectAttempts = 0
      this.socket.disconnect()
      this.socket.connect()
    }
  }

  // 断开连接
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  // 清理资源
  public cleanup() {
    this.eventListeners.clear()
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
  }
}

// 导出单例实例
export const socketClient = new SocketClient()