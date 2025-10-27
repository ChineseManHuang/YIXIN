/**
 * Auth routes - PostgreSQL version (replacing Supabase Auth)
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db, query, queryOne, TABLES } from '../config/database.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'

const router = Router()

// Register new user
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

    // Validation
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

    // Check if user already exists
    const existingUser = await queryOne<{ id: string }>(
      `SELECT id FROM ${TABLES.USERS} WHERE email = $1`,
      [normalizedEmail]
    )

    if (existingUser) {
      res.status(409).json(conflictResponse)
      return
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(normalizedPassword, saltRounds)

    // Create user
    const newUserId = uuidv4()
    const now = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.USERS} (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [newUserId, normalizedEmail, passwordHash, now, now]
    )

    // Create user profile if full_name provided
    if (sanitizedFullName) {
      try {
        await query(
          `INSERT INTO ${TABLES.USER_PROFILES} (id, user_id, full_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), newUserId, sanitizedFullName, now, now]
        )
      } catch (profileError) {
        console.error('User profile creation error:', profileError)
        // Don't fail registration if profile creation fails
      }
    }

    // Fetch created user
    const dbUser = await queryOne<{ id: string; email: string; created_at: string }>(
      `SELECT id, email, created_at FROM ${TABLES.USERS} WHERE id = $1`,
      [newUserId]
    )

    const finalUser = dbUser ?? {
      id: newUserId,
      email: normalizedEmail,
      created_at: now,
    }

    // Generate JWT token
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

// Login user
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

    const normalizedEmail = email.trim().toLowerCase()

    // Find user by email
    const userRecord = await queryOne<{ id: string; email: string; password_hash: string; created_at: string }>(
      `SELECT id, email, password_hash, created_at FROM ${TABLES.USERS} WHERE email = $1`,
      [normalizedEmail]
    )

    if (!userRecord) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userRecord.password_hash)

    if (!passwordMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    // Get user profile
    const profile = await queryOne<{ full_name?: string; avatar_url?: string }>(
      `SELECT full_name, avatar_url FROM ${TABLES.USER_PROFILES} WHERE user_id = $1`,
      [userRecord.id]
    )

    // Generate JWT token
    const token = generateToken(userRecord.id, userRecord.email)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userRecord.id,
          email: userRecord.email,
          created_at: userRecord.created_at,
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

// Get current user info
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const user = await queryOne<{ id: string; email: string; created_at: string }>(
      `SELECT id, email, created_at FROM ${TABLES.USERS} WHERE id = $1`,
      [userId]
    )

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    const profile = await queryOne<{
      full_name?: string
      avatar_url?: string
      phone?: string
      age?: number
      gender?: string
      occupation?: string
      emergency_contact?: any
      preferences?: any
    }>(
      `SELECT full_name, avatar_url, phone, age, gender, occupation, emergency_contact, preferences
       FROM ${TABLES.USER_PROFILES} WHERE user_id = $1`,
      [userId]
    )

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

// Logout (JWT is stateless, so this is mainly for client-side cleanup)
router.post('/logout', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Debug endpoint: test database connection
router.get('/debug/db', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<{ id: string }>(
      `SELECT id FROM ${TABLES.USERS} LIMIT 1`
    )

    res.json({ success: true, data: result ?? [] })
  } catch (error: unknown) {
    console.error('Database debug error:', error)
    const message = error instanceof Error ? error.message : 'Debug failed'
    res.status(500).json({ success: false, error: message })
  }
})

// Debug endpoint: test insert
router.post('/debug/insert', async (_req: Request, res: Response): Promise<void> => {
  try {
    const email = `debug_${Date.now()}@example.com`
    const passwordHash = await bcrypt.hash('debug123', 10)
    const userId = uuidv4()
    const now = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.USERS} (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, passwordHash, now, now]
    )

    const user = await queryOne<{ id: string; email: string; created_at: string }>(
      `SELECT id, email, created_at FROM ${TABLES.USERS} WHERE id = $1`,
      [userId]
    )

    res.status(201).json({ success: true, data: user })
  } catch (error: unknown) {
    console.error('Database debug insert error:', error)
    const message = error instanceof Error ? error.message : 'Debug insert failed'
    res.status(500).json({ success: false, error: message })
  }
})

export default router
