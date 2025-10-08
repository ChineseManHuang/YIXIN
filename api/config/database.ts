// env keys renamed: SUPABASE_* -> SB_*, VITE_SUPABASE_* -> VITE_SB_*
import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

const supabaseUrl = env.SB_URL
const supabaseServiceRoleKey = env.SB_SERVICE_ROLE_KEY
const supabaseAnonKey = env.SB_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SB_URL or SB_SERVICE_ROLE_KEY. Set them in server/Edge Function secrets.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing SB_ANON_KEY. Set it in server/Edge Function secrets when sharing anon client.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const supabase = supabaseAdmin

export const supabaseAnonClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  emergency_contact?: Record<string, any>
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string
  status: 'active' | 'completed' | 'paused'
  current_kb_step: number
  session_data: Record<string, any>
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
  metadata: Record<string, any>
  created_at: string
}

export interface KBProgress {
  id: string
  session_id: string
  user_id: string
  current_stage: 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05'
  stage_progress: Record<string, any>
  completion_criteria: Record<string, any>
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
  detected_patterns: Record<string, any>[]
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

