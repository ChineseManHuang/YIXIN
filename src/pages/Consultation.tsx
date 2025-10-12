/**
 * AI咨询页面组件
 * 实现与AI心理咨询师的对话界面
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import { Send, Mic, MicOff, Volume2, VolumeX, ArrowLeft, MoreVertical } from 'lucide-react'
import type { Message, Session } from '../lib/api'

const Consultation: React.FC = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { isAuthenticated } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 状态管理
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [isAutoVoiceMode, setIsAutoVoiceMode] = useState(false)

  // 语音相关
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])
  
  // 加载会话信息和消息
  const loadSession = useCallback(async () => {
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
  }, [sessionId])

  // 加载会话数据
  useEffect(() => {
    if (sessionId && isAuthenticated) {
      // 使用异步方式加载,避免阻塞UI
      const timeoutId = setTimeout(() => {
        loadSession()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [sessionId, isAuthenticated, loadSession])
  
  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // 发送消息
  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'audio' = 'text') => {
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
  }, [sessionId, isLoading])
  
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
  
  // 处理录音完成并发送语音消息
  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording) {
      handleVoiceMessage()
      setAudioChunks([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioChunks, isRecording])

  // 处理语音消息
  const handleVoiceMessage = async () => {
    if (audioChunks.length === 0 || !sessionId) return

    try {
      setIsAIProcessing(true)
      setError(null)

      // 合并音频块
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })

      // 发送音频到服务器进行处理
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('session_id', sessionId)
      formData.append('message_type', 'audio')

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/messages/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success && result.data) {
        // 添加用户消息和AI回复到消息列表
        setMessages(prev => [
          ...prev,
          result.data.user_message,
          result.data.ai_message
        ])

        // 如果开启自动语音模式,播放AI回复
        if (isAutoVoiceMode && result.data.ai_audio) {
          playAIAudio(result.data.ai_audio)
        }
      } else {
        throw new Error(result.error || '语音消息发送失败')
      }
    } catch (err) {
      console.error('处理语音消息失败:', err)
      setError(err instanceof Error ? err.message : '语音消息处理失败')
    } finally {
      setIsAIProcessing(false)
    }
  }

  // 播放AI回复音频
  const playAIAudio = (audioBase64: string) => {
    try {
      // 停止当前播放
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      // 创建新的音频元素
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`)
      currentAudioRef.current = audio

      audio.onplay = () => setIsSpeaking(true)
      audio.onended = () => {
        setIsSpeaking(false)
        // 自动语音模式下,AI说完后自动开始录音
        if (isAutoVoiceMode && !isRecording) {
          setTimeout(() => startRecording(), 500)
        }
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        console.error('音频播放失败')
      }

      audio.play()
    } catch (err) {
      console.error('播放AI音频失败:', err)
    }
  }
  
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* 加载遮罩 */}
      {isLoading && messages.length === 0 && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">加载咨询会话中...</p>
          </div>
        </div>
      )}

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
        <div className="flex items-center space-x-2">
          {/* 自动语音模式切换 */}
          <button
            onClick={() => setIsAutoVoiceMode(!isAutoVoiceMode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isAutoVoiceMode
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isAutoVoiceMode ? '关闭自动语音模式' : '开启自动语音模式'}
          >
            <div className="flex items-center space-x-1">
              <Volume2 className="w-4 h-4" />
              <span>{isAutoVoiceMode ? '语音模式' : '文字模式'}</span>
            </div>
          </button>

          <button className="p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:scale-105">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
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
        {(isLoading || isAIProcessing) && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 ml-2 font-medium">
                  {isAIProcessing ? 'AI正在处理语音...' : 'AI正在思考...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI正在说话指示器 */}
        {isSpeaking && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2">
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-sm text-green-700 font-medium">AI正在回复...</span>
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
            className={`p-3 rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm relative ${
              isRecording
                ? 'bg-red-500 text-white shadow-red-200 animate-pulse'
                : isSpeaking
                ? 'bg-green-500 text-white shadow-green-200'
                : isAIProcessing
                ? 'bg-yellow-500 text-white shadow-yellow-200'
                : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:shadow-md'
            }`}
            disabled={isLoading || isAIProcessing || isSpeaking}
            title={
              isRecording ? '停止录音' :
              isSpeaking ? 'AI正在说话' :
              isAIProcessing ? '正在处理' :
              isAutoVoiceMode ? '点击开始语音对话' : '点击录音'
            }
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : isSpeaking ? (
              <Volume2 className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {isAutoVoiceMode && !isRecording && !isSpeaking && !isAIProcessing && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
            )}
          </button>
          
          {/* 发送按钮 */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || isAutoVoiceMode}
            className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md disabled:hover:scale-100"
            title={isAutoVoiceMode ? '语音模式下请使用麦克风' : '发送消息'}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* 语音模式提示 */}
        {isAutoVoiceMode && (
          <div className="text-center mt-2 text-sm text-blue-600">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>自动语音模式已开启 - 点击麦克风开始对话</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Consultation
