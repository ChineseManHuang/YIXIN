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

  res.json({
    success: true,
    data: {
      nodeEnv: env.NODE_ENV,
      has_SB_URL: Boolean(process.env.SB_URL),
      has_SB_SERVICE_ROLE_KEY: Boolean(process.env.SB_SERVICE_ROLE_KEY),
      has_SB_ANON_KEY: Boolean(process.env.SB_ANON_KEY),
      sbUrlFirst40: process.env.SB_URL?.slice(0, 40) ?? null,
      sbAnonKeyLength: process.env.SB_ANON_KEY?.length ?? null,
      clientOriginsCount: env.CLIENT_ORIGINS.length,
      jwtSecretPreview: mask(env.JWT_SECRET),
    },
  })
})

export default router
