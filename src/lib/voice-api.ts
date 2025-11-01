export interface VoiceJoinTokenResponse {
  appId: string
  token: string
  channelId: string
  timestamp: number
  nonce: string
  region: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()

export async function getVoiceJoinToken(sessionId: string): Promise<ApiResponse<VoiceJoinTokenResponse>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const res = await fetch(`${API_BASE_URL}/voice/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json() : null

  if (!isJson) {
    return { success: false, error: '服务器返回了非 JSON 响应' }
  }

  return payload as ApiResponse<VoiceJoinTokenResponse>
}

