import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/database.js'
import { env } from '../config/env.js'

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
    }
  }
}

// JWT密钥
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
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      })
      return
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // 从数据库验证用户是否存在
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token or user not found',
      })
      return
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
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
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', decoded.userId)
        .single()

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
        }
      }
    }

    next()
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next()
  }
}
