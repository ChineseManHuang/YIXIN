/**
 * 消息管理API路由
 * 处理AI咨询对话中的消息发送、接收、历史记录等功能
 */
import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne, TABLES, type KBProgress } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { bailianService } from '../services/bailian.js'
import type { CounselingResponse, UsageStats, EthicsCheckResult } from '../services/bailian.js'
import { KBEngine, type KBProgressAssessment } from '../services/kb-engine.js'
import { EthicsMonitor } from '../services/ethics-monitor.js'
import multer from 'multer'

const router = Router()

// 配置multer用于处理音频文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('只支持音频文件'))
    }
  }
})

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

router.post('/log', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const sessionId = typeof req.body?.session_id === 'string' ? req.body.session_id.trim() : ''
    const senderType = typeof req.body?.sender_type === 'string' ? req.body.sender_type.trim() : ''
    const rawContent = typeof req.body?.content === 'string' ? req.body.content : ''
    const messageType = typeof req.body?.message_type === 'string' ? req.body.message_type : 'text'
    const metadata = isRecord(req.body?.metadata) ? req.body.metadata : {}

    if (!sessionId || rawContent.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Session ID and content are required',
      })
      return
    }

    if (!['user', 'assistant', 'system'].includes(senderType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid sender type',
      })
      return
    }

    const sessionRecord = await queryOne<any>(
      `SELECT id FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    )

    if (!sessionRecord) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    const messageId = uuidv4()
    const now = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.MESSAGES}
       (id, session_id, sender_type, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [messageId, sessionId, senderType, rawContent.trim(), messageType, JSON.stringify(metadata), now],
    )

    await query(
      `UPDATE ${TABLES.SESSIONS}
       SET updated_at = $1
       WHERE id = $2`,
      [now, sessionId],
    )

    res.status(201).json({
      success: true,
      data: {
        message_id: messageId,
      },
    })
  } catch (error) {
    console.error('Log message error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to log message',
    })
  }
})

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
    const sessionRecord = await queryOne<any>(
      `SELECT id, status, title, current_kb_step FROM ${TABLES.SESSIONS}
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    )

    if (!sessionRecord) {
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
    const userMessageId = uuidv4()
    const now = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.MESSAGES}
       (id, session_id, sender_type, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userMessageId, sessionId, 'user', trimmedContent, messageType, JSON.stringify(metadata), now]
    )

    const userMessage = await queryOne<any>(
      `SELECT * FROM ${TABLES.MESSAGES} WHERE id = $1`,
      [userMessageId]
    )

    if (!userMessage) {
      console.error('Save user message error: Failed to retrieve saved message')
      res.status(500).json({
        success: false,
        error: 'Failed to save message',
      })
      return
    }

    // 获取会话和用户信息（包含bailian_session_id）
    const sessionData = await queryOne<any>(
      `SELECT s.*, u.id as user_id, u.email as user_email
       FROM ${TABLES.SESSIONS} s
       INNER JOIN ${TABLES.USERS} u ON s.user_id = u.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [sessionId, userId]
    )

    if (!sessionData) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    const userProfiles = await query<any>(
      `SELECT full_name, age, gender, occupation FROM ${TABLES.USER_PROFILES}
       WHERE user_id = $1`,
      [userId]
    )

    const sessionWithUser = {
      ...sessionData,
      users: {
        id: sessionData.user_id,
        email: sessionData.user_email,
        user_profiles: userProfiles
      }
    } as SessionWithUserProfile

    // 获取或初始化 KB 进度
    let kbProgress: KBProgress | null = await queryOne<KBProgress>(
      `SELECT * FROM ${TABLES.KB_PROGRESS} WHERE session_id = $1`,
      [sessionId]
    )

    if (!kbProgress) {
      try {
        kbProgress = await KBEngine.initializeKBProgress(sessionId, userId)
      } catch (initializeError) {
        console.error('Initialize KB progress error:', initializeError)
      }
    }

    // 获取对话历史（包含最新用户消息）
    const historyData = await query<any>(
      `SELECT sender_type, content, created_at FROM ${TABLES.MESSAGES}
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [sessionId]
    )

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
      bailianSessionId: sessionData.bailian_session_id || undefined,  // 传递百炼session_id
      userProfile: primaryProfile
        ? {
            fullName: primaryProfile.full_name,
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
    let newBailianSessionId: string | undefined = undefined

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
      newBailianSessionId = result.bailianSessionId  // 获取百炼返回的session_id

      // 如果获得了新的百炼session_id，保存到数据库
      if (newBailianSessionId && newBailianSessionId !== sessionData.bailian_session_id) {
        await query(
          `UPDATE ${TABLES.SESSIONS} SET bailian_session_id = $1, updated_at = NOW() WHERE id = $2`,
          [newBailianSessionId, sessionId]
        )
        console.log('[百炼集成] 保存session_id:', newBailianSessionId)
      }

      if (ethicsCheck && (ethicsCheck.riskLevel !== 'low' || ethicsCheck.concerns.length > 0)) {
        const monitorResult = EthicsMonitor.analyzeMessage(trimmedContent, {
          conversationHistory,
          userProfile: context.userProfile,
          sessionId: context.sessionId,
        })
        await EthicsMonitor.logEthicsCheck(sessionId, userId, trimmedContent, monitorResult)
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
    const aiMessageId = uuidv4()
    const aiMessageTime = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.MESSAGES}
       (id, session_id, sender_type, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [aiMessageId, sessionId, 'assistant', aiResponse.content, aiResponse.type, JSON.stringify(aiResponse.metadata), aiMessageTime]
    )

    const aiMessage = await queryOne<any>(
      `SELECT * FROM ${TABLES.MESSAGES} WHERE id = $1`,
      [aiMessageId]
    )

    if (!aiMessage) {
      console.error('Save AI message error: Failed to retrieve saved message')
      res.status(500).json({
        success: false,
        error: 'Failed to save AI response',
      })
      return
    }

    await query(
      `UPDATE ${TABLES.SESSIONS} SET updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), sessionId]
    )

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

    const session = await queryOne<any>(
      `SELECT id FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    )

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    let sql = `SELECT * FROM ${TABLES.MESSAGES} WHERE session_id = $1`
    const params: any[] = [sessionId]

    if (before_id) {
      const beforeMessage = await queryOne<any>(
        `SELECT created_at FROM ${TABLES.MESSAGES} WHERE id = $1`,
        [before_id]
      )

      if (beforeMessage) {
        sql += ` AND created_at < $${params.length + 1}`
        params.push(beforeMessage.created_at)
      }
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(Number(limit), Number(offset))

    const messages = await query<any>(sql, params)

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

    const message = await queryOne<any>(
      `SELECT m.id, s.user_id
       FROM ${TABLES.MESSAGES} m
       INNER JOIN ${TABLES.SESSIONS} s ON m.session_id = s.id
       WHERE m.id = $1`,
      [id]
    )

    if (!message || message.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: 'Message not found or access denied',
      })
      return
    }

    await query(
      `DELETE FROM ${TABLES.MESSAGES} WHERE id = $1`,
      [id]
    )

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
 * 发送语音消息到AI咨询会话
 * POST /api/messages/voice
 */
router.post('/voice', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, message_type = 'audio' } = req.body
    const userId = req.user!.id
    const audioFile = req.file

    if (!session_id || !audioFile) {
      res.status(400).json({
        success: false,
        error: 'Session ID and audio file are required'
      })
      return
    }

    // 验证会话所有权
    const sessionRecord = await queryOne<any>(
      `SELECT id, status, current_kb_step FROM ${TABLES.SESSIONS}
       WHERE id = $1 AND user_id = $2`,
      [session_id, userId]
    )

    if (!sessionRecord) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied'
      })
      return
    }

    if (sessionRecord.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Session is not active'
      })
      return
    }

    // 获取会话完整信息
    const sessionData = await queryOne<any>(
      `SELECT s.*, u.id as user_id, u.email as user_email
       FROM ${TABLES.SESSIONS} s
       INNER JOIN ${TABLES.USERS} u ON s.user_id = u.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [session_id, userId]
    )

    if (!sessionData) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      })
      return
    }

    const userProfiles = await query<any>(
      `SELECT full_name, age, gender, occupation FROM ${TABLES.USER_PROFILES}
       WHERE user_id = $1`,
      [userId]
    )

    const sessionWithUser = {
      ...sessionData,
      users: {
        id: sessionData.user_id,
        email: sessionData.user_email,
        user_profiles: userProfiles
      }
    } as SessionWithUserProfile

    // 获取KB进度
    let kbProgress: KBProgress | null = await queryOne<KBProgress>(
      `SELECT * FROM ${TABLES.KB_PROGRESS} WHERE session_id = $1`,
      [session_id]
    )

    if (!kbProgress) {
      try {
        kbProgress = await KBEngine.initializeKBProgress(session_id, userId)
      } catch (error) {
        console.error('Initialize KB progress error:', error)
      }
    }

    // 获取对话历史
    const historyData = await query<any>(
      `SELECT sender_type, content, created_at FROM ${TABLES.MESSAGES}
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [session_id]
    )

    const conversationHistory = (historyData || []).map(msg => ({
      role: msg.sender_type === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
      timestamp: new Date(msg.created_at)
    }))

    const primaryProfile = sessionWithUser.users.user_profiles?.[0]

    // 构建咨询上下文
    const context = {
      sessionId: session_id,
      userId,
      kbStage: (kbProgress?.current_stage || 'KB-01') as 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05',
      userProfile: primaryProfile ? {
        age: primaryProfile.age,
        gender: primaryProfile.gender,
        occupation: primaryProfile.occupation,
        previousSessions: 0
      } : undefined,
      conversationHistory,
      currentIssues: sessionWithUser.title ? [sessionWithUser.title] : undefined,
      riskLevel: 'low' as const
    }

    // 调用百炼服务处理语音 (带fallback)
    let userTranscript: string
    let aiResponseText: string
    let aiAudioBase64: string | null = null
    let usage: UsageStats | null = null
    let ethicsCheck: EthicsCheckResult | null = null

    try {
      const voiceResponse = await bailianService.generateVoiceCounselingResponse(
        context,
        audioFile.buffer,
        'wav'
      )

      // 语音API应该返回用户的语音转文字结果和AI的回复
      userTranscript = voiceResponse.responseText  // TODO: 这应该是用户的语音转文字
      aiResponseText = voiceResponse.responseText  // AI的回复
      aiAudioBase64 = voiceResponse.responseAudio.toString('base64')
      usage = voiceResponse.usage
      ethicsCheck = voiceResponse.ethicsCheck
    } catch (error) {
      console.error('Voice processing error, falling back to text mode:', error)

      // Fallback: 使用模拟的语音转文字和文本API
      userTranscript = '[语音消息 - 暂时无法转写]'  // 临时占位

      // 使用文本API生成回复
      const textResponse = await bailianService.generateCounselingResponse(context, userTranscript)
      aiResponseText = textResponse.response
      usage = textResponse.usage
      ethicsCheck = textResponse.ethicsCheck
      // 不返回音频
    }

    // 保存用户消息(语音转文字后的内容)
    const userMessageId = uuidv4()
    const userMessageTime = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.MESSAGES}
       (id, session_id, sender_type, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userMessageId,
        session_id,
        'user',
        userTranscript,
        message_type,
        JSON.stringify({
          audio_format: audioFile.mimetype,
          audio_size: audioFile.size
        }),
        userMessageTime
      ]
    )

    const userMessage = await queryOne<any>(
      `SELECT * FROM ${TABLES.MESSAGES} WHERE id = $1`,
      [userMessageId]
    )

    if (!userMessage) {
      res.status(500).json({
        success: false,
        error: 'Failed to save user message'
      })
      return
    }

    // 保存AI回复
    const aiMessageId = uuidv4()
    const aiMessageTime = new Date().toISOString()

    await query(
      `INSERT INTO ${TABLES.MESSAGES}
       (id, session_id, sender_type, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        aiMessageId,
        session_id,
        'assistant',
        aiResponseText,
        'audio',
        JSON.stringify({
          kb_stage: context.kbStage,
          has_audio: !!aiAudioBase64,
          ethics_check: ethicsCheck,
          usage: usage
        }),
        aiMessageTime
      ]
    )

    const aiMessage = await queryOne<any>(
      `SELECT * FROM ${TABLES.MESSAGES} WHERE id = $1`,
      [aiMessageId]
    )

    if (!aiMessage) {
      res.status(500).json({
        success: false,
        error: 'Failed to save AI message'
      })
      return
    }

    // 更新会话时间
    await query(
      `UPDATE ${TABLES.SESSIONS} SET updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), session_id]
    )

    res.status(201).json({
      success: true,
      message: 'Voice message sent successfully',
      data: {
        user_message: userMessage,
        ai_message: aiMessage,
        ai_audio: aiAudioBase64,
        usage: usage,
        ethics_check: ethicsCheck
      }
    })

  } catch (error) {
    console.error('Send voice message error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router






















