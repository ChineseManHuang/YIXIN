// Direct PostgreSQL connection (replacing Supabase)
import { Pool } from 'pg'

// JSON types
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonRecord = Record<string, JsonValue>

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

// Test connection on startup
pool.on('connect', () => {
  console.log('[database] Connected to PostgreSQL')
})

pool.on('error', (err) => {
  console.error('[database] Unexpected error on idle client', err)
})

// Export pool for direct queries
export const db = pool

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows
}

// Helper function for single row queries
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params)
  return result.rows[0] || null
}

// Legacy exports for backward compatibility (these will be replaced gradually)
export const supabase = {
  from: (table: string) => {
    console.warn(`[database] Direct Supabase client usage detected for table: ${table}. Consider using pg query instead.`)
    throw new Error('Supabase client is no longer available. Use pg queries instead.')
  }
}
export const supabaseAdmin = supabase
export const supabaseAnonClient = supabase

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  SESSIONS: 'sessions',
  MESSAGES: 'messages',
  KB_PROGRESS: 'kb_progress',
  ETHICS_LOGS: 'ethics_logs',
  RESOURCES: 'resources',
  USER_RESOURCE_ACCESS: 'user_resource_access',
  VOICE_LOGS: 'voice_logs',
} as const

// 类型定义（与迁移脚本保持一致）
export interface User {
  id: string
  email: string
  password_hash: string
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
