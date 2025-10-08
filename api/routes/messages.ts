/**
 * 消息管理API路由
 * 处理AI咨询对话中的消息发送、接收、历史记录等功能
 */
import { Router, type Request, type Response } from 'express'
import { supabase, type KBProgress } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { bailianService } from '../services/bailian'
import { KBEngine } from '../services/kb-engine'
import { EthicsMonitor } from '../services/ethics-monitor'

const router = Router()

// 所有消息路由都需要认证
router.use(authenticateToken)

/**
 * 发送消息到AI咨询会话
 * POST /api/messages
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, content, message_type = 'text', metadata = {} } = req.body
    const userId = req.user!.id

    if (!session_id || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Session ID and content are required',
      })
      return
    }

    const trimmedContent = content.trim()

    // 验证会话所有权
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, title, current_kb_step')
      .eq('id', session_id)
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
        session_id,
        sender_type: 'user',
        content: trimmedContent,
        message_type,
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
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    if (sessionDataError || !sessionData) {
      res.status(404).json({
        success: false,
        error: 'Session not found or access denied',
      })
      return
    }

    // 获取或初始化 KB 进度
    let kbProgress: KBProgress | null = null
    const { data: kbProgressRecord, error: kbProgressError } = await supabase
      .from('kb_progress')
      .select('*')
      .eq('session_id', session_id)
      .single()

    if (kbProgressRecord) {
      kbProgress = kbProgressRecord
    } else if (kbProgressError && kbProgressError.code !== 'PGRST116') {
      console.error('Get KB progress error:', kbProgressError)
    }

    if (!kbProgress) {
      try {
        kbProgress = await KBEngine.initializeKBProgress(session_id, userId)
      } catch (initializeError) {
        console.error('Initialize KB progress error:', initializeError)
      }
    }

    // 获取对话历史（包含最新用户消息）
    const { data: historyData, error: historyError } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('session_id', session_id)
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

    const primaryProfile = sessionData.users.user_profiles?.[0]

    const context = {
      sessionId: session_id,
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
      currentIssues: sessionData.title ? [sessionData.title] : undefined,
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    }

    // 评估 KB 阶段
    let progressAssessment
    try {
      if (kbProgress) {
        progressAssessment = KBEngine.assessStageProgressFromRecord(kbProgress, conversationHistory)
      } else {
        progressAssessment = await KBEngine.assessStageProgress(session_id, conversationHistory)
      }
    } catch (error) {
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
    let aiResponse: { content: string; type: 'text'; metadata: Record<string, any> }
    let ethicsCheck: any = null
    let usage: any = null

    try {
      const result = await bailianService.generateCounselingResponse(context, trimmedContent)
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
        await EthicsMonitor.logEthicsCheck(session_id, userId, trimmedContent, ethicsCheck)
      }
    } catch (error) {
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

      await KBEngine.updateKBProgress(session_id, totalMessages, stageMessages, {
        completionRate: progressAssessment?.completionRate || 0,
        lastAssessment: new Date().toISOString(),
        canProgress: progressAssessment?.canProgress || false,
      })

      if (progressAssessment?.canProgress && progressAssessment.nextStage) {
        const nextStage = await KBEngine.progressToNextStage(session_id)
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
    } catch (error) {
      console.error('KB进度更新失败:', error)
    }

    // 保存 AI 回复
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        session_id,
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
      .eq('id', session_id)

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
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * 获取会话的消息历史
 * GET /api/messages/:session_id
 */
router.get('/:session_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id } = req.params
    const { limit = 50, offset = 0, before_id } = req.query
    const userId = req.user!.id

    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', session_id)
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
      .eq('session_id', session_id)
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
  } catch (error) {
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
      .from('messages')
      .select(`
        id,
        sessions!inner(
          user_id
        )
      `)
      .eq('id', id)
      .single()

    if (messageError || !message || (message.sessions as any).user_id !== userId) {
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
  } catch (error) {
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
async function generateAIResponse(
  userMessage: string,
  currentKbStep: number,
  metadata: any
): Promise<{ content: string; type: string; metadata: any }> {
  // 根据当前KB步骤生成相应的回复
  const kbResponses = {
    1: {
      content: `感谢您开始AI咨询。我是您的专业心理健康顾问。在开始之前，让我为您介绍一下我们的咨询流程。

我们将通过5个步骤来帮助您：
1. EMS介绍和规范化
2. 森林隐喻和河流概念
3. YSQ-S3森林问题评估
4. 分层触发动态树分析
5. RNT评估分层触发

现在，让我们从第一步开始。请告诉我您今天希望探讨的主要问题或困扰是什么？`,
      type: 'text',
      metadata: { kb_step: 1, step_name: 'EMS介绍和规范化' }
    },
    2: {
      content: `很好，现在让我们进入第二步：森林隐喻和河流概念。

想象您的内心世界就像一片森林，每一种情绪和想法都是森林中的不同元素。有些是高大的树木（核心信念），有些是灌木丛（日常想法），还有流淌的河流（情绪流动）。

在这个森林中，您觉得哪些区域是阳光明媚的？哪些区域可能比较阴暗？`,
      type: 'text',
      metadata: { kb_step: 2, step_name: '森林隐喻和河流概念' }
    },
    3: {
      content: `现在我们进入YSQ-S3森林问题评估阶段。这将帮助我们识别您内心森林中可能存在的一些核心模式。

请思考以下几个方面：
- 在人际关系中，您是否经常担心被抛弃？
- 您是否觉得自己不够好，不值得被爱？
- 您是否经常感到需要控制周围的环境？

请分享您对这些问题的感受。`,
      type: 'text',
      metadata: { kb_step: 3, step_name: 'YSQ-S3森林问题' }
    },
    4: {
      content: `基于您的分享，让我们构建您的分层触发动态树。这个树状结构将帮助我们理解您的情绪反应模式。

在您的情绪树中，我看到了几个重要的触发点。让我们深入探讨这些触发因素是如何相互关联的。

您能描述一下最近一次强烈情绪反应的具体情况吗？`,
      type: 'text',
      metadata: { kb_step: 4, step_name: '分层触发动态树' }
    },
    5: {
      content: `最后，让我们进行RNT（重复性负面思维）评估。这将帮助我们识别和处理那些反复出现的负面思维模式。

基于我们之前的对话，我注意到一些可能的RNT模式。让我们一起制定一个个性化的应对策略。

您觉得哪种放松技巧对您最有效？深呼吸、正念冥想，还是其他方法？`,
      type: 'text',
      metadata: { kb_step: 5, step_name: 'RNT评估分层触发' }
    }
  }

  const response = kbResponses[currentKbStep as keyof typeof kbResponses] || {
    content: `感谢您的分享。让我基于您的情况为您提供一些建议和支持。请继续告诉我更多关于您的感受。`,
    type: 'text',
    metadata: { kb_step: currentKbStep }
  }

  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return response
}

export default router


