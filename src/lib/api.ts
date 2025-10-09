/**
 * API锟酵伙拷锟斤拷锟斤拷锟斤拷
 * 锟斤拷锟斤拷锟斤拷锟斤拷API锟斤拷通锟斤拷
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

if (import.meta.env.DEV) {
  console.log('[env] API client config', {
    MODE: import.meta.env.MODE,
    has_VITE_SB_URL: Boolean(import.meta.env.VITE_SB_URL),
    anonKeyLength: import.meta.env.VITE_SB_ANON_KEY?.length ?? 0,
    VITE_API_URL: import.meta.env.VITE_API_URL ?? '(fallback to window.origin)',
    RESOLVED_API_BASE_URL: API_BASE_URL,
  })
}

// API鍝嶅簲绫诲瀷瀹氫箟
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

  let message = '????'
  if (typeof input === 'string') {
    message = input
  } else if (isRecord(input) && typeof input['message'] === 'string') {
    message = input['message'] as string
  }


  const error = new Error(message) as ApiError
  error.name = 'ApiError'

  if (typeof input === 'object' && input !== null) {
    const record = input as Record<string, unknown>
    const status = record['status']
    if (typeof status === 'number') {
      error.status = status
    }
    if ('payload' in record) {
      error.payload = record['payload']
    }
  }


  return error
}

// 鐢ㄦ埛鐩稿叧绫诲瀷
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

// 浼氳瘽鐩稿叧绫诲瀷
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

// 娑堟伅鐩稿叧绫诲瀷
export interface Message {
  id: string
  session_id: string
  sender_type: 'user' | 'ai'
  content: string
  message_type: 'text' | 'audio' | 'image'
  metadata: Record<string, unknown>
  created_at: string
}

// KB杩涘害绫诲瀷
export interface KBProgress {
  id: string
  session_id: string
  kb_step: number
  step_name: string
  status: 'pending' | 'in_progress' | 'completed'
  step_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// HTTP瀹㈡埛绔被
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('auth_token')
  }

  // 璁剧疆璁よ瘉浠ょ墝
  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  // 鑾峰彇璁よ瘉浠ょ墝
  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token')
  }

  // 閫氱敤璇锋眰鏂规硶
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      // 妫€鏌ュ搷搴旀槸鍚︿负 JSON 鏍煎紡
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(`Unexpected non-JSON response: ${text.substring(0, 100)}...`)
      }
      
      const data = await response.json()

      if (!response.ok) {
        const error = createApiError(
          (data as { error?: string })?.error || `HTTP error! status: ${response.status}`
        )
        error.status = response.status
        error.payload = data
        throw error
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      
      // Provide clearer message when JSON parsing fails
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw createApiError('Invalid JSON format in server response')
      }

      throw createApiError(error)
    }
  }

  // GET璇锋眰
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST璇锋眰
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT璇锋眰
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE璇锋眰
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // 璁よ瘉鐩稿叧API
  async register(email: string, password: string, fullName?: string) {
    return this.post('/auth/register', { email, password, full_name: fullName })
  }

  async login(email: string, password: string) {
    const response = await this.post<{ token: string; user: User; profile: UserProfile }>('/auth/login', { email, password })
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

  // 浼氳瘽鐩稿叧API
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
    updates: Partial<Pick<Session, 'title' | 'status' | 'current_kb_step' | 'session_data'>>
  ) {
    return this.put<{ session: Session }>(`/sessions/${sessionId}`, updates)
  }

  async deleteSession(sessionId: string) {
    return this.delete(`/sessions/${sessionId}`)
  }

  // 娑堟伅鐩稿叧API
  async sendMessage(
    sessionId: string,
    content: string,
    messageType: 'text' | 'audio' | 'image' = 'text',
    metadata: Record<string, unknown> = {}
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

  async getMessages(
    sessionId: string,
    limit = 50,
    offset = 0,
    beforeId?: string
  ) {
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
}

// 鍒涘缓API瀹㈡埛绔疄锟?
export const apiClient = new ApiClient(API_BASE_URL)

// 瀵煎嚭渚挎嵎鏂规硶
export const api = {
  // 璁よ瘉
  auth: {
    register: apiClient.register.bind(apiClient),
    login: apiClient.login.bind(apiClient),
    logout: apiClient.logout.bind(apiClient),
    getCurrentUser: apiClient.getCurrentUser.bind(apiClient),
  },
  // 浼氳瘽
  sessions: {
    create: apiClient.createSession.bind(apiClient),
    list: apiClient.getSessions.bind(apiClient),
    get: apiClient.getSession.bind(apiClient),
    update: apiClient.updateSession.bind(apiClient),
    delete: apiClient.deleteSession.bind(apiClient),
  },
  // 娑堟伅
  messages: {
    send: apiClient.sendMessage.bind(apiClient),
    list: apiClient.getMessages.bind(apiClient),
    delete: apiClient.deleteMessage.bind(apiClient),
  },
}

export default apiClient





