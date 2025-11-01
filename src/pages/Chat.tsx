/**
 * 咨询对话页面组件
 * AI心理咨询对话界面，支持实时消息交互
 */
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import type { Message as ApiMessage, Session as ApiSession } from '../lib/api'
import { useSocket, useTypingIndicator } from '../hooks/useSocket'
import VoicePlayer from '../components/VoicePlayer'
import VoiceCallOverlay from '../components/VoiceCallOverlay'
import {
  Send,
  Mic,
  Paperclip,
  MoreVertical,
  ArrowLeft,
  Brain,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react'

type ChatMessage = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  session_id: string
}

const ensureIsoTimestamp = (value?: string): string => {
  if (!value) {
    return new Date().toISOString()
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

const mapApiMessage = (message: ApiMessage): ChatMessage => ({
  id: message.id,
  content: message.content ?? '',
  role: message.sender_type === 'user' ? 'user' : 'assistant',
  timestamp: ensureIsoTimestamp(message.created_at),
  session_id: message.session_id,
})

const Chat: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  
  const [session, setSession] = useState<ApiSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false)
  
  // Socket.io 实时功能
  const {
    isConnected,
    isConnecting,
    error: socketError,
    sendMessage: sendSocketMessage,
    typingUsers
  } = useSocket({ sessionId, autoConnect: true })
  
  const { isTyping, startTyping, stopTyping } = useTypingIndicator(sessionId)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  // 加载会话和消息
  useEffect(() => {
    if (!sessionId || !isAuthenticated) return
    
    const loadSessionData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // 加载会话信息
        const sessionResponse = await api.sessions.get(sessionId)
        if (sessionResponse.success && sessionResponse.data) {
          setSession(sessionResponse.data.session)
        } else {
          throw new Error('会话不存在或已被删除')
        }
        
        // 加载消息历史
        const messagesResponse = await api.messages.list(sessionId)
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data.messages.map(mapApiMessage))
        }
      } catch (err) {
        console.error('加载会话数据失败:', err)
        setError(err instanceof Error ? err.message : '加载会话数据失败')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSessionData()
  }, [sessionId, isAuthenticated])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newMessage])

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sessionId || isSending) {
      return
    }

    const messageContent = newMessage.trim()
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      role: 'user',
      timestamp: new Date().toISOString(),
      session_id: sessionId,
    }

    setNewMessage('')
    setIsSending(true)
    setError(null)
    stopTyping()
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const response = await api.messages.send(sessionId, messageContent)
      if (!response.success || !response.data) {
        throw new Error(response.error || '发送消息失败')
      }

      const serverUserMessage = response.data.user_message
        ? mapApiMessage(response.data.user_message)
        : optimisticMessage
      const aiMessage = response.data.ai_message
        ? mapApiMessage(response.data.ai_message)
        : null

      setMessages(prev => {
        const withoutTemp = prev.filter(message => message.id !== optimisticMessage.id)
        const nextMessages = [...withoutTemp, serverUserMessage]
        if (aiMessage) {
          nextMessages.push(aiMessage)
        }
        return nextMessages
      })

      if (isConnected) {
        sendSocketMessage({
          messageId: serverUserMessage.id,
          content: serverUserMessage.content,
          role: serverUserMessage.role,
          timestamp: serverUserMessage.timestamp,
        })

        if (aiMessage) {
          sendSocketMessage({
            messageId: aiMessage.id,
            content: aiMessage.content,
            role: aiMessage.role,
            timestamp: aiMessage.timestamp,
          })
        }
      }
    } catch (err) {
      console.error('发送消息失败:', err)
      setError(err instanceof Error ? err.message : '发送消息失败')
      setMessages(prev => prev.filter(message => message.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 语音实时会话入口
  const handleVoiceToggle = () => {
    if (!sessionId) {
      setError('请先选择或创建一个咨询会话，再开启语音咨询')
      return
    }
    setShowVoiceOverlay(true)
  }

  const handleRealtimeLoggedMessage = (message: ApiMessage) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) {
        return prev
      }
      return [...prev, mapApiMessage(message)]
    })
  }
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // 发送输入状态
    if (e.target.value.trim() && !isTyping) {
      startTyping()
    } else if (!e.target.value.trim() && isTyping) {
      stopTyping()
    }
  }

  // 格式化时间
  const formatTime = (timestamp?: string) => {
    if (!timestamp) {
      return ''
    }

    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 如果未认证，不渲染内容
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="font-semibold text-gray-900">
                {session?.title || '心理咨询对话'}
              </h1>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>
                  {session?.status === 'active' ? '进行中' : 
                   session?.status === 'completed' ? '已完成' : '已暂停'}
                </span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 
                    isConnecting ? 'bg-yellow-400 animate-pulse' : 
                    'bg-red-400'
                  }`}></div>
                  <span>
                    {isConnected ? '已连接' : isConnecting ? '连接中' : '未连接'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>加载对话中...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重新加载
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">开始您的心理咨询</h3>
                <p className="text-gray-500 mb-6">我是您的AI心理咨询师，很高兴为您提供专业的心理支持和指导。</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">咨询须知：</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 请诚实地分享您的感受和想法</li>
                    <li>• 我会为您提供专业的心理支持</li>
                    <li>• 如有紧急情况，请立即寻求专业帮助</li>
                    <li>• 您的隐私将得到严格保护</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* 头像 */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* 消息内容 */}
                  <div className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* AI消息的语音播放器 */}
                    {message.role === 'assistant' && (
                      <div className="mt-2">
                        <VoicePlayer text={message.content} />
                      </div>
                    )}
                    
                    <p className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {/* AI正在输入指示器 */}
            {isSending && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 其他用户输入状态指示器 */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>{typingUsers.join(', ')} 正在输入...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      
      {/* Socket连接错误提示 */}
      {socketError && (
        <div className="px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          <p className="text-sm">实时连接异常: {socketError}</p>
        </div>
      )}

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            {/* 附件按钮 */}
            <button className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* 文本输入框 */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题或想法..."
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 transition-colors"
                rows={1}
                disabled={isSending}
              />
            </div>
            
            {/* 语音按钮 */}
            <button
              onClick={handleVoiceToggle}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                showVoiceOverlay
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            {/* 发送按钮 */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* 语音录制器 */}
          {showVoiceOverlay && sessionId && (
            <VoiceCallOverlay
              sessionId={sessionId}
              sessionTitle={session?.title}
              onClose={() => setShowVoiceOverlay(false)}
              onMessageLogged={handleRealtimeLoggedMessage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat
