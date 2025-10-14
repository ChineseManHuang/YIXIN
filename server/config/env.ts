// Environment configuration helpers
import dotenv from 'dotenv'

const result = dotenv.config()

if (result.error && process.env.NODE_ENV !== 'production') {
  console.warn('[env] Unable to load .env file:', result.error.message)
}

type EnvValueOptions = {
  fallback?: string
  required?: boolean
  allowEmpty?: boolean
}

const getEnvValue = (key: string, options: EnvValueOptions = {}): string => {
  const rawValue = process.env[key]
  const value = rawValue ?? options.fallback

  if (options.required && (!value || (!options.allowEmpty && value.trim() === ''))) {
    throw new Error('Environment variable ' + key + ' is required but was not provided.')
  }

  return value ?? ''
}

const parseList = (value: string | undefined): string[] => {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error('Environment variable expected numeric value but received: ' + value)
  }
  return parsed
}

const nodeEnv = getEnvValue('NODE_ENV', { fallback: 'development' })

const supabaseUrl = getEnvValue('SB_URL', { required: false, fallback: '' })
const supabaseAnonKey = getEnvValue('SB_ANON_KEY', { required: false, fallback: '' })
const supabaseServiceRoleKey = getEnvValue('SB_SERVICE_ROLE_KEY', { required: false, fallback: '' })

const warnIfMismatch = (primaryKey: string, counterpartKeys: string[]): void => {
  const primaryValue = process.env[primaryKey]
  if (!primaryValue) return

  for (const counterpartKey of counterpartKeys) {
    const counterpartValue = process.env[counterpartKey]
    if (!counterpartValue) continue

    if (counterpartValue.trim() !== primaryValue.trim()) {
      console.warn(
        '[env] Mismatch detected between "' + primaryKey + '" and "' + counterpartKey + '". Ensure frontend and backend use the same Supabase project.'
      )
    }
  }
}

warnIfMismatch('SB_URL', ['VITE_SB_URL'])
warnIfMismatch('SB_ANON_KEY', ['VITE_SB_ANON_KEY'])

export const env = {
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: nodeEnv === 'production',
  PORT: toNumber(process.env.PORT, 3001),
  SB_URL: supabaseUrl,
  SB_ANON_KEY: supabaseAnonKey,
  SB_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
  JWT_SECRET: getEnvValue('JWT_SECRET', {
    fallback: 'dev-jwt-secret-please-change-in-production',
    required: false,
  }),
  CLIENT_ORIGINS: parseList(
    getEnvValue('CLIENT_ORIGINS', {
      fallback: nodeEnv === 'production'
        ? ''
        : 'http://localhost:5173,http://localhost:3000',
    }),
  ),
  BAILIAN_API_KEY: getEnvValue('BAILIAN_API_KEY'),
  BAILIAN_ENDPOINT: getEnvValue('BAILIAN_ENDPOINT'),
  ALIBABA_VOICE_API_KEY: getEnvValue('ALIBABA_VOICE_API_KEY'),
  ALIBABA_VOICE_API_URL: getEnvValue('ALIBABA_VOICE_API_URL'),
  BACKEND_DEPLOY_HOOK_URL: getEnvValue('BACKEND_DEPLOY_HOOK_URL'),
  FRONTEND_DEPLOY_HOOK_URL: getEnvValue('FRONTEND_DEPLOY_HOOK_URL'),
}

if (env.IS_PRODUCTION) {
  const requiredKeys: Array<keyof typeof env> = [
    'SB_URL',
    'SB_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ]

  const missing = requiredKeys.filter((key) => {
    const value = env[key]
    if (typeof value === 'number') {
      return false
    }
    if (typeof value === 'string') {
      return value.trim().length === 0
    }
    return value === null || value === undefined
  })

  if (missing.length > 0) {
    console.error('⚠️ Missing required production environment variables: ' + missing.join(', '))
    console.error('⚠️ Please set these in your deployment environment or .env file')
    // Don't throw, just warn - allow the app to start
  }
}

if (env.CLIENT_ORIGINS.length === 0) {
  if (env.IS_PRODUCTION) {
    console.warn('⚠️ CLIENT_ORIGINS not configured in production. CORS may block requests.')
    console.warn('⚠️ Set CLIENT_ORIGINS to your frontend domain (e.g., https://yinxintest99.edgeone.app)')
  } else {
    console.warn('[env] No CLIENT_ORIGINS configured, using development defaults.')
  }
}
