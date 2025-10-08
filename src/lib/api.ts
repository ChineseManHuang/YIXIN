/**
 * API�ͻ�������
 * ��������API��ͨ��
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

const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || getDefaultApiBaseUrl())

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
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
  preferences: Record<string, any>
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
  session_data: Record<string, any>
  created_at: string
  updated_at: string
}

// 消息相关类型
export interface Message {
  id: string
  session_id: string
  sender_type: 'user' | 'ai'
  content: string
  message_type: 'text' | 'audio' | 'image'
  metadata: Record<string, any>
  created_at: string
}

// KB进度类型
export interface KBProgress {
  id: string
  session_id: string
  kb_step: number
  step_name: string
  status: 'pending' | 'in_progress' | 'completed'
  step_data: Record<string, any>
  created_at: string
  updated_at: string
}

// HTTP客户端类
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('auth_token')
  }

  // 设置认证令牌
  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  // 获取认证令牌
  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token')
  }

  // 通用请求方法
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
      
      // 检查响应是否为 JSON 格式
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(`服务器返回了非 JSON 格式的响应: ${text.substring(0, 100)}...`)
      }
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      
      // 如果是 JSON 解析错误，提供更友好的错误信息
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw new Error('服务器响应格式错误，请稍后重试')
      }
      
      throw error
    }
  }

  // GET请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // 认证相关API
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

  // 会话相关API
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

  // 消息相关API
  async sendMessage(
    sessionId: string,
    content: string,
    messageType: 'text' | 'audio' | 'image' = 'text',
    metadata: Record<string, any> = {}
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

// 创建API客户端实�?
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
    list: apiClient.getMessages.bind(apiClient),
    delete: apiClient.deleteMessage.bind(apiClient),
  },
}

export default apiClient
