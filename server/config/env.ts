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

const databaseUrl = getEnvValue('DATABASE_URL', { required: true })
const jwtSecret = getEnvValue('JWT_SECRET', {
  fallback: 'dev-jwt-secret-please-change-in-production',
  required: false,
})
const bailianAppId = getEnvValue('BAILIAN_APP_ID', { fallback: '' })
const bailianApiKey = getEnvValue('BAILIAN_API_KEY', { fallback: '' })
const bailianEndpoint = getEnvValue('BAILIAN_ENDPOINT', { fallback: '' })
const bailianAgentId = getEnvValue('BAILIAN_AGENT_ID', { fallback: '' })
const alibabaVoiceApiKey = getEnvValue('ALIBABA_VOICE_API_KEY', { fallback: '' })
const alibabaVoiceApiUrl = getEnvValue('ALIBABA_VOICE_API_URL', { fallback: '' })
const backendDeployHookUrl = getEnvValue('BACKEND_DEPLOY_HOOK_URL')
const frontendDeployHookUrl = getEnvValue('FRONTEND_DEPLOY_HOOK_URL')
const rtcAppId = getEnvValue('RTC_APP_ID', { fallback: '' })
const rtcAppKey = getEnvValue('RTC_APP_KEY', { fallback: '' })
const rtcRegion = getEnvValue('RTC_REGION', { fallback: 'cn-hangzhou' })

export const env = {
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: nodeEnv === 'production',
  PORT: toNumber(process.env.PORT, 3001),
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret,
  CLIENT_ORIGINS: parseList(
    getEnvValue('CLIENT_ORIGINS', {
      fallback: nodeEnv === 'production'
        ? ''
        : 'http://localhost:5173,http://localhost:3000',
    }),
  ),
  BAILIAN_APP_ID: bailianAppId,
  BAILIAN_API_KEY: bailianApiKey,
  BAILIAN_ENDPOINT: bailianEndpoint,
  BAILIAN_AGENT_ID: bailianAgentId,
  ALIBABA_VOICE_API_KEY: alibabaVoiceApiKey,
  ALIBABA_VOICE_API_URL: alibabaVoiceApiUrl,
  BACKEND_DEPLOY_HOOK_URL: backendDeployHookUrl,
  FRONTEND_DEPLOY_HOOK_URL: frontendDeployHookUrl,
  RTC_APP_ID: rtcAppId,
  RTC_APP_KEY: rtcAppKey,
  RTC_REGION: rtcRegion,
}

if (env.IS_PRODUCTION) {
  const missing: string[] = []

  if (!env.DATABASE_URL) missing.push('DATABASE_URL')
  if (!env.JWT_SECRET) missing.push('JWT_SECRET')
  // Bailian-related variables are optional in production.
  // If Bailian features are enabled, route-level checks will warn accordingly.
  if (!env.RTC_APP_ID) missing.push('RTC_APP_ID')
  if (!env.RTC_APP_KEY) missing.push('RTC_APP_KEY')

  if (missing.length > 0) {
    console.error('[env] Missing required production environment variables: ' + missing.join(', '))
    console.error('[env] Please set these in your Alibaba Cloud ECS environment or .env file.')
    // Do not throw - we still allow the server to boot for diagnostics
  }
}

if (env.CLIENT_ORIGINS.length === 0) {
  if (env.IS_PRODUCTION) {
    console.warn('[env] CLIENT_ORIGINS not configured in production. CORS may block requests.')
    console.warn('[env] Set CLIENT_ORIGINS to your frontend domain (e.g., https://yixinaipsy.com)')
  } else {
    console.warn('[env] No CLIENT_ORIGINS configured, using development defaults.')
  }
}
