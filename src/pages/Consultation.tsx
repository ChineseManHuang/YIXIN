/**
 * AI语音咨询页面 - 沉浸式语音交互
 * 核心特点:
 * 1. 大圆形语音图标为唯一交互元素
 * 2. AI主动发起对话和引导
 * 3. 全程语音交互(去除文字输入框)
 * 4. AI回复以文字+语音形式呈现
 * 5. 严格按照KB01-05线性工作流推进
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import { Mic, MicOff, Volume2, ArrowLeft, Loader2 } from 'lucide-react'
import type { Message, Session } from '../lib/api'

const Consultation: React.FC = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { isAuthenticated } = useAuthStore()

  // 会话状态
  const [session, setSession] = useState<Session | null>(null)
  const [currentAIMessage, setCurrentAIMessage] = useState<string>('')
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])

  // 语音交互状态
  const [isRecording, setIsRecording] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 会话初始化状态
  const [isSessionInitialized, setIsSessionInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 语音相关引用
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const hasGreetedRef = useRef(false)

  // 检查认证
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // 加载会话并触发AI初始问候
  const loadSessionAndInitiate = useCallback(async () => {
    if (!sessionId || hasGreetedRef.current) return

    try {
      setIsLoading(true)
      const response = await api.sessions.get(sessionId)

      if (response.success && response.data) {
        setSession(response.data.session)
        const messages = response.data.recent_messages || []
        setConversationHistory(messages)

        // 如果没有消息,AI主动发起问候
        if (messages.length === 0) {
          hasGreetedRef.current = true
          initiateAIGreeting(response.data.session)
        } else {
          // 如果有历史消息,显示最后一条AI消息
          const lastAIMessage = messages.filter(m => m.sender_type === 'assistant').pop()
          if (lastAIMessage) {
            setCurrentAIMessage(lastAIMessage.content)
            speakText(lastAIMessage.content)
          }
        }

        setIsSessionInitialized(true)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      setError('加载会话失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // AI主动发起问候 (直接设置greeting,不调用API)
  const initiateAIGreeting = (sessionData: Session) => {
    // 根据KB阶段生成初始问候语
    const greetings = {
      1: '你好，我是你的AI心理咨询师。很高兴能陪伴你。在开始之前，能先告诉我，是什么让你想要寻求心理咨询的帮助呢？',
      2: '欢迎回来。上次我们探讨了一些重要的内容。今天我想和你一起更深入地了解这些感受背后的原因。你准备好了吗？',
      3: '很高兴再次见到你。根据我们之前的交流，今天我想通过一些问题来帮助你更好地认识自己。我们可以开始了吗？',
      4: '你好。今天我们将一起探索一些具体的应对方法。在此之前，你能先分享一下最近的感受吗？',
      5: '欢迎。我们已经走过了很多阶段，今天让我们一起回顾和总结这段旅程。你觉得如何？'
    }

    const kbStep = sessionData.current_kb_step || 1
    const greeting = greetings[kbStep as keyof typeof greetings] || greetings[1]

    // 直接设置问候并播放
    setCurrentAIMessage(greeting)
    speakText(greeting)
  }

  // 初始化会话
  useEffect(() => {
    if (isAuthenticated && sessionId && !isSessionInitialized) {
      loadSessionAndInitiate()
    }
  }, [isAuthenticated, sessionId, isSessionInitialized, loadSessionAndInitiate])

  // 开始录音
  const startRecording = async () => {
    try {
      // 停止当前播放的音频
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
        setIsAISpeaking(false)
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())

        if (chunks.length > 0) {
          await handleVoiceInput(chunks)
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setError(null)
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

  // 处理语音输入
  const handleVoiceInput = async (chunks: Blob[]) => {
    if (!sessionId) return

    try {
      setIsProcessing(true)
      setError(null)

      // 合并音频块
      const audioBlob = new Blob(chunks, { type: 'audio/webm' })

      // 发送音频到服务器
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        // 更新对话历史
        const userMsg = result.data.user_message
        const aiMsg = result.data.ai_message

        setConversationHistory(prev => [...prev, userMsg, aiMsg])
        setCurrentAIMessage(aiMsg.content)

        // 播放AI回复
        if (result.data.ai_audio) {
          playAIAudio(result.data.ai_audio)
        } else {
          speakText(aiMsg.content)
        }
      } else {
        throw new Error(result.error || '语音处理失败')
      }
    } catch (err) {
      console.error('处理语音输入失败:', err)
      const errorMessage = err instanceof Error ? err.message : '语音处理失败，请重试'
      setError(errorMessage)

      // 如果是连接问题，提供更友好的提示
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('无法连接到服务器，请检查网络连接或稍后重试')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // 播放AI音频
  const playAIAudio = (audioBase64: string) => {
    try {
      // 停止当前播放
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`)
      currentAudioRef.current = audio

      audio.onplay = () => setIsAISpeaking(true)
      audio.onended = () => {
        setIsAISpeaking(false)
        currentAudioRef.current = null
      }
      audio.onerror = () => {
        setIsAISpeaking(false)
        currentAudioRef.current = null
        console.error('音频播放失败，回退到TTS')
        // 回退到TTS
        speakText(currentAIMessage)
      }

      audio.play().catch(err => {
        console.error('音频播放失败:', err)
        speakText(currentAIMessage)
      })
    } catch (err) {
      console.error('播放AI音频失败:', err)
      speakText(currentAIMessage)
    }
  }

  // 使用浏览器TTS播放文本
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // 停止当前语音
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.9
      utterance.pitch = 1.0

      utterance.onstart = () => setIsAISpeaking(true)
      utterance.onend = () => setIsAISpeaking(false)
      utterance.onerror = () => setIsAISpeaking(false)

      speechSynthesis.speak(utterance)
    }
  }

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
    }
  }, [mediaRecorder])

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 items-center justify-center">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-700 font-medium">正在初始化咨询会话...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* 头部 */}
      <div className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {session?.title || 'AI语音咨询'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step <= (session?.current_kb_step || 1)
                          ? 'bg-indigo-600 scale-110'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  步骤 {session?.current_kb_step || 1}/5
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              语音模式
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="relative z-10 mx-6 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 animate-in slide-in-from-top">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 主内容区域 - AI文字显示 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* AI回复文字显示区域 */}
        <div className="w-full max-w-3xl mb-12">
          {currentAIMessage ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-2xl transition-all duration-300 ${
                  isAISpeaking ? 'bg-indigo-600 scale-110' : 'bg-indigo-100'
                }`}>
                  <Volume2 className={`w-6 h-6 transition-colors duration-300 ${
                    isAISpeaking ? 'text-white animate-pulse' : 'text-indigo-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-lg leading-relaxed font-light">
                    {currentAIMessage}
                  </p>
                  {isAISpeaking && (
                    <div className="flex items-center space-x-2 mt-4">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-sm text-indigo-600 font-medium ml-2">AI正在说话...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-lg">AI正在准备...</p>
            </div>
          )}
        </div>

        {/* 大圆形语音按钮 */}
        <div className="relative">
          {/* 外围动画圆环 */}
          {(isRecording || isAISpeaking) && (
            <>
              <div className={`absolute inset-0 rounded-full animate-ping ${
                isRecording ? 'bg-red-400/30' : 'bg-indigo-400/30'
              }`} style={{ animationDuration: '2s' }}></div>
              <div className={`absolute inset-0 rounded-full animate-pulse ${
                isRecording ? 'bg-red-400/20' : 'bg-indigo-400/20'
              }`} style={{ animationDuration: '3s' }}></div>
            </>
          )}

          {/* 主按钮 */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isAISpeaking}
            className={`relative w-48 h-48 rounded-full shadow-2xl transition-all duration-500 transform ${
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110'
                : isAISpeaking
                ? 'bg-gradient-to-br from-green-500 to-green-600 scale-105'
                : isProcessing
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:scale-110 hover:shadow-3xl'
            } ${
              (isProcessing || isAISpeaking) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-center h-full">
              {isProcessing ? (
                <Loader2 className="w-20 h-20 text-white animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-20 h-20 text-white animate-pulse" />
              ) : isAISpeaking ? (
                <Volume2 className="w-20 h-20 text-white animate-pulse" />
              ) : (
                <Mic className="w-20 h-20 text-white" />
              )}
            </div>
          </button>
        </div>

        {/* 状态提示文字 */}
        <div className="mt-8 text-center">
          <p className={`text-lg font-medium transition-colors duration-300 ${
            isRecording
              ? 'text-red-600'
              : isAISpeaking
              ? 'text-green-600'
              : isProcessing
              ? 'text-yellow-600'
              : 'text-gray-600'
          }`}>
            {isRecording
              ? '正在录音... 点击停止'
              : isAISpeaking
              ? 'AI正在说话'
              : isProcessing
              ? '正在处理您的回复...'
              : '点击开始对话'
            }
          </p>
          {!isRecording && !isAISpeaking && !isProcessing && (
            <p className="text-sm text-gray-400 mt-2">
              点击麦克风按钮说话，完成后再次点击发送
            </p>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="relative z-10 pb-8 text-center text-sm text-gray-500">
        <p>AI咨询师会主动引导您进行心理咨询对话</p>
      </div>
    </div>
  )
}

export default Consultation
