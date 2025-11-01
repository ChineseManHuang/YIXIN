export interface VoiceSessionConfig {
  session: {
    id: string
    title: string
    status: string
    current_kb_step: number | null
    created_at: string
    updated_at: string
  }
  user: {
    id: string
    full_name: string | null
  }
  rtc: {
    appId: string
    token: string
    channelId: string
    timestamp: number
    nonce: string
  }
  agent: {
    agentId: string
    appId: string
    region: string
    bailianAppParams: Record<string, unknown> | string
  }
}

/**
 * API 客户端配�?
 * 提供与后�?API 的统一通信入口
 */

const trimTrailingSlash = (value: string): string => {
  if (value.endsWith('/')) {
    return value.slice(0, -1)
  }

  return value
}

const getDefaultApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }

  return 'http://localhost:3001/api'
}

const rawApiBaseUrl = import.meta.env.VITE_API_URL || getDefaultApiBaseUrl()
const API_BASE_URL = trimTrailingSlash(rawApiBaseUrl)

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isApiResponse = (value: unknown): value is ApiResponse<unknown> => {
  return isRecord(value) && typeof value.success === 'boolean'
}

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[env] API client config', {
    MODE: import.meta.env.MODE,
    VITE_API_URL: import.meta.env.VITE_API_URL ?? '(fallback to window.origin)',
    RESOLVED_API_BASE_URL: API_BASE_URL,
  })
}

// API 响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface ApiError extends Error {
  name: string
  status?: number
  payload?: unknown
}

const createApiError = (input: unknown): ApiError => {
  if (input instanceof Error) {
    const error = input as ApiError
    error.name = 'ApiError'
    return error
  }

  let message = '请求失败'
  if (typeof input === 'string') {
    message = input
  } else if (isRecord(input) && typeof input.message === 'string') {
    message = input.message
  }

  const error = new Error(message) as ApiError
  error.name = 'ApiError'

  if (isRecord(input)) {
    if (typeof input.status === 'number') {
      error.status = input.status
    }
    if ('payload' in input) {
      error.payload = input.payload
    }
  }

  return error
}

// 用户相关类型
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  bio?: string
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  occupation?: string
  emergency_contact?: string
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 会话相关类型
export interface Session {
  id: string
  user_id: string
  title: string
  status: 'active' | 'completed' | 'paused'
  current_kb_step: number
  session_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 消息相关类型
export interface Message {
  id: string
  session_id: string
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  message_type: 'text' | 'audio' | 'image'
  metadata: Record<string, unknown>
  created_at: string
}

// KB 进度类型
export interface KBProgress {
  id: string
  session_id: string
  user_id: string
  current_stage: 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05'
  stage_progress: Record<string, unknown>
  completion_criteria: Record<string, unknown>
  total_messages: number
  stage_messages: number
  completed_stages: string[]
  created_at: string
  updated_at: string
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean
}

// HTTP 客户端类
class ApiClient {
  private readonly baseUrl: string
  private token: string | null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = null

    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  // 设置认证令牌
  setToken(token: string | null): void {
    this.token = token

    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  // 获取认证令牌
  getToken(): string | null {
    return this.token
  }

    // 通用请求方法
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const { headers: incomingHeaders, ...restOptions } = options
    const headers = new Headers(incomingHeaders ?? {})
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    const shouldAttachToken = !options.skipAuth && this.token && typeof window !== 'undefined'
    if (shouldAttachToken) {
      headers.set('Authorization', `Bearer ${this.token}`)
    }

    const fetchOptions: RequestInit = {
      ...restOptions,
      headers,
    }

    const response = await fetch(url, fetchOptions)

    let payload: unknown = null
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json()
      } catch (error) {
        throw createApiError({
          message: '无法解析服务器返回的 JSON 数据',
          status: response.status,
          payload: error,
        })
      }
    } else {
      payload = await response.text()
    }

    if (!response.ok) {
      const errorPayload = isRecord(payload) ? payload : { message: String(payload) }
      throw createApiError({
        message:
          isRecord(errorPayload) && typeof errorPayload.message === 'string'
            ? errorPayload.message
            : '请求失败',
        status: response.status,
        payload: errorPayload,
      })
    }

    if (!isApiResponse(payload)) {
      throw createApiError({
        message: '������������δ֪��ʽ������',
        status: response.status,
        payload,
      })
    }

    return payload as ApiResponse<T>
  }

  // GET 请求
  private get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  // POST 请求
  private post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    }

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  // PUT 请求
  private put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    }

    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  // DELETE 请求
  private delete(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<unknown>> {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  // 认证相关 API
  async register(email: string, password: string, fullName?: string) {
    return this.post('/auth/register', { email, password, full_name: fullName })
  }

  async login(email: string, password: string) {
    const response = await this.post<{ token: string; user: User; profile: UserProfile }>('/auth/login', {
      email,
      password,
    })

    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async logout() {
    const response = await this.post('/auth/logout')
    this.setToken(null)
    return response
  }

  async getCurrentUser() {
    return this.get<{ user: User; profile: UserProfile }>('/auth/me')
  }

  // 会话相关 API
  async createSession(title: string) {
    return this.post<{ session: Session }>('/sessions', { title })
  }

  async getSessions(status?: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(status && { status }),
    })
    return this.get<{ sessions: Session[] }>(`/sessions?${params}`)
  }

  async getSession(sessionId: string) {
    return this.get<{
      session: Session
      kb_progress: KBProgress[]
      recent_messages: Message[]
    }>(`/sessions/${sessionId}`)
  }

  async updateSession(
    sessionId: string,
    updates: Partial<Pick<Session, 'title' | 'status' | 'current_kb_step' | 'session_data'>>,
  ) {
    return this.put<{ session: Session }>(`/sessions/${sessionId}`, updates)
  }

  async deleteSession(sessionId: string) {
    return this.delete(`/sessions/${sessionId}`)
  }

  // 消息相关 API
  async sendMessage(
    sessionId: string,
    content: string,
    messageType: 'text' | 'audio' | 'image' = 'text',
    metadata: Record<string, unknown> = {},
  ) {
    return this.post<{
      user_message: Message
      ai_message: Message
    }>('/messages', {
      session_id: sessionId,
      content,
      message_type: messageType,
      metadata,
    })
  }

  async logMessage(
    sessionId: string,
    senderType: 'user' | 'assistant' | 'system',
    content: string,
    messageType: 'text' | 'audio' | 'image' = 'text',
    metadata: Record<string, unknown> = {},
  ) {
    return this.post<{ message_id: string }>('/messages/log', {
      session_id: sessionId,
      sender_type: senderType,
      content,
      message_type: messageType,
      metadata,
    })
  }

  async getMessages(sessionId: string, limit = 50, offset = 0, beforeId?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(beforeId && { before_id: beforeId }),
    })
    return this.get<{
      messages: Message[]
      has_more: boolean
    }>(`/messages/${sessionId}?${params}`)
  }

  async deleteMessage(messageId: string) {
    return this.delete(`/messages/${messageId}`)
  }

  // 语音相关 API
  async getVoiceSessionConfig(sessionId?: string, title?: string) {
    const payload: Record<string, unknown> = {}

    if (sessionId && sessionId.trim()) {
      payload.session_id = sessionId.trim()
    }

    if (title && title.trim()) {
      payload.title = title.trim()
    }

    return this.post<VoiceSessionConfig>('/voice/session-config', payload)
  }
}

// 创建 API 客户端实�?
export const apiClient = new ApiClient(API_BASE_URL)

// 导出便捷方法
export const api = {
  // 认证
  auth: {
    register: apiClient.register.bind(apiClient),
    login: apiClient.login.bind(apiClient),
    logout: apiClient.logout.bind(apiClient),
    getCurrentUser: apiClient.getCurrentUser.bind(apiClient),
  },
  // 会话
  sessions: {
    create: apiClient.createSession.bind(apiClient),
    list: apiClient.getSessions.bind(apiClient),
    get: apiClient.getSession.bind(apiClient),
    update: apiClient.updateSession.bind(apiClient),
    delete: apiClient.deleteSession.bind(apiClient),
  },
  // 消息
  messages: {
    send: apiClient.sendMessage.bind(apiClient),
    log: apiClient.logMessage.bind(apiClient),
    list: apiClient.getMessages.bind(apiClient),
    delete: apiClient.deleteMessage.bind(apiClient),
  },
  // 语音
  voice: {
    getSessionConfig: apiClient.getVoiceSessionConfig.bind(apiClient),
  },
}

export default apiClient


