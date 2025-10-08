/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors, { type CorsOptions } from 'cors'
import authRoutes from './routes/auth.js'
import sessionsRoutes from './routes/sessions.js'
import messagesRoutes from './routes/messages.js'
import voiceRoutes from './routes/voice.js'
import { env } from './config/env.js'

const app: express.Application = express()

const corsOrigin = env.CLIENT_ORIGINS.length > 0 ? env.CLIENT_ORIGINS : true

const corsOptions: CorsOptions = {
  origin: corsOrigin,
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/voice', voiceRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
  try {
    console.error('Unhandled error:', error?.stack || error)
  } catch (_e) {}
  res.status(500).json({
    success: false,
    error: error?.message || 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
