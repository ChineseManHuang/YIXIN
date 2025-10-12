// Supabase server-side clients
import { createClient } from '@supabase/supabase-js'

const requireEnv = (key: 'SB_URL' | 'SB_SERVICE_ROLE_KEY' | 'SB_ANON_KEY'): string => {
  const rawValue = process.env[key]
  if (!rawValue || rawValue.trim() === '') {
    throw new Error('[supabase] Missing required environment variable: ' + key)
  }

  const normalized = rawValue.trim()
  process.env[key] = normalized
  return normalized
}

requireEnv('SB_URL')
requireEnv('SB_SERVICE_ROLE_KEY')
const supabaseAnonKey = requireEnv('SB_ANON_KEY')

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonRecord = Record<string, JsonValue>

export const supabaseAdmin = createClient(process.env.SB_URL!, process.env.SB_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const supabase = supabaseAdmin

export const supabaseAnonClient = createClient(process.env.SB_URL!, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  SESSIONS: 'sessions',
  MESSAGES: 'messages',
  KB_PROGRESS: 'kb_progress',
  ETHICS_LOGS: 'ethics_logs',
  RESOURCES: 'resources',
} as const

// 类型定义（与迁移脚本保持一致）
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
  age?: number
  gender?: string
  occupation?: string
  emergency_contact?: JsonRecord
  preferences?: JsonRecord
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string
  status: 'active' | 'completed' | 'paused'
  current_kb_step: number
  session_data: JsonRecord
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface Message {
  id: string
  session_id: string
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  message_type: string
  metadata: JsonRecord
  created_at: string
}

export interface KBProgress {
  id: string
  session_id: string
  user_id: string
  current_stage: 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05'
  stage_progress: JsonRecord
  completion_criteria: JsonRecord
  total_messages: number
  stage_messages: number
  completed_stages: string[]
  created_at: string
  updated_at: string
}

export interface EthicsLog {
  id: string
  session_id: string
  user_id: string
  message_content: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_types: string[]
  concerns: string[]
  recommendations: string[]
  confidence_score: number
  detected_patterns: JsonRecord[]
  action_taken: 'monitored' | 'blocked' | 'alerted' | 'escalated'
  created_at: string
}

export interface EthicsCheckResult {
  isEthical?: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  concerns: string[]
  recommendations: string[]
  shouldBlock: boolean
  riskTypes?: string[]
  confidence?: number
  detectedPatterns?: string[]
}

