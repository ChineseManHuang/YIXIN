import AliyunAICallEngine, {
  AICallAgentConfig,
  AICallAgentType,
  AICallAgentState,
  AICallChatSyncConfig,
  type AICallConfig,
} from 'aliyun-auikit-aicall'
import { getVoiceJoinToken } from '../lib/voice-api'

export type AgentState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended' | 'error'

export interface VoiceSessionBootstrap {
  rtc: {
    token: string
    channelId: string
    appId: string
    timestamp: number
    nonce: string
  }
  agent: {
    agentId: string
    appId: string
    region: string
    bailianAppParams: Record<string, unknown> | string
  }
  sessionId: string
  userId: string
}

export interface SubtitleMessage {
  role: 'user' | 'assistant' | 'system'
  text: string
  isFinal: boolean
  timestamp?: number
  raw?: unknown
}

type MessageListener = (message: SubtitleMessage) => void
type StateListener = (state: AgentState) => void

const ensureBailianParamsObject = (params: Record<string, unknown> | string): Record<string, unknown> => {
  if (typeof params === 'string') {
    try {
      const parsed = JSON.parse(params)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
    return {}
  }

  return params
}

const buildSubtitleMessage = (
  input: { text?: string; end?: boolean; sentenceId?: number } | null | undefined,
  role: SubtitleMessage['role'],
  extra?: Record<string, unknown>,
): SubtitleMessage | null => {
  if (!input) return null

  const text = typeof input.text === 'string' ? input.text : ''
  if (!text.trim()) {
    return null
  }

  return {
    role,
    text,
    isFinal: Boolean(input.end),
    timestamp: Date.now(),
    raw: {
      ...input,
      ...extra,
    },
  }
}

const mapAgentState = (state: AICallAgentState | undefined): AgentState => {
  switch (state) {
    case AICallAgentState.Listening:
      return 'listening'
    case AICallAgentState.Thinking:
      return 'thinking'
    case AICallAgentState.Speaking:
      return 'speaking'
    default:
      return 'thinking'
  }
}

export class AICallService {
  private engine: AliyunAICallEngine | null = null
  private state: AgentState = 'idle'
  private messageListeners = new Set<MessageListener>()
  private stateListeners = new Set<StateListener>()
  private currentSessionId: string | null = null
  private currentUserId: string | null = null
  private lastConfig: VoiceSessionBootstrap | null = null
  private lastTokenRefreshAt = 0

  get currentState(): AgentState {
    return this.state
  }

  private setState(nextState: AgentState): void {
    this.state = nextState
    this.stateListeners.forEach((listener) => {
      try {
        listener(nextState)
      } catch (error) {
        console.error('[AICallService] state listener error:', error)
      }
    })
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener)
    return () => {
      this.messageListeners.delete(listener)
    }
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  private emitMessage(message: SubtitleMessage): void {
    this.messageListeners.forEach((listener) => {
      try {
        listener(message)
      } catch (error) {
        console.error('[AICallService] message listener error:', error)
      }
    })
  }

  async initialize(config: VoiceSessionBootstrap): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('AICallService can only be initialized in a browser environment.')
    }

    if (this.engine) {
      await this.hangup()
    }

    this.setState('connecting')

    const engine = new AliyunAICallEngine()
    this.engine = engine
    this.currentSessionId = config.sessionId
    this.currentUserId = config.userId
    this.lastConfig = config

    engine.on('agentStateChanged', (state: AICallAgentState) => {
      this.setState(mapAgentState(state))
    })

    engine.on('agentSubtitleNotify', (subtitle) => {
      const message = buildSubtitleMessage(subtitle, 'assistant', {
        sentenceId: subtitle?.sentenceId,
      })
      if (message) {
        this.emitMessage(message)
      }
    })

    engine.on('userSubtitleNotify', (subtitle, voiceprintResult) => {
      const message = buildSubtitleMessage(subtitle, 'user', {
        sentenceId: subtitle?.sentenceId,
        voiceprintResult,
      })
      if (message) {
        this.emitMessage(message)
      }
    })

    engine.on('callBegin', () => {
      this.setState('listening')
    })

    engine.on('callEnd', () => {
      this.setState('ended')
    })

    engine.on('errorOccurred', (code: number, msg: string) => {
      console.error('[AICallService] engine error:', { code, msg })
      this.setState('error')
      const lower = (msg || '').toLowerCase()
      const maybeAuth = [401, 403, 512].includes(Number(code)) ||
        lower.includes('token') || lower.includes('auth') || lower.includes('expire') || lower.includes('invalid')
      if (maybeAuth) {
        void this.handleTokenExpiry()
      }
    })

    // Forwarded from underlying ARTC SDK when token is about to expire (<30s)
    engine.on('authInfoWillExpire' as any, () => {
      console.warn('[AICallService] authInfoWillExpire received, attempting token refresh')
      void this.handleTokenExpiry()
    })

    const region = config.agent.region || 'cn-hangzhou'

    try {
      await engine.init(AICallAgentType.VoiceAgent)

      const agentConfig = new AICallAgentConfig()
      const bailianParams = ensureBailianParamsObject(config.agent.bailianAppParams)
      if (agentConfig.llmConfig) {
        agentConfig.llmConfig.bailianAppParams = bailianParams as any
      }

      const chatSyncConfig = new AICallChatSyncConfig(
        config.sessionId,
        config.agent.agentId,
        config.userId,
      )

      const callConfig: AICallConfig = {
        agentId: config.agent.agentId,
        agentType: AICallAgentType.VoiceAgent,
        region,
        userId: config.userId,
        userJoinToken: config.rtc.token,
        agentConfig,
        chatSyncConfig,
      }

      await engine.callWithConfig(callConfig)
      this.setState('listening')
    } catch (error) {
      console.error('[AICallService] initialize error:', error)
      this.setState('error')
      throw error
    }
  }

  interrupt(): void {
    void this.engine?.interruptSpeaking()
  }

  mute(muted: boolean): void {
    void this.engine?.mute(muted)
  }

  setSpeaker(enabled: boolean): void {
    void this.engine?.muteAgentAudioPlaying(!enabled)
  }

  async hangup(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.handup()
      } catch (error) {
        console.error('[AICallService] hangup error:', error)
      }
      this.engine = null
    }
    this.setState('ended')
  }

  async refreshRtcToken(): Promise<boolean> {
    try {
      if (!this.engine || !this.currentSessionId) {
        console.warn('[AICallService] No active engine/session for token refresh')
        return false
      }

      const res = await getVoiceJoinToken(this.currentSessionId)
      if (!res.success || !res.data) {
        console.error('[AICallService] Failed to get refreshed RTC token:', res.error)
        return false
      }

      const newToken = res.data.token
      const anyEngine = this.engine as unknown as Record<string, unknown>
      const candidates = [
        'updateJoinToken',
        'refreshJoinToken',
        'setUserJoinToken',
        'updateUserJoinToken',
      ]

      for (const name of candidates) {
        const fn = anyEngine[name]
        if (typeof fn === 'function') {
          try {
            await (fn as (token: string) => Promise<unknown> | unknown).call(this.engine, newToken)
            return true
          } catch (err) {
            console.warn(`[AICallService] ${name} failed, trying next`, err)
          }
        }
      }

      console.warn('[AICallService] No supported token refresh method found on engine')
      return false
    } catch (error) {
      console.error('[AICallService] refreshRtcToken error:', error)
      return false
    }
  }

  private async handleTokenExpiry(): Promise<void> {
    const now = Date.now()
    if (now - this.lastTokenRefreshAt < 3000) {
      return
    }
    this.lastTokenRefreshAt = now

    const refreshed = await this.refreshRtcToken()
    if (refreshed) return

    await this.reconnectWithNewToken()
  }

  private async reconnectWithNewToken(): Promise<void> {
    try {
      if (!this.currentSessionId || !this.lastConfig) return
      const res = await getVoiceJoinToken(this.currentSessionId)
      if (!res.success || !res.data) {
        console.error('[AICallService] Failed to obtain new token for rejoin:', res.error)
        return
      }

      const newConfig: VoiceSessionBootstrap = {
        ...this.lastConfig,
        rtc: {
          token: res.data.token,
          channelId: res.data.channelId,
          appId: res.data.appId,
          timestamp: res.data.timestamp,
          nonce: res.data.nonce,
        },
        agent: {
          ...this.lastConfig.agent,
          region: res.data.region || this.lastConfig.agent.region,
        },
      }

      await this.hangup()
      await this.initialize(newConfig)
    } catch (error) {
      console.error('[AICallService] reconnectWithNewToken error:', error)
    }
  }
}

export const aiCallService = new AICallService()

export default aiCallService


