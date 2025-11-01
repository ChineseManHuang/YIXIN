import { Router, type Request, type Response } from 'express'
import { env } from '../config/env.js'

const router = Router()

const mask = (value: string): string => {
  if (value.length <= 8) {
    return '*'.repeat(value.length)
  }
  return value.slice(0, 4) + '...' + value.slice(-4)
}

router.get('/health/env', (req: Request, res: Response): void => {
  if (env.IS_PRODUCTION) {
    res.status(404).json({ success: false, error: 'Not found' })
    return
  }

  let databaseHost: string | null = null
  try {
    const url = new URL(env.DATABASE_URL)
    databaseHost = url.hostname + ':' + url.port
  } catch {
    databaseHost = null
  }

  res.json({
    success: true,
    data: {
      nodeEnv: env.NODE_ENV,
      has_DATABASE_URL: Boolean(env.DATABASE_URL),
      databaseHost,
      has_BAILIAN_APP_ID: Boolean(env.BAILIAN_APP_ID),
      has_BAILIAN_API_KEY: Boolean(env.BAILIAN_API_KEY),
      clientOriginsCount: env.CLIENT_ORIGINS.length,
      jwtSecretPreview: mask(env.JWT_SECRET),
    },
  })
})

export default router
