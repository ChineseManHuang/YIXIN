/**
 * ��Ϣ����API·��
 * ����AI��ѯ�Ի��е���Ϣ���͡����ա���ʷ��¼�ȹ���
 */
import { Router, type Request, type Response } from 'express'
import { supabase, type KBProgress } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { bailianService } from '../services/bailian'
import { KBEngine } from '../services/kb-engine'
import { EthicsMonitor } from '../services/ethics-monitor'

const router = Router()

// ������Ϣ·�ɶ���Ҫ��֤
router.use(authenticateToken)

/**
 * ������Ϣ��AI��ѯ�Ự
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

    // ��֤�Ự����Ȩ
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

    // �����û���Ϣ
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

    // ��ȡ�Ự���û���Ϣ
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

    // ��ȡ���ʼ�� KB ����
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

    // ��ȡ�Ի���ʷ�����������û���Ϣ��
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
            previousSessions: 0, // TODO: ͳ����ʷ�Ự����
          }
        : undefined,
      conversationHistory,
      currentIssues: sessionData.title ? [sessionData.title] : undefined,
      riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
    }

    // ���� KB �׶�
    let progressAssessment
    try {
      if (kbProgress) {
        progressAssessment = KBEngine.assessStageProgressFromRecord(kbProgress, conversationHistory)
      } else {
        progressAssessment = await KBEngine.assessStageProgress(session_id, conversationHistory)
      }
    } catch (error) {
      console.error('KB��������ʧ��:', error)
      progressAssessment = {
        currentStage: context.kbStage,
        canProgress: false,
        completionRate: 0,
        missingCriteria: [],
        recommendations: [],
        nextStage: undefined,
      }
    }

    // ���ð����������ɻظ�
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
      console.error('AI�ظ�����ʧ��:', error)
      aiResponse = {
        content: '��Ǹ��������������һЩ�������⡣���Ժ����ԣ�������ϵ���ǵļ���֧�֡����İ�ȫ����������Ǻ���Ҫ��',
        type: 'text',
        metadata: {
          kb_stage: progressAssessment?.currentStage ?? context.kbStage,
          kb_progress: progressAssessment,
        },
      }
    }

    // ���� KB ����
    try {
      const totalMessages = (historyData?.length || 0) + 2 // ���ζԻ������û���AI��һ��
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
      console.error('KB���ȸ���ʧ��:', error)
    }

    // ���� AI �ظ�
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
 * ��ȡ�Ự����Ϣ��ʷ
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
 * ɾ����Ϣ
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
 * ����AI�ظ�����ʱģ�⺯�������������ɰ����ư���API��
 */
async function generateAIResponse(
  userMessage: string,
  currentKbStep: number,
  metadata: any
): Promise<{ content: string; type: string; metadata: any }> {
  // ���ݵ�ǰKB����������Ӧ�Ļظ�
  const kbResponses = {
    1: {
      content: `��л����ʼAI��ѯ����������רҵ���������ʡ��ڿ�ʼ֮ǰ������Ϊ������һ�����ǵ���ѯ���̡�

���ǽ�ͨ��5����������������
1. EMS���ܺ͹淶��
2. ɭ�������ͺ�������
3. YSQ-S3ɭ����������
4. �ֲ㴥����̬������
5. RNT�����ֲ㴥��

���ڣ������Ǵӵ�һ����ʼ���������������ϣ��̽�ֵ���Ҫ�����������ʲô��`,
      type: 'text',
      metadata: { kb_step: 1, step_name: 'EMS���ܺ͹淶��' }
    },
    2: {
      content: `�ܺã����������ǽ���ڶ�����ɭ�������ͺ������

�������������������һƬɭ�֣�ÿһ���������뷨����ɭ���еĲ�ͬԪ�ء���Щ�Ǹߴ����ľ�������������Щ�ǹ�ľ�ԣ��ճ��뷨�����������ʵĺ�����������������

�����ɭ���У���������Щ�������������ĵģ���Щ������ܱȽ�������`,
      type: 'text',
      metadata: { kb_step: 2, step_name: 'ɭ�������ͺ�������' }
    },
    3: {
      content: `�������ǽ���YSQ-S3ɭ�����������׶Ρ��⽫��������ʶ��������ɭ���п��ܴ��ڵ�һЩ����ģʽ��

��˼�����¼������棺
- ���˼ʹ�ϵ�У����Ƿ񾭳����ı�������
- ���Ƿ�����Լ������ã���ֵ�ñ�����
- ���Ƿ񾭳��е���Ҫ������Χ�Ļ�����

�����������Щ����ĸ��ܡ�`,
      type: 'text',
      metadata: { kb_step: 3, step_name: 'YSQ-S3ɭ������' }
    },
    4: {
      content: `�������ķ��������ǹ������ķֲ㴥����̬���������״�ṹ�����������������������Ӧģʽ��

�������������У��ҿ����˼�����Ҫ�Ĵ����㡣����������̽����Щ��������������໥�����ġ�

��������һ�����һ��ǿ��������Ӧ�ľ��������`,
      type: 'text',
      metadata: { kb_step: 4, step_name: '�ֲ㴥����̬��' }
    },
    5: {
      content: `��������ǽ���RNT���ظ��Ը���˼ά���������⽫��������ʶ��ʹ�����Щ�������ֵĸ���˼άģʽ��

��������֮ǰ�ĶԻ�����ע�⵽һЩ���ܵ�RNTģʽ��������һ���ƶ�һ�����Ի���Ӧ�Բ��ԡ�

���������ַ��ɼ��ɶ�������Ч�������������ڤ�룬��������������`,
      type: 'text',
      metadata: { kb_step: 5, step_name: 'RNT�����ֲ㴥��' }
    }
  }

  const response = kbResponses[currentKbStep as keyof typeof kbResponses] || {
    content: `��л���ķ������һ����������Ϊ���ṩһЩ�����֧�֡�����������Ҹ���������ĸ��ܡ�`,
    type: 'text',
    metadata: { kb_step: currentKbStep }
  }

  // ģ��API�����ӳ�
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return response
}

export default router


