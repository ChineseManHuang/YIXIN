/**
 * �û���֤ API ·��
 */
import { Router, type Request, type Response } from 'express'
import { supabase, supabaseAnonClient } from '../config/database.js'
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

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUserError) {
      console.error('Supabase user lookup error:', existingUserError)
      res.status(500).json({ success: false, error: 'Failed to verify user availability' })
      return
    }

    if (existingUser) {
      res.status(409).json({ success: false, error: 'User already exists with this email' })
      return
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createUserError || !createdUser?.user) {
      console.error('Supabase auth create user error:', createUserError)
      const isDuplicate = createUserError?.status === 422
      res.status(isDuplicate ? 409 : 500).json({
        success: false,
        error: isDuplicate ? 'User already exists with this email' : createUserError?.message || 'Failed to create user',
      })
      return
    }

    const newUserId = createdUser.user.id

    if (full_name) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: newUserId,
          full_name,
        })
      if (profileError) {
        console.error('User profile creation error:', profileError)
      }
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', newUserId)
      .maybeSingle()

    let token
    try {
      token = generateToken(newUserId, email)
    } catch (e) {
      console.error('Generate token error:', e)
      res.status(500).json({ success: false, error: 'Failed to generate token' })
      return
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userRecord ?? {
          id: newUserId,
          email,
          created_at: createdUser.user.created_at ?? new Date().toISOString(),
        },
        token,
      },
    })
  } catch (error) {
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

    const { data: authData, error: authError } = await supabaseAnonClient.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData?.user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    const userId = authData.user.id

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      console.error('Fetch user record error:', userError)
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()

    const token = generateToken(userId, authData.user.email ?? email)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userId,
          email: authData.user.email ?? email,
          created_at: userRecord?.created_at ?? authData.user.created_at ?? new Date().toISOString(),
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' })
  }
})

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
 * 调试：检�?Supabase 读路�? * GET /api/auth/debug/supabase
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
 * 调试：写�?users 表（使用占位密码�? * POST /api/auth/debug/insert
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
