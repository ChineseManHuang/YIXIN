import { io, Socket } from 'socket.io-client'

export interface SocketEvents {
  // 杩炴帴浜嬩欢
  joined: (data: { success: boolean; userId: string; sessionId?: string }) => void
  error: (data: { message: string }) => void
  
  // 娑堟伅浜嬩欢
  message_received: (data: MessageData) => void
  user_typing: (data: { userId: string; isTyping: boolean; sessionId: string }) => void
  
  // 浼氳瘽浜嬩欢
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

type InternalSocketEvents = SocketEvents & {
  connected: (data: { socketId?: string }) => void
  disconnected: (data: { reason: string }) => void
  connection_error: (data: { error: string }) => void
  max_reconnect_attempts_reached: () => void
}

type EventPayload<T> = T extends (payload: infer P) => void ? P : void

type EventCallback<T = unknown> = (payload: T) => void

class SocketClient {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventListeners: Map<string, EventCallback[]> = new Map()

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
    const apiUrl = import.meta.env.VITE_API_URL?.trim()
    let resolved: string

    if (configuredUrl) {
      resolved = sanitize(configuredUrl)
    } else if (apiUrl) {
      resolved = sanitize(apiUrl.replace(/\/api$/, ''))
    } else if (import.meta.env.DEV) {
      resolved = 'http://localhost:3001'
    } else if (typeof window !== 'undefined') {
      resolved = sanitize(window.location.origin)
    } else {
      resolved = 'http://localhost:3001'
    }

    if (import.meta.env.DEV) {
      console.log('[env] Socket config', {
        MODE: import.meta.env.MODE,
        VITE_SOCKET_URL: configuredUrl || '(not set)',
        VITE_API_URL: apiUrl || '(not set)',
        RESOLVED_SOCKET_URL: resolved,
      })
    }

    return resolved
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
      
      // 鑷姩閲嶈繛
      if (reason === 'io server disconnect') {
        // 鏈嶅姟鍣ㄤ富鍔ㄦ柇寮€锛岄渶瑕佹墜鍔ㄩ噸杩?
        this.reconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
      this.emit('connection_error', { error: error.message })
      this.reconnect()
    })

    // 璁剧疆鏈嶅姟鍣ㄤ簨浠剁洃鍚?
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

  // 鍔犲叆浼氳瘽
  public join(userId: string, sessionId?: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', { userId, sessionId })
    } else {
      console.warn('Socket not connected, cannot join')
    }
  }

  // 鍙戦€佽緭鍏ョ姸鎬?
  public sendTyping(data: TypingData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', data)
    }
  }

  // 鍙戦€佹柊娑堟伅閫氱煡
  public sendMessage(data: MessageData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new_message', data)
    }
  }

  // 鏇存柊浼氳瘽鐘舵€?
  public updateSessionStatus(sessionId: string, status: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('session_update', { sessionId, status })
    }
  }

  // 浜嬩欢鐩戝惉
  public on<K extends keyof InternalSocketEvents>(event: K, callback: InternalSocketEvents[K]): void
  public on(event: string, callback: EventCallback): void
  public on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)?.push(callback)
  }

  // 绉婚櫎浜嬩欢鐩戝惉
  public off(event: string, callback?: EventCallback) {
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

  // 瑙﹀彂浜嬩欢
  private emit<K extends keyof InternalSocketEvents>(event: K, data: EventPayload<InternalSocketEvents[K]>): void
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event)
    if (!listeners) {
      return
    }

    listeners.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in socket event listener for ${event}:`, error)
      }
    })
  }

  // 鑾峰彇杩炴帴鐘舵€?
  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    }
  }

  // 鎵嬪姩閲嶈繛
  public manualReconnect() {
    if (this.socket) {
      this.reconnectAttempts = 0
      this.socket.disconnect()
      this.socket.connect()
    }
  }

  // 鏂紑杩炴帴
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  // 娓呯悊璧勬簮
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

// 瀵煎嚭鍗曚緥瀹炰緥
export const socketClient = new SocketClient()





