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
import healthRoutes from './routes/health.js'
import { env } from './config/env.js'

const app: express.Application = express()

const allowedOrigins = env.CLIENT_ORIGINS

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      callback(null, true)
      return
    }

    // Allow if in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    // In production, be strict; in development, be permissive
    if (!env.IS_PRODUCTION) {
      console.warn(`[CORS] Allowing non-whitelisted origin in dev: ${origin}`)
      callback(null, true)
      return
    }

    callback(new Error('Origin not allowed by CORS: ' + origin), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.options('*', cors(corsOptions), (_req, res) => {
  res.sendStatus(204)
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/', healthRoutes)

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
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _req
  void _next
  try {
    const stack = error instanceof Error ? error.stack : undefined
    console.error('Unhandled error:', stack ?? error)
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError)
  }

  const message = error instanceof Error ? error.message : 'Server internal error'
  res.status(500).json({
    success: false,
    error: message,
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
