import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Mic,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  ArrowLeft,
  RefreshCcw,
} from 'lucide-react'

import { useAuthStore } from '../lib/auth-store'
import {
  api,
  type Message,
  type Session,
  type VoiceSessionConfig,
} from '../lib/api'
import aiCallService, {
  type AgentState,
  type SubtitleMessage,
} from '../services/ai-call-service'

type StageCopy = Record<number, string>

const KB_STAGE_COPY: StageCopy = {
  1: '阶段 1 · 建立安全感和信任氛围',
  2: '阶段 2 · 继续探索问题的具体影响',
  3: '阶段 3 · 明确目标并建立改变动机',
  4: '阶段 4 · 练习与巩固应对策略',
  5: '阶段 5 · 回顾与整合新的认知模式',
}

const formatDisplayTime = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const VoiceConsultation: React.FC = () => {
  const navigate = useNavigate()
  const { sessionId: sessionIdFromParams } = useParams<{ sessionId: string }>()
  const { isAuthenticated } = useAuthStore()

  const [sessionConfig, setSessionConfig] = useState<VoiceSessionConfig | null>(null)
  const [sessionMeta, setSessionMeta] = useState<Session | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [agentState, setAgentState] = useState<AgentState>(aiCallService.currentState)
  const [currentAIMessage, setCurrentAIMessage] = useState<string>('')
  const [isMuted, setIsMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loggedSubtitlesRef = useRef<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const activeSessionId = sessionConfig?.session.id ?? sessionIdFromParams ?? ''

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loadConversationHistory = useCallback(async (resolvedSessionId: string) => {
    try {
      const response = await api.sessions.get(resolvedSessionId)
      if (response.success && response.data) {
        setSessionMeta(response.data.session)
        const history = response.data.recent_messages ?? []
        setConversationHistory(history)

        const latestAIMessage = history
          .filter((item) => item.sender_type === 'assistant')
          .slice(-1)[0]
        if (latestAIMessage) {
          setCurrentAIMessage(latestAIMessage.content)
        }
      }
    } catch (historyError) {
      console.error('Failed to load conversation history:', historyError)
    }
  }, [])

  const resolveSessionConfig = useCallback(
    async (hintSessionId?: string, hintTitle?: string): Promise<VoiceSessionConfig | null> => {
      try {
        const response = await api.voice.getSessionConfig(hintSessionId, hintTitle)
        if (!response.success || !response.data) {
          setError(response.error ?? '获取语音咨询配置失败')
          return null
        }

        const config = response.data
        setSessionConfig(config)

        // If backend created a new session, update route
        if (sessionIdFromParams && config.session.id !== sessionIdFromParams) {
          navigate(`/consultation/${config.session.id}`, { replace: true })
        }

        await loadConversationHistory(config.session.id)
        setError(null)
        return config
      } catch (configError) {
        console.error('Failed to fetch voice session config:', configError)
        setError('无法获取语音通话配置，请稍后重试')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [loadConversationHistory, navigate, sessionIdFromParams],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    const controller = new AbortController()

    setIsLoading(true)
    void resolveSessionConfig(sessionIdFromParams)

    return () => {
      controller.abort()
    }
  }, [isAuthenticated, resolveSessionConfig, sessionIdFromParams])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory, scrollToBottom])

  const appendMessageToHistory = useCallback((message: Message) => {
    setConversationHistory((prev) => [...prev, message])
  }, [])

  const logSubtitleMessage = useCallback(
    async (subtitle: SubtitleMessage) => {
      if (!sessionConfig) {
        return
      }

      const raw = (subtitle.raw ?? {}) as Record<string, unknown>
      const sentenceId = typeof raw.sentenceId === 'number' ? raw.sentenceId : undefined
      const voiceprintResult = raw.voiceprintResult
      const subtitleTimestamp = subtitle.timestamp ?? Date.now()
      const keySeed = sentenceId ?? subtitleTimestamp

      const canonicalKey = [
        subtitle.role,
        keySeed,
        subtitle.text,
      ].join('::')

      if (loggedSubtitlesRef.current.has(canonicalKey)) {
        return
      }

      loggedSubtitlesRef.current.add(canonicalKey)

      const senderType: Message['sender_type'] =
        subtitle.role === 'assistant' || subtitle.role === 'system'
          ? subtitle.role
          : 'user'

      const createdAt = new Date(subtitleTimestamp).toISOString()
      const loggingMetadata: Record<string, unknown> = {
        source: 'aliyun-realtime',
        is_final: subtitle.isFinal,
        subtitle_timestamp: subtitleTimestamp,
      }

      if (typeof sentenceId === 'number') {
        loggingMetadata.sentence_id = sentenceId
      }
      if (typeof voiceprintResult !== 'undefined') {
        loggingMetadata.voiceprint_result = voiceprintResult
      }

      try {
        const response = await api.messages.log(
          sessionConfig.session.id,
          senderType,
          subtitle.text,
          'text',
          loggingMetadata,
        )

        const messageId =
          (response.success && response.data?.message_id) || `temp-${Date.now()}`

        appendMessageToHistory({
          id: messageId,
          session_id: sessionConfig.session.id,
          sender_type: senderType,
          content: subtitle.text,
          message_type: 'text',
          metadata: {
            ...loggingMetadata,
            agent_state: agentState,
          },
          created_at: createdAt,
        })
      } catch (logError) {
        console.error('Failed to log realtime subtitle:', logError)
      }
    },
    [agentState, appendMessageToHistory, sessionConfig],
  )

  const handleSubtitle = useCallback(
    (subtitle: SubtitleMessage) => {
      if (subtitle.role === 'assistant') {
        // Keep UI responsive with the latest assistant speech
        setCurrentAIMessage(subtitle.text)
      }

      if (subtitle.isFinal) {
        void logSubtitleMessage(subtitle)
      }
    },
    [logSubtitleMessage],
  )

  useEffect(() => {
    const unsubscribeState = aiCallService.onStateChange((state) => {
      setAgentState(state)
      if (state === 'connecting') {
        setIsProcessing(true)
      } else if (state === 'ended' || state === 'error' || state === 'listening' || state === 'speaking' || state === 'thinking') {
        setIsProcessing(false)
      }
    })

    const unsubscribeMessages = aiCallService.onMessage(handleSubtitle)

    return () => {
      unsubscribeMessages()
      unsubscribeState()
      void aiCallService.hangup()
    }
  }, [handleSubtitle])

  const startVoiceSession = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setIsProcessing(true)
    try {
      const config = await resolveSessionConfig(activeSessionId, sessionMeta?.title)
      if (!config) {
        return
      }

      await aiCallService.initialize({
        rtc: {
          token: config.rtc.token,
          channelId: config.rtc.channelId,
          appId: config.rtc.appId,
          timestamp: config.rtc.timestamp,
          nonce: config.rtc.nonce,
        },
        agent: {
          agentId: config.agent.agentId,
          appId: config.agent.appId,
          region: config.agent.region ?? 'cn-hangzhou',
          bailianAppParams: config.agent.bailianAppParams,
        },
        sessionId: config.session.id,
        userId: config.user.id,
      })

      aiCallService.setSpeaker(true)
      setSpeakerOn(true)
      setIsMuted(false)
      setError(null)
    } catch (startError) {
      console.error('Failed to start realtime voice session:', startError)
      setError('语音通话启动失败，请检查网络或稍后再试')
      setIsProcessing(false)
    }
  }, [activeSessionId, isAuthenticated, navigate, resolveSessionConfig, sessionMeta?.title])

  const hangupVoiceSession = useCallback(async () => {
    setIsProcessing(true)
    try {
      await aiCallService.hangup()
    } finally {
      setIsProcessing(false)
      setAgentState('ended')
    }
  }, [])

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    aiCallService.mute(nextMuted)
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleSpeaker = useCallback(() => {
    const nextSpeakerOn = !speakerOn
    aiCallService.setSpeaker(nextSpeakerOn)
    setSpeakerOn(nextSpeakerOn)
  }, [speakerOn])

  const refreshTokens = useCallback(async () => {
    setIsProcessing(true)
    try {
      // Prefer lightweight RTC token refresh when a session is active
      if (sessionConfig?.session.id) {
        const refreshed = await aiCallService.refreshRtcToken()
        if (refreshed) {
          setError(null)
          setIsProcessing(false)
          return
        }
      }

      // Fallback to full session bootstrap if refresh is not supported
      await resolveSessionConfig(activeSessionId, sessionMeta?.title)
      setError(null)
    } catch (e) {
      console.error('Failed to refresh tokens:', e)
      setError('刷新通话令牌失败，请稍后再试')
    } finally {
      setIsProcessing(false)
    }
  }, [activeSessionId, resolveSessionConfig, sessionMeta?.title])

  const callActive =
    agentState === 'listening' ||
    agentState === 'speaking' ||
    agentState === 'thinking'

  const stageTitle =
    (sessionMeta?.current_kb_step && KB_STAGE_COPY[sessionMeta.current_kb_step]) ||
    KB_STAGE_COPY[sessionConfig?.session.current_kb_step ?? 1] ||
    '阶段 1 · 建立安全感和信任氛围'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col min-h-screen">
        <header className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回控制台
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {sessionMeta?.title || sessionConfig?.session.title || '语音心理咨询会话'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stageTitle}
            </p>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row gap-8">
          <section className="flex-1 bg-white/80 backdrop-blur rounded-3xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">实时对话记录</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSpeaker}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition"
                  title={speakerOn ? '关闭扬声器' : '打开扬声器'}
                >
                  {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition ${
                    isMuted
                      ? 'border-rose-300 text-rose-500 bg-rose-50'
                      : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title={isMuted ? '取消静音' : '麦克风静音'}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={refreshTokens}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  title="刷新会话配置"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {conversationHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender_type === 'assistant'
                        ? 'bg-indigo-50 text-gray-900 border border-indigo-100'
                        : 'bg-emerald-50 text-gray-900 border border-emerald-100'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">{message.content}</div>
                    <div className="text-xs text-gray-400 mt-2 text-right">
                      {formatDisplayTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </section>

          <section className="lg:w-[420px] flex flex-col items-center text-center">
            <div className="w-full bg-white/90 backdrop-blur rounded-3xl shadow-xl p-8 border border-indigo-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI 心理咨询师</h3>
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    callActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : agentState === 'connecting'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {agentState === 'connecting' && '正在连接'}
                  {agentState === 'listening' && '倾听中'}
                  {agentState === 'thinking' && '思考中'}
                  {agentState === 'speaking' && '表达中'}
                  {agentState === 'ended' && '已结束'}
                  {agentState === 'error' && '出现错误'}
                  {(agentState === 'idle' || agentState === 'ended') && !callActive && '等待开始'}
                </span>
              </div>

              <div className="min-h-[150px] bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 flex items-center justify-center">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <p className="text-sm">正在加载会话配置...</p>
                  </div>
                ) : currentAIMessage ? (
                  <p className="text-gray-800 text-base leading-relaxed">{currentAIMessage}</p>
                ) : (
                  <p className="text-gray-400 text-sm">
                    {callActive ? '正在等待实时语音...' : '点击下方按钮开始实时语音咨询'}
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                  {error}
                </div>
              )}

              <div className="mt-10">
                <button
                  type="button"
                  onClick={callActive ? hangupVoiceSession : startVoiceSession}
                  disabled={isProcessing || isLoading}
                  className={`relative w-48 h-48 rounded-full shadow-xl transition transform border-4 ${
                    callActive
                      ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-200 hover:scale-105'
                      : 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-200 hover:scale-105'
                  } ${isProcessing ? 'cursor-progress opacity-80' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-center h-full text-white">
                    {isProcessing ? (
                      <Loader2 className="w-20 h-20 animate-spin" />
                    ) : callActive ? (
                      <PhoneOff className="w-20 h-20" />
                    ) : (
                      <Mic className="w-20 h-20" />
                    )}
                  </div>
                </button>

                <p className="mt-6 text-sm text-gray-500">
                  {callActive
                    ? '点击结束当前语音通话'
                    : isProcessing
                      ? '正在准备语音通话...'
                      : '点击开始实时语音咨询'}
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default VoiceConsultation
