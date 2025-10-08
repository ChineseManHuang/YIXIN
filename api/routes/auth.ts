/**
 * �û���֤ API ·��
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/database.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * �û�ע��
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'Invalid email format' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' })
      return
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      res.status(409).json({ success: false, error: 'User already exists with this email' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
      })
      .select('id, email, created_at')
      .single()

    if (userError || !newUser) {
      console.error('User creation error:', userError)
      res.status(500).json({ success: false, error: 'Failed to create user' })
      return
    }

    if (full_name) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: newUser.id,
          full_name,
        })
      if (profileError) {
        console.error('User profile creation error:', profileError)
        // 不阻塞用户创建，返回时提示即可
      }
    }

    let token: string
    try {
      token = generateToken(newUser.id, newUser.email)
    } catch (e: any) {
      console.error('Generate token error:', e)
      res.status(500).json({ success: false, error: 'Failed to generate token' })
      return
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
        },
        token,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' })
  }
})

/**
 * �û���¼
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' })
      return
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, created_at')
      .eq('email', email)
      .single()

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .single()

    const token = generateToken(user.id, user.email)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
        },
        token,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' })
  }
})

/**
 * ��ȡ��ǰ�û���Ϣ
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url, phone, date_of_birth, gender, occupation, emergency_contact, preferences')
      .eq('user_id', userId)
      .single()

    res.json({
      success: true,
      data: {
        user,
        profile: profile ?? null,
      },
    })
  } catch (error) {
    console.error('Get user info error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * �û��ǳ�
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    // ��ʵ��Ӧ���У������������¼�ǳ���־����������˻Ự״̬
    res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * 调试：检查 Supabase 读路径
 * GET /api/auth/debug/supabase
 */
router.get('/debug/supabase', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase debug select error:', error)
      res.status(500).json({ success: false, error: error.message || 'Supabase error' })
      return
    }

    res.json({ success: true, data: data ?? [] })
  } catch (e: any) {
    console.error('Supabase debug runtime error:', e)
    res.status(500).json({ success: false, error: e?.message || 'Debug failed' })
  }
})

/**
 * 调试：写入 users 表（使用占位密码）
 * POST /api/auth/debug/insert
 */
router.post('/debug/insert', async (_req: Request, res: Response): Promise<void> => {
  try {
    const email = `debug_${Date.now()}@example.com`
    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash: 'debug' })
      .select('id, email, created_at')
      .single()

    if (error) {
      console.error('Supabase debug insert error:', error)
      res.status(500).json({ success: false, error: error.message || 'Insert failed' })
      return
    }

    res.status(201).json({ success: true, data })
  } catch (e: any) {
    console.error('Supabase debug insert runtime error:', e)
    res.status(500).json({ success: false, error: e?.message || 'Debug insert failed' })
  }
})

export default router
