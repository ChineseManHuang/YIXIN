/**
 * Auth routes
 */
import { Router, type Request, type Response } from 'express'
import { supabase, supabaseAnonClient } from '../config/database.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const conflictResponse = { success: false, error: 'User already exists with this email' }

  try {
    const { email, password, full_name } = (req.body ?? {}) as {
      email?: unknown
      password?: unknown
      full_name?: unknown
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedPassword = typeof password === 'string' ? password : ''
    const sanitizedFullName = typeof full_name === 'string' ? full_name.trim() : undefined

    if (!normalizedEmail || !normalizedPassword) {
      res.status(400).json({ success: false, error: 'Email and password are required' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({ success: false, error: 'Invalid email format' })
      return
    }

    if (normalizedPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' })
      return
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingUserError) {
      console.error('Supabase user lookup error:', existingUserError)
      res.status(500).json({ success: false, error: 'Failed to verify user availability' })
      return
    }

    if (existingUser) {
      res.status(409).json(conflictResponse)
      return
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: normalizedPassword,
      email_confirm: true,
    })

    if (createUserError || !createdUser?.user) {
      console.error('Supabase auth create user error:', createUserError)
      const isDuplicate = createUserError?.status === 422
      const isUnauthorized = createUserError?.status === 401 || createUserError?.code === 'PGRST301'
      const status = isDuplicate ? 409 : isUnauthorized ? 500 : 500
      const message = isUnauthorized
        ? 'Supabase admin access denied. Verify SB_URL and SB_SERVICE_ROLE_KEY.'
        : createUserError?.message || 'Failed to create user'

      res.status(status).json(
        isDuplicate
          ? conflictResponse
          : { success: false, error: message }
      )
      return
    }

    const newUserId = createdUser.user.id

    if (sanitizedFullName) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({ user_id: newUserId, full_name: sanitizedFullName })

      if (profileError) {
        console.error('User profile creation error:', profileError)
      }
    }

    const { data: adminUser, error: adminUserError } = await supabase.auth.admin.getUserById(newUserId)
    if (adminUserError) {
      console.error('Supabase auth fetch user error:', adminUserError)
    }

    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', newUserId)
      .maybeSingle()

    if (dbUserError) {
      console.error('Fetch user record error:', dbUserError)
    }

    const fallbackCreatedAt = createdUser.user.created_at ?? new Date().toISOString()
    const finalUser = dbUser ?? (adminUser?.user
      ? {
          id: adminUser.user.id,
          email: adminUser.user.email ?? normalizedEmail,
          created_at: adminUser.user.created_at ?? fallbackCreatedAt,
        }
      : {
          id: newUserId,
          email: normalizedEmail,
          created_at: fallbackCreatedAt,
        })

    let token: string
    try {
      token = generateToken(newUserId, finalUser.email)
    } catch (generateError) {
      console.error('Generate token error:', generateError)
      res.status(500).json({ success: false, error: 'Failed to generate token' })
      return
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: finalUser,
        token,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = (req.body ?? {}) as {
      email?: string
      password?: string
    }

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
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' })
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

router.post('/logout', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

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
  } catch (error: unknown) {
    console.error('Supabase debug runtime error:', error)
    const message = error instanceof Error ? error.message : 'Debug failed'
    res.status(500).json({ success: false, error: message })
  }
})

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
  } catch (error: unknown) {
    console.error('Supabase debug insert runtime error:', error)
    const message = error instanceof Error ? error.message : 'Debug insert failed'
    res.status(500).json({ success: false, error: message })
  }
})

export default router
