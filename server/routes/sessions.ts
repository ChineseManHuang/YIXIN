/**
 * �Ự����API·��
 * ����AI��ѯ�Ự�Ĵ�������ȡ�����µȹ���
 */
import { Router, type Request, type Response } from 'express'
import { supabase } from '../config/database.js'
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

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        title: title.trim(),
        status: 'active',
        current_kb_step: 1,
        session_data: {},
      })
      .select('*')
      .single()

    if (error || !session) {
      console.error('Session creation error:', error)
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

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Get sessions error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sessions',
      })
      return
    }

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

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    const { data: kbProgress, error: kbError } = await supabase
      .from('kb_progress')
      .select('*')
      .eq('session_id', id)
      .single()

    if (kbError) {
      console.error('Get KB progress error:', kbError)
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (messagesError) {
      console.error('Get messages error:', messagesError)
    }

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

    const { data: existingSession, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingSession) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (status !== undefined) updateData.status = status
    if (current_kb_step !== undefined) updateData.current_kb_step = current_kb_step
    if (session_data !== undefined) updateData.session_data = session_data

    if (Object.keys(updateData).length === 0) {
      res.json({
        success: true,
        message: 'No changes applied',
        data: { session: existingSession },
      })
      return
    }

    const { data: updatedSession, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Update session error:', error)
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

    const { data: existingSession, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingSession) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      })
      return
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete session error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete session',
      })
      return
    }

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
