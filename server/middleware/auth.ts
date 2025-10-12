import { Request, Response, NextFunction } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { supabase } from '../config/database.js'
import { env } from '../config/env.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string
      email: string
    }
  }
}

interface AuthTokenPayload extends JwtPayload {
  userId: string
  email: string
}

const isAuthTokenPayload = (payload: unknown): payload is AuthTokenPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  const candidate = payload as Partial<AuthTokenPayload>
  return typeof candidate.userId === 'string' && typeof candidate.email === 'string'
}

const JWT_SECRET = env.JWT_SECRET

/**
 * 验证JWT令牌的中间件
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    if (!isAuthTokenPayload(decoded)) {
      res.status(401).json({
        success: false,
        error: 'Invalid token payload',
      })
      return
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      res.status(401).json({
        success: false,
        error: userError?.message || 'Invalid token or user not found',
      })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    const message = error instanceof Error ? error.message : 'Invalid or expired token'
    res.status(403).json({
      success: false,
      error: message,
    })
  }
}

/**
 * 生成JWT令牌
 */
export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' },
  )
}

/**
 * 可选的认证中间件（不强制要求登录）
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  void _res
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      next()
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    if (!isAuthTokenPayload(decoded)) {
      next()
      return
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', decoded.userId)
      .single()

    if (!userError && user) {
      req.user = {
        id: user.id,
        email: user.email,
      }
    }
  } catch (error) {
    console.warn('Optional auth failed:', error)
  }

  next()
}
