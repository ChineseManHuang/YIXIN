import { useEffect, useRef, useState, useCallback } from 'react'
import { socketClient, MessageData } from '../services/socket'
import { useAuthStore } from "../lib/auth-store";

export interface UseSocketOptions {
  sessionId?: string
  autoConnect?: boolean
}

export interface SocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnectAttempts: number
}

export interface TypingUser {
  userId: string
  sessionId: string
  isTyping: boolean
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { user } = useAuthStore()
  const { sessionId, autoConnect = true } = options
  
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  })
  
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // 连接到Socket服务器
  const connect = useCallback(() => {
    if (!user?.id) {
      console.warn('Cannot connect socket: user not authenticated')
      return
    }

    setSocketState(prev => ({ ...prev, isConnecting: true, error: null }))
    socketClient.join(user.id, sessionId)
  }, [user?.id, sessionId])

  // 断开连接
  const disconnect = useCallback(() => {
    socketClient.disconnect()
    setSocketState(prev => ({ ...prev, isConnected: false, isConnecting: false }))
  }, [])

  // 发送消息
  const sendMessage = useCallback((messageData: Omit<MessageData, 'sessionId'>) => {
    if (!sessionId) {
      console.warn('Cannot send message: no session ID')
      return
    }

    socketClient.sendMessage({
      ...messageData,
      sessionId
    })
  }, [sessionId])

  // 发送输入状态
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!user?.id || !sessionId) return

    // 防止重复发送相同状态
    if (isTypingRef.current === isTyping) return
    isTypingRef.current = isTyping

    socketClient.sendTyping({
      userId: user.id,
      sessionId,
      isTyping
    })

    // 如果开始输入，设置自动停止输入的定时器
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false)
      }, 3000) // 3秒后自动停止输入状态
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [user?.id, sessionId])

  // 更新会话状态
  const updateSessionStatus = useCallback((status: string) => {
    if (!sessionId) return
    socketClient.updateSessionStatus(sessionId, status)
  }, [sessionId])

  // 手动重连
  const reconnect = useCallback(() => {
    socketClient.manualReconnect()
  }, [])

  // 设置事件监听器
  useEffect(() => {
    const handleConnected = () => {
      setSocketState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0
      }))
    }

    const handleDisconnected = () => {
      setSocketState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false
      }))
    }

    const handleConnectionError = (data: { error: string }) => {
      setSocketState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: data.error
      }))
    }

    const handleJoined = (data: { success: boolean; userId: string; sessionId?: string }) => {
      if (data.success) {
        setSocketState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }))
      } else {
        setSocketState(prev => ({
          ...prev,
          isConnecting: false,
          error: '加入会话失败'
        }))
      }
    }

    const handleError = (data: { message: string }) => {
      setSocketState(prev => ({
        ...prev,
        error: data.message
      }))
    }

    const handleUserTyping = (data: { userId: string; isTyping: boolean; sessionId: string }) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId)
        if (data.isTyping) {
          return [...filtered, {
            userId: data.userId,
            sessionId: data.sessionId,
            isTyping: true
          }]
        }
        return filtered
      })
    }

    const handleUserDisconnected = (data: { userId: string; sessionId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId))
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId))
    }

    const handleMaxReconnectAttempts = () => {
      setSocketState(prev => ({
        ...prev,
        error: '连接失败，请刷新页面重试'
      }))
    }

    // 注册事件监听器
    socketClient.on('connected', handleConnected)
    socketClient.on('disconnected', handleDisconnected)
    socketClient.on('connection_error', handleConnectionError)
    socketClient.on('joined', handleJoined)
    socketClient.on('error', handleError)
    socketClient.on('user_typing', handleUserTyping)
    socketClient.on('user_disconnected', handleUserDisconnected)
    socketClient.on('max_reconnect_attempts_reached', handleMaxReconnectAttempts)

    // 清理函数
    return () => {
      socketClient.off('connected', handleConnected)
      socketClient.off('disconnected', handleDisconnected)
      socketClient.off('connection_error', handleConnectionError)
      socketClient.off('joined', handleJoined)
      socketClient.off('error', handleError)
      socketClient.off('user_typing', handleUserTyping)
      socketClient.off('user_disconnected', handleUserDisconnected)
      socketClient.off('max_reconnect_attempts_reached', handleMaxReconnectAttempts)
    }
  }, [])

  // 自动连接
  useEffect(() => {
    if (autoConnect && user?.id && !socketState.isConnected && !socketState.isConnecting) {
      connect()
    }
  }, [autoConnect, user?.id, socketState.isConnected, socketState.isConnecting, connect])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // 发送停止输入状态
      if (isTypingRef.current && user?.id && sessionId) {
        socketClient.sendTyping({
          userId: user.id,
          sessionId,
          isTyping: false
        })
      }
    }
  }, [user?.id, sessionId])

  return {
    // 状态
    socketState,
    typingUsers,
    onlineUsers,
    
    // 方法
    connect,
    disconnect,
    reconnect,
    sendMessage,
    sendTyping,
    updateSessionStatus,
    
    // 便捷属性
    isConnected: socketState.isConnected,
    isConnecting: socketState.isConnecting,
    error: socketState.error,
    
    // Socket客户端实例（用于高级用法）
    socketClient
  }
}

// 输入状态Hook
export const useTypingIndicator = (sessionId?: string) => {
  const { user } = useAuthStore()
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const stopTyping = useCallback(() => {
    if (!user?.id || !sessionId) return

    if (isTyping) {
      setIsTyping(false)
      socketClient.sendTyping({
        userId: user.id,
        sessionId,
        isTyping: false
      })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [user?.id, sessionId, isTyping])

  const startTyping = useCallback(() => {
    if (!user?.id || !sessionId) return

    if (!isTyping) {
      setIsTyping(true)
      socketClient.sendTyping({
        userId: user.id,
        sessionId,
        isTyping: true
      })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 1000)
  }, [user?.id, sessionId, isTyping, stopTyping])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTyping,
    startTyping,
    stopTyping
  }
}
