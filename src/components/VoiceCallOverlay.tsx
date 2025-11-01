import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  X,
  RefreshCcw,
} from 'lucide-react'

import {
  api,
  type Message,
  type VoiceSessionConfig,
} from '../lib/api'
import aiCallService, {
  type AgentState,
  type SubtitleMessage,
} from '../services/ai-call-service'

interface VoiceCallOverlayProps {
  sessionId: string
  sessionTitle?: string
  onClose: () => void
  onMessageLogged?: (message: Message) => void
}

interface OverlayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const agentStateCopy: Record<AgentState, string> = {
  idle: '未开始',
  connecting: '正在连接',
  listening: '倾听中',
  thinking: '思考中',
  speaking: '回复中',
  ended: '已结束',
  error: '出错',
}

const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  sessionId,
  sessionTitle,
  onClose,
  onMessageLogged,
}) => {
  const [sessionConfig, setSessionConfig] = useState<VoiceSessionConfig | null>(null)
  const [agentState, setAgentState] = useState<AgentState>(aiCallService.currentState)
  const [currentAIMessage, setCurrentAIMessage] = useState('')
  const [messages, setMessages] = useState<OverlayMessage[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loggedSubtitleKeys = useRef<Set<string>>(new Set())
  const listEndRef = useRef<HTMLDivElement | null>(null)

  const resolvedTitle = useMemo(() => sessionTitle ?? '语音咨询', [sessionTitle])

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const resolveSessionConfig = useCallback(async (): Promise<VoiceSessionConfig | null> => {
    try {
      const response = await api.voice.getSessionConfig(sessionId, sessionTitle)
      if (!response.success || !response.data) {
        setError(response.error ?? '无法获取语音咨询配置')
        return null
      }

      setSessionConfig(response.data)
      setError(null)
      return response.data
    } catch (configError) {
      console.error('[VoiceCallOverlay] Failed to fetch voice config:', configError)
      setError('无法获取语音咨询配置，请稍后重试')
      return null
    }
  }, [sessionId, sessionTitle])

  const logSubtitle = useCallback(
    async (subtitle: SubtitleMessage) => {
      if (!sessionConfig) {
        return
      }

      const raw = (subtitle.raw ?? {}) as Record<string, unknown>
      const sentenceId = typeof raw.sentenceId === 'number' ? raw.sentenceId : undefined
      const voiceprintResult = raw.voiceprintResult
      const subtitleTimestamp = subtitle.timestamp ?? Date.now()

      const key = [
        subtitle.role,
        sentenceId ?? subtitleTimestamp,
        subtitle.text,
      ].join('::')

      if (loggedSubtitleKeys.current.has(key)) {
        return
      }
      loggedSubtitleKeys.current.add(key)

      const senderType: Message['sender_type'] =
        subtitle.role === 'assistant' || subtitle.role === 'system'
          ? subtitle.role
          : 'user'

      const createdAt = new Date(subtitleTimestamp).toISOString()
      const metadata: Record<string, unknown> = {
        source: 'aliyun-realtime',
        is_final: subtitle.isFinal,
        subtitle_timestamp: subtitleTimestamp,
      }

      if (typeof sentenceId === 'number') {
        metadata.sentence_id = sentenceId
      }
      if (typeof voiceprintResult !== 'undefined') {
        metadata.voiceprint_result = voiceprintResult
      }

      try {
        const response = await api.messages.log(
          sessionConfig.session.id,
          senderType,
          subtitle.text,
          'text',
          metadata,
        )

        const messageId =
          (response.success && response.data?.message_id) || `temp-${Date.now()}`

        const loggedMessage: Message = {
          id: messageId,
          session_id: sessionConfig.session.id,
          sender_type: senderType,
          content: subtitle.text,
          message_type: 'text',
          metadata,
          created_at: createdAt,
        }

        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: senderType === 'assistant' ? 'assistant' : 'user',
            content: subtitle.text,
            createdAt,
          },
        ])

        onMessageLogged?.(loggedMessage)
      } catch (logError) {
        console.error('[VoiceCallOverlay] Failed to log subtitle:', logError)
      }
    },
    [onMessageLogged, sessionConfig],
  )

  const handleSubtitle = useCallback(
    (subtitle: SubtitleMessage) => {
      if (subtitle.role === 'assistant') {
        setCurrentAIMessage(subtitle.text)
      }

      if (subtitle.isFinal) {
        void logSubtitle(subtitle)
      }
    },
    [logSubtitle],
  )

  useEffect(() => {
    const unsubscribeState = aiCallService.onStateChange((state) => {
      setAgentState(state)
      if (state === 'connecting') {
        setIsProcessing(true)
      } else if (state === 'ended' || state === 'error') {
        setIsProcessing(false)
      } else if (state === 'listening' || state === 'speaking' || state === 'thinking') {
        setIsProcessing(false)
      }
    })

    const unsubscribeMessages = aiCallService.onMessage(handleSubtitle)

    return () => {
      unsubscribeMessages()
      unsubscribeState()
    }
  }, [handleSubtitle])

  const startVoiceSession = useCallback(async () => {
    setIsProcessing(true)
    try {
      const config = await resolveSessionConfig()
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
          voiceId: config.agent.voiceId,
        },
        sessionId: config.session.id,
        userId: config.user.id,
      })

      aiCallService.setSpeaker(true)
      setSpeakerOn(true)
      setIsMuted(false)
      setError(null)
    } catch (startError) {
      console.error('[VoiceCallOverlay] Failed to start voice session:', startError)
      setError('语音通话启动失败，请检查网络或稍后再试')
    } finally {
      setIsProcessing(false)
    }
  }, [resolveSessionConfig])

  const hangupVoiceSession = useCallback(async () => {
    setIsProcessing(true)
    try {
      await aiCallService.hangup()
    } finally {
      setIsProcessing(false)
      setAgentState('ended')
      onClose()
    }
  }, [onClose])

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted
    aiCallService.mute(nextMuted)
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleSpeaker = useCallback(() => {
    const nextSpeaker = !speakerOn
    aiCallService.setSpeaker(nextSpeaker)
    setSpeakerOn(nextSpeaker)
  }, [speakerOn])

  const refreshTokens = useCallback(async () => {
    setIsProcessing(true)
    try {
      const refreshed = await aiCallService.refreshRtcToken()
      if (!refreshed) {
        await resolveSessionConfig()
      }
      setError(null)
    } catch (refreshError) {
      console.error('[VoiceCallOverlay] Failed to refresh token:', refreshError)
      setError('刷新通话令牌失败，请稍后再试')
    } finally {
      setIsProcessing(false)
    }
  }, [resolveSessionConfig])

  useEffect(() => {
    const loggedSet = loggedSubtitleKeys.current
    void startVoiceSession()

    return () => {
      loggedSet.clear()
      void aiCallService.hangup()
    }
  }, [startVoiceSession])

  const callActive =
    agentState === 'listening' ||
    agentState === 'speaking' ||
    agentState === 'thinking'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">实时语音咨询</h2>
            <p className="text-sm text-gray-500 mt-1">
              {resolvedTitle} · 当前状态：{agentStateCopy[agentState]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshTokens}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
            >
              <RefreshCcw className="w-4 h-4" />
              刷新凭证
            </button>
            <button
              type="button"
              onClick={hangupVoiceSession}
              className="inline-flex items-center justify-center rounded-full bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-6 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <main className="grid gap-6 px-6 py-6 md:grid-cols-[1.4fr_1fr]">
          <section className="flex max-h-[420px] flex-col rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-600">实时字幕</h3>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400">等待对话开始…</p>
              ) : (
                messages.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col ${
                      item.role === 'user' ? 'items-end text-right' : 'items-start text-left'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        item.role === 'user'
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-white text-gray-800 shadow'
                      }`}
                    >
                      {item.content}
                    </div>
                    <span className="mt-1 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
              <div ref={listEndRef} />
            </div>
          </section>

          <section className="flex flex-col items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="space-y-6">
              <div className="relative">
                <div
                  className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full shadow-inner transition-colors ${
                    callActive
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                      : 'bg-gray-200'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                  ) : callActive ? (
                    <Volume2 className="h-12 w-12 text-white" />
                  ) : (
                    <Mic className="h-12 w-12 text-gray-500" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-base font-medium text-gray-700">
                  {callActive
                    ? currentAIMessage || 'AI 咨询师正在倾听…'
                    : '点击下方按钮结束或重新连接'}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleMute}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                  isMuted
                    ? 'border-rose-400 text-rose-500 bg-rose-50'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
                title={isMuted ? '取消静音' : '麦克风静音'}
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={hangupVoiceSession}
                className="flex h-14 flex-1 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
              >
                结束通话
              </button>
              <button
                type="button"
                onClick={toggleSpeaker}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                  speakerOn
                    ? 'border-indigo-300 text-indigo-600 bg-indigo-50'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
                title={speakerOn ? '关闭扬声器' : '开启扬声器'}
              >
                {speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default VoiceCallOverlay
