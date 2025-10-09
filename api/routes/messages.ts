/**
 * 消息管理API路由
 * 处理AI咨询对话中的消息发送、接收、历史记录等功能
 */
import { Router, type Request, type Response } from 'express'
import { supabase, type KBProgress } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { bailianService, type CounselingResponse, type UsageStats, type EthicsCheckResult } from '../services/bailian'
import { KBEngine, type KBProgressAssessment } from '../services/kb-engine'
import { EthicsMonitor } from '../services/ethics-monitor'

const router = Router()

interface CreateMessageBody {
  session_id?: string
  content?: unknown
  message_type?: string
  metadata?: Record<string, unknown>
}

interface SessionWithUserProfile {
  id: string
  status: 'active' | 'completed' | 'paused'
  title: string
  current_kb_step: number
  users: {
    id: string
    email: string
    user_profiles?: Array<{
      full_name?: string
      age?: number
      gender?: string
      occupation?: string
    }>
  }
}

interface GeneratedResponse {
  content: string
  type: 'text'
  metadata: Record<string, unknown>
}

interface MessageWithSession {
  id: string
  sessions: {
    user_id: string
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
// 所有消息路由都需要认证
router.use(authenticateToken)

/**
 * 发送消息到AI咨询会话
 * POST /api/messages
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = (req.body ?? {}) as Partial<CreateMessageBody>
    const sessionId = typeof body.session_id === 'string' ? body.session_id : ''
    const rawContent = body.content
    const messageType = typeof body.message_type === 'string' ? body.message_type : 'text'
    const metadata = isRecord(body.metadata) ? body.metadata : {}
    const userId = req.user!.id

    if (!sessionId || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Session ID and content are required',
      })
      return
    }

    const trimmedContent = rawContent.trim()

    // 验证会话所有权
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, title, current_kb_step')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError || !sessionRecord) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    if (sessionRecord.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Session is not active',
      })
      return
    }

    // 保存用户消息
    const { data: userMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        sender_type: 'user',
        content: trimmedContent,
        message_type: messageType,
        metadata,
      })
      .select('*')
      .single()

    if (userMessageError || !userMessage) {
      console.error('Save user message error:', userMessageError)
      res.status(500).json({
        success: false,
        error: 'Failed to save message',
      })
      return
    }

    // 获取会话和用户信息
    const { data: sessionData, error: sessionDataError } = await supabase
      .from('sessions')
      .select(`
        *,
        users!inner (
          id,
          email,
          user_profiles (
            full_name,
            age,
            gender,
            occupation
          )
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionDataError || !sessionData) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    const sessionWithUser = sessionData as SessionWithUserProfile

    // 获取或初始化 KB 进度
    let kbProgress: KBProgress | null = null
    const { data: kbProgressRecord, error: kbProgressError } = await supabase
      .from('kb_progress')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (kbProgressRecord) {
      kbProgress = kbProgressRecord
    } else if (kbProgressError && kbProgressError.code !== 'PGRST116') {
      console.error('Get KB progress error:', kbProgressError)
    }

    if (!kbProgress) {
      try {
        kbProgress = await KBEngine.initializeKBProgress(sessionId, userId)
      } catch (initializeError) {
        console.error('Initialize KB progress error:', initializeError)
      }
    }

    // 获取对话历史（包含最新用户消息）
    const { data: historyData, error: historyError } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (historyError) {
      console.error('Load conversation history error:', historyError)
    }

    const conversationHistory = (historyData || []).map((msg) => ({
      role: msg.sender_type === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }))

    const primaryProfile = sessionWithUser.users.user_profiles?.[0]

    const context = {
      sessionId: sessionId,
      userId,
      kbStage: (kbProgress?.current_stage || 'KB-01') as 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05',
      userProfile: primaryProfile
        ? {
            age: primaryProfile.age,
            gender: primaryProfile.gender,
            occupation: primaryProfile.occupation,
            previousSessions: 0, // TODO: 统计历史会话数量
          }
        : undefined,
      conversationHistory,
      currentIssues: sessionWithUser.title ? [sessionWithUser.title] : undefined,
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    }

    // 评估 KB 阶段
    let progressAssessment: KBProgressAssessment | null = null
    try {
      if (kbProgress) {
        progressAssessment = KBEngine.assessStageProgressFromRecord(kbProgress, conversationHistory)
      } else {
        progressAssessment = await KBEngine.assessStageProgress(sessionId, conversationHistory)
      }
    } catch (error: unknown) {
      console.error('KB进度评估失败:', error)
      progressAssessment = {
        currentStage: context.kbStage,
        canProgress: false,
        completionRate: 0,
        missingCriteria: [],
        recommendations: [],
        nextStage: undefined,
      }
    }

    // 调用百炼服务生成回复
    let aiResponse: GeneratedResponse
    let ethicsCheck: EthicsCheckResult | null = null
    let usage: UsageStats | null = null

    try {
      const result: CounselingResponse = await bailianService.generateCounselingResponse(context, trimmedContent)
      aiResponse = {
        content: result.response,
        type: 'text',
        metadata: {
          kb_stage: progressAssessment?.currentStage ?? context.kbStage,
          kb_progress: progressAssessment,
          ethicsCheck: result.ethicsCheck,
          usage: result.usage,
        },
      }
      ethicsCheck = result.ethicsCheck
      usage = result.usage

      if (ethicsCheck && (ethicsCheck.riskLevel !== 'low' || ethicsCheck.concerns.length > 0)) {
        await EthicsMonitor.logEthicsCheck(sessionId, userId, trimmedContent, ethicsCheck)
      }
    } catch (error: unknown) {
      console.error('AI回复生成失败:', error)
      aiResponse = {
        content: '抱歉，我现在遇到了一些技术问题。请稍后再试，或者联系我们的技术支持。您的安全和体验对我们很重要。',
        type: 'text',
        metadata: {
          kb_stage: progressAssessment?.currentStage ?? context.kbStage,
          kb_progress: progressAssessment,
        },
      }
    }

    // 更新 KB 进度
    try {
      const totalMessages = (historyData?.length || 0) + 2 // 本次对话包含用户与AI各一条
      const previousStageMessages = kbProgress?.stage_messages ?? 0
      const currentStageBeforeUpdate = kbProgress?.current_stage || context.kbStage
      const stageMessages = progressAssessment
        ? progressAssessment.currentStage === currentStageBeforeUpdate
          ? previousStageMessages + 2
          : 2
        : previousStageMessages + 2

      await KBEngine.updateKBProgress(sessionId, totalMessages, stageMessages, {
        completionRate: progressAssessment?.completionRate || 0,
        lastAssessment: new Date().toISOString(),
        canProgress: progressAssessment?.canProgress || false,
      })

      if (progressAssessment?.canProgress && progressAssessment.nextStage) {
        const nextStage = await KBEngine.progressToNextStage(sessionId)
        if (nextStage) {
          aiResponse.metadata.stage_transition = {
            from: currentStageBeforeUpdate,
            to: nextStage,
            timestamp: new Date().toISOString(),
          }
          context.kbStage = nextStage
          aiResponse.metadata.kb_stage = nextStage
        }
      }
    } catch (error: unknown) {
      console.error('KB进度更新失败:', error)
    }

    // 保存 AI 回复
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        sender_type: 'ai',
        content: aiResponse.content,
        message_type: aiResponse.type,
        metadata: aiResponse.metadata,
      })
      .select('*')
      .single()

    if (aiMessageError || !aiMessage) {
      console.error('Save AI message error:', aiMessageError)
      res.status(500).json({
        success: false,
        error: 'Failed to save AI response',
      })
      return
    }

    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        user_message: userMessage,
        ai_message: aiMessage,
        usage,
        ethics_check: ethicsCheck,
      },
    })
  } catch (error: unknown) {
    console.error('Send message error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * 获取会话的消息历史
 * GET /api/messages/:sessionId
 */
router.get('/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params
    const { limit = 50, offset = 0, before_id } = req.query
    const userId = req.user!.id

    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (before_id) {
      const { data: beforeMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', before_id)
        .single()

      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at)
      }
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Get messages error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
      })
      return
    }

    const sortedMessages = messages?.slice().reverse() || []

    res.json({
      success: true,
      data: {
        messages: sortedMessages,
        has_more: messages?.length === Number(limit),
      },
    })
  } catch (error: unknown) {
    console.error('Get messages error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * 删除消息
 * DELETE /api/messages/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const { data: message, error: messageError } = await supabase
      .from<MessageWithSession>('messages')
      .select(`
        id,
        sessions!inner(
          user_id
        )
      `)
      .eq('id', id)
      .single()

    if (messageError || !message || message.sessions.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: 'Message not found or access denied',
      })
      return
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete message error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
      })
      return
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    })
  } catch (error: unknown) {
    console.error('Delete message error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * 生成AI回复（临时模拟函数，后续将集成阿里云百炼API）
 */
export default router














