/**
 * �Ự����API·��
 * ����AI��ѯ�Ự�Ĵ�������ȡ�����µȹ���
 */
import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, TABLES } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { KBEngine } from '../services/kb-engine.js'

const router = Router()

// ���лỰ·�ɶ���Ҫ��֤
router.use(authenticateToken)

/**
 * �����µ���ѯ�Ự
 * POST /api/sessions
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body
    const userId = req.user!.id

    if (!title || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Session title is required',
      })
      return
    }

    const sessionId = uuidv4()
    const now = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.SESSIONS}
       (id, user_id, title, status, current_kb_step, session_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, userId, title.trim(), 'active', 1, '{}', now, now]
    )

    const session = await queryOne<any>(
      `SELECT * FROM ${TABLES.SESSIONS} WHERE id = $1`,
      [sessionId]
    )

    if (!session) {
      console.error('Session creation error: Failed to retrieve created session')
      res.status(500).json({
        success: false,
        error: 'Failed to create session',
      })
      return
    }

    // ��ʼ�� KB ����
    try {
      await KBEngine.initializeKBProgress(session.id, userId)
    } catch (kbError) {
      console.error('Initialize KB progress error:', kbError)
    }

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session },
    })
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * ��ȡ�û������лỰ
 * GET /api/sessions
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { status, limit = 20, offset = 0 } = req.query

    let sql = `SELECT * FROM ${TABLES.SESSIONS} WHERE user_id = $1`
    const params: any[] = [userId]

    if (status) {
      sql += ` AND status = $2`
      params.push(status)
    }

    sql += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(Number(limit), Number(offset))

    const sessions = await query<any>(sql, params)

    res.json({
      success: true,
      data: { sessions },
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * ��ȡ�ض��Ự����
 * GET /api/sessions/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const session = await queryOne<any>(
      `SELECT * FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    const kbProgress = await queryOne<any>(
      `SELECT * FROM ${TABLES.KB_PROGRESS} WHERE session_id = $1`,
      [id]
    )

    const messages = await query<any>(
      `SELECT * FROM ${TABLES.MESSAGES} WHERE session_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [id]
    )

    res.json({
      success: true,
      data: {
        session,
        kb_progress: kbProgress || null,
        recent_messages: messages || [],
      },
    })
  } catch (error) {
    console.error('Get session detail error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * ���»Ự��Ϣ
 * PUT /api/sessions/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { title, status, current_kb_step, session_data } = req.body

    const existingSession = await queryOne<any>(
      `SELECT id FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    if (!existingSession) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(title)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    if (current_kb_step !== undefined) {
      updates.push(`current_kb_step = $${paramIndex++}`)
      values.push(current_kb_step)
    }
    if (session_data !== undefined) {
      updates.push(`session_data = $${paramIndex++}`)
      values.push(JSON.stringify(session_data))
    }

    if (updates.length === 0) {
      res.json({
        success: true,
        message: 'No changes applied',
        data: { session: existingSession },
      })
      return
    }

    updates.push(`updated_at = $${paramIndex++}`)
    values.push(new Date().toISOString())
    values.push(id)

    await query(
      `UPDATE ${TABLES.SESSIONS} SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    const updatedSession = await queryOne<any>(
      `SELECT * FROM ${TABLES.SESSIONS} WHERE id = $1`,
      [id]
    )

    if (!updatedSession) {
      console.error('Update session error: Failed to retrieve updated session')
      res.status(500).json({
        success: false,
        error: 'Failed to update session',
      })
      return
    }

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { session: updatedSession },
    })
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * ɾ���Ự
 * DELETE /api/sessions/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const existingSession = await queryOne<any>(
      `SELECT id FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    if (!existingSession) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    await query(
      `DELETE FROM ${TABLES.SESSIONS} WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'Session deleted successfully',
    })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

export default router
