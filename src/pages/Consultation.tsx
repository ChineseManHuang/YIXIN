/**
 * AI咨询页面组件
 * 实现与AI心理咨询师的对话界面
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import { Send, Mic, MicOff, Volume2, VolumeX, ArrowLeft, MoreVertical } from 'lucide-react'
import type { Message, Session } from '../lib/api'

interface ConsultationPageProps {}

const Consultation: React.FC<ConsultationPageProps> = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 状态管理
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 语音相关
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  
  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])
  
  // 加载会话数据
  useEffect(() => {
    if (sessionId && isAuthenticated) {
      loadSession()
    }
  }, [sessionId, isAuthenticated])
  
  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // 加载会话信息和消息
  const loadSession = async () => {
    try {
      setIsLoading(true)
      const response = await api.sessions.get(sessionId!)
      if (response.success && response.data) {
        setSession(response.data.session)
        setMessages(response.data.recent_messages || [])
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      setError('加载会话失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // 发送消息
  const sendMessage = async (content: string, messageType: 'text' | 'audio' = 'text') => {
    if (!content.trim() || !sessionId || isLoading) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.messages.send(sessionId, content, messageType)
      if (response.success && response.data) {
        // 添加用户消息和AI回复到消息列表
        setMessages(prev => [
          ...prev,
          response.data!.user_message,
          response.data!.ai_message
        ])
        setInputMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('发送消息失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理文本消息发送
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }
  
  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setAudioChunks([])
    } catch (error) {
      console.error('Failed to start recording:', error)
      setError('无法访问麦克风，请检查权限设置')
    }
  }
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }
  
  // 处理录音完成
  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      // 这里应该将音频转换为文本，然后发送消息
      // 暂时使用占位符文本
      sendMessage('[语音消息]', 'audio')
      setAudioChunks([])
    }
  }, [audioChunks, isRecording])
  
  // 语音播放
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }
  
  // 停止语音播放
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }
  
  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (!isAuthenticated) {
    return null
  }
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {session?.title || 'AI心理咨询'}
            </h1>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      step <= (session?.current_kb_step || 1)
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                步骤 {session?.current_kb_step || 1}/5
              </span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:scale-105">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 mx-4 mt-4 shadow-sm animate-in slide-in-from-top-2">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                message.sender_type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200/50'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {formatTime(message.created_at)}
                </span>
                {message.sender_type === 'ai' && (
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakMessage(message.content)}
                    className={`ml-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                      isSpeaking ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* 加载指示器 */}
        {isLoading && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 ml-2 font-medium">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-4 py-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="输入您的问题或感受..."
              className="w-full px-4 py-3 border border-gray-300/50 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>
          
          {/* 语音按钮 */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm ${
              isRecording
                ? 'bg-red-500 text-white shadow-red-200 animate-pulse'
                : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:shadow-md'
            }`}
            disabled={isLoading}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* 发送按钮 */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default Consultation