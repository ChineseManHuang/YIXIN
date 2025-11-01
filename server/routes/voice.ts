import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'

import { voiceService, VoiceService } from '../services/voice.js'
import { authenticateToken } from '../middleware/auth.js'
import { query, queryOne, TABLES, type KBProgress } from '../config/database.js'
import { generateRtcToken } from '../services/rtc-token.js'
import { env } from '../config/env.js'
import { KBEngine } from '../services/kb-engine.js'

const router = Router()

// 获取新的 RTC 加入令牌（用于刷新）
router.post('/token', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { session_id: sessionId } = req.body ?? {}

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ success: false, error: '缺少有效的 session_id' })
      return
    }

    // 校验会话归属
    const session = await queryOne<any>(
      `SELECT id FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    )

    if (!session) {
      res.status(404).json({ success: false, error: '会话不存在或无权访问' })
      return
    }

    const rtc = generateRtcToken({ channelId: sessionId, userId })

    res.status(200).json({
      success: true,
      data: {
        appId: env.RTC_APP_ID,
        token: rtc.token,
        channelId: sessionId,
        timestamp: rtc.timestamp,
        nonce: rtc.nonce,
        region: env.RTC_REGION,
      },
    })
  } catch (error) {
    console.error('Generate RTC token error:', error)
    res.status(500).json({ success: false, error: '生成RTC令牌失败' })
  }
})

router.post('/session-config', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!env.BAILIAN_AGENT_ID || !env.BAILIAN_APP_ID) {
      res.status(500).json({
        success: false,
        error: 'Bailian agent is not configured. Please provide BAILIAN_AGENT_ID and BAILIAN_APP_ID.',
      })
      return
    }

    const userId = req.user!.id
    const { session_id: sessionIdFromBody, title } = req.body ?? {}
    let sessionId = typeof sessionIdFromBody === 'string' && sessionIdFromBody.trim().length > 0
      ? sessionIdFromBody.trim()
      : ''
    const now = new Date().toISOString()

    let sessionRecord: any | null = null

    if (sessionId) {
      sessionRecord = await queryOne<any>(
        `SELECT * FROM ${TABLES.SESSIONS} WHERE id = $1 AND user_id = $2`,
        [sessionId, userId],
      )

      if (!sessionRecord) {
        res.status(404).json({
          success: false,
          error: 'Session not found or access denied',
        })
        return
      }
    } else {
      sessionId = uuidv4()
      const sessionTitle = typeof title === 'string' && title.trim().length > 0
        ? title.trim()
        : '语音咨询'

      await query(
        `INSERT INTO ${TABLES.SESSIONS}
         (id, user_id, title, status, current_kb_step, session_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sessionId, userId, sessionTitle, 'active', 1, JSON.stringify({ mode: 'voice' }), now, now],
      )

      sessionRecord = await queryOne<any>(
        `SELECT * FROM ${TABLES.SESSIONS} WHERE id = $1`,
        [sessionId],
      )

      if (!sessionRecord) {
        res.status(500).json({
          success: false,
          error: 'Failed to create voice session',
        })
        return
      }

      try {
        await KBEngine.initializeKBProgress(sessionId, userId)
      } catch (kbError) {
        console.error('Initialize KB progress error (voice session):', kbError)
      }
    }

    const userProfile = await queryOne<{ full_name?: string }>(
      `SELECT full_name FROM ${TABLES.USER_PROFILES} WHERE user_id = $1`,
      [userId],
    )

    const sessionCountResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${TABLES.SESSIONS} WHERE user_id = $1`,
      [userId],
    )

    const kbProgress = await queryOne<KBProgress>(
      `SELECT current_stage, stage_messages FROM ${TABLES.KB_PROGRESS} WHERE session_id = $1`,
      [sessionId],
    )

    const sessionCount = sessionCountResult ? Number(sessionCountResult.count) : 0
    const currentStage = kbProgress?.current_stage ?? null

    await query(
      `UPDATE ${TABLES.SESSIONS}
       SET session_data = COALESCE(session_data, '{}'::jsonb) || $1::jsonb,
           updated_at = $2
       WHERE id = $3`,
      [JSON.stringify({ voice: { last_connect_at: now } }), now, sessionId],
    )

    const bailianAppParams = {
      biz_params: {
        user_id: userId,
        session_id: sessionId,
        full_name: userProfile?.full_name ?? undefined,
        session_count: sessionCount,
        current_stage: currentStage ?? undefined,
      },
      memory_id: `user_${userId}`,
    }

    const preferredVoiceId = env.BAILIAN_TTS_VOICE_ID?.trim()

    const rtc = generateRtcToken({
      channelId: sessionId,
      userId,
    })

    const responseData = {
      session: {
        id: sessionRecord.id,
        title: sessionRecord.title,
        status: sessionRecord.status,
        current_kb_step: sessionRecord.current_kb_step ?? null,
        created_at: sessionRecord.created_at,
        updated_at: sessionRecord.updated_at,
      },
      user: {
        id: userId,
        full_name: userProfile?.full_name ?? null,
      },
      rtc: {
        appId: env.RTC_APP_ID,
        token: rtc.token,
        channelId: sessionId,
        timestamp: rtc.timestamp,
        nonce: rtc.nonce,
      },
      agent: {
        agentId: env.BAILIAN_AGENT_ID,
        appId: env.BAILIAN_APP_ID,
        bailianAppParams,
        region: env.RTC_REGION,
        voiceId: preferredVoiceId || undefined,
      },
    }

    res.status(200).json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('Voice session config error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to prepare voice session',
    })
  }
})



// 配置multer用于处理音频文件上传

const upload = multer({

  storage: multer.memoryStorage(),

  limits: {

    fileSize: 10 * 1024 * 1024 // 10MB限制

  },

  fileFilter: (req, file, cb) => {

    // 检查文件类型

    const allowedMimeTypes = [

      'audio/wav',

      'audio/mpeg',

      'audio/mp3',

      'audio/webm',

      'audio/ogg'

    ]

    

    if (allowedMimeTypes.includes(file.mimetype)) {

      cb(null, true)

    } else {

      cb(new Error('不支持的音频格式'))

    }

  }

})



/**

 * POST /api/voice/speech-to-text

 * 语音转文本

 */

router.post('/speech-to-text', authenticateToken, upload.single('audio'), async (req: Request, res: Response) => {

  try {

    const userId = req.user?.id

    if (!userId) {

      return res.status(401).json({ error: '用户未认证' })

    }



    const audioFile = req.file

    if (!audioFile) {

      return res.status(400).json({ error: '未提供音频文件' })

    }



    // 验证音频缓冲区

    if (!VoiceService.isValidAudioBuffer(audioFile.buffer)) {

      return res.status(400).json({ error: '无效的音频文件' })

    }



    // 从文件扩展名或MIME类型推断格式

    const format = getAudioFormat(audioFile.mimetype, audioFile.originalname)

    if (!VoiceService.isValidAudioFormat(format)) {

      return res.status(400).json({ error: '不支持的音频格式' })

    }



    const language = req.body.language || 'zh-CN'



    // 调用语音转文本服务

    const result = await voiceService.voiceToText({

      audioBuffer: audioFile.buffer,

      format: format as 'wav' | 'mp3' | 'webm' | 'ogg',

      language

    })



    if (!result.success) {

      return res.status(500).json({ 

        error: result.error || '语音识别失败' 

      })

    }



    // 记录语音转文本日志

    try {

      await query(

        `INSERT INTO ${TABLES.VOICE_LOGS}

         (user_id, action_type, input_size, output_text, confidence, duration, language, format, created_at)

         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,

        [

          userId,

          'speech_to_text',

          audioFile.buffer.length,

          result.text,

          result.confidence,

          result.duration,

          language,

          format,

          new Date().toISOString()

        ]

      )

    } catch (logError) {

      console.error('Failed to log voice action:', logError)

      // 不影响主要功能，继续执行

    }



    res.json({

      success: true,

      text: result.text,

      confidence: result.confidence,

      duration: result.duration

    })

  } catch (error: unknown) {

    console.error('Speech to text error:', error)

    res.status(500).json({ 

      error: (error instanceof Error ? error.message : '????????') 

    })

  }

})



/**

 * POST /api/voice/text-to-speech

 * 文本转语音

 */

router.post('/text-to-speech', authenticateToken, async (req: Request, res: Response) => {

  try {

    const userId = req.user?.id

    if (!userId) {

      return res.status(401).json({ error: '用户未认证' })

    }



    const { text, voice = 'female', speed = 1.0, language = 'zh-CN' } = req.body



    if (!text || typeof text !== 'string') {

      return res.status(400).json({ error: '请提供有效的文本内容' })

    }



    if (text.length > 1000) {

      return res.status(400).json({ error: '文本长度不能超过1000字符' })

    }



    // 验证语音参数

    const validVoices = ['male', 'female', 'neutral']

    if (!validVoices.includes(voice)) {

      return res.status(400).json({ error: '无效的语音类型' })

    }



    if (speed < 0.5 || speed > 2.0) {

      return res.status(400).json({ error: '语速必须在0.5-2.0之间' })

    }



    // 调用文本转语音服务

    const result = await voiceService.textToVoice({

      text,

      voice: voice as 'male' | 'female' | 'neutral',

      speed,

      language

    })



    if (!result.success) {

      return res.status(500).json({ 

        error: result.error || '语音合成失败' 

      })

    }



    // 记录文本转语音日志

    try {

      await query(

        `INSERT INTO ${TABLES.VOICE_LOGS}

         (user_id, action_type, input_text, output_size, duration, language, voice_type, speed, created_at)

         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,

        [

          userId,

          'text_to_speech',

          text,

          result.audioBuffer?.length || 0,

          result.duration,

          language,

          voice,

          speed,

          new Date().toISOString()

        ]

      )

    } catch (logError) {

      console.error('Failed to log voice action:', logError)

      // 不影响主要功能，继续执行

    }



    // 设置响应头

    res.set({

      'Content-Type': 'audio/mpeg',

      'Content-Length': result.audioBuffer?.length.toString() || '0',

      'Cache-Control': 'no-cache'

    })



    // 返回音频数据

    res.send(result.audioBuffer)

  } catch (error: unknown) {

    console.error('Text to speech error:', error)

    res.status(500).json({ 

      error: (error instanceof Error ? error.message : '????????') 

    })

  }

})



/**

 * GET /api/voice/health

 * 检查语音服务健康状态

 */

router.get('/health', authenticateToken, async (req: Request, res: Response) => {

  try {

    const isHealthy = await voiceService.healthCheck()

    

    res.json({

      success: true,

      healthy: isHealthy,

      timestamp: new Date().toISOString()

    })

  } catch (error: unknown) {

    console.error('Voice health check error:', error)

    res.status(500).json({ 

      error: (error instanceof Error ? error.message : '??????') 

    })

  }

})



/**

 * GET /api/voice/supported-formats

 * 获取支持的音频格式

 */

router.get('/supported-formats', (req: Request, res: Response) => {

  res.json({

    success: true,

    formats: {

      input: ['wav', 'mp3', 'webm', 'ogg'],

      output: ['mp3'],

      maxFileSize: '10MB',

      maxTextLength: 1000

    },

    voices: ['male', 'female', 'neutral'],

    languages: ['zh-CN', 'en-US'],

    speedRange: { min: 0.5, max: 2.0 }

  })

})



/**

 * 从MIME类型或文件名推断音频格式

 */

const SUPPORTED_AUDIO_FORMATS = ['wav', 'mp3', 'webm', 'ogg'] as const
type AudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number]

const isAudioFormat = (value: string): value is AudioFormat => {
  return SUPPORTED_AUDIO_FORMATS.some((format) => format === value)
}

function getAudioFormat(mimeType: string, filename?: string): AudioFormat {

  // 首先尝试从MIME类型推断

  const mimeToFormat: Record<string, AudioFormat> = {

    'audio/wav': 'wav',

    'audio/mpeg': 'mp3',

    'audio/mp3': 'mp3',

    'audio/webm': 'webm',

    'audio/ogg': 'ogg'

  }

  

  if (mimeToFormat[mimeType]) {

    return mimeToFormat[mimeType]

  }

  

  // 如果MIME类型无法识别，尝试从文件扩展名推断

  if (filename) {

    const extension = filename.split('.').pop()?.toLowerCase()

    if (extension && isAudioFormat(extension)) {

      return extension

    }

  }

  

  // 默认返回wav格式

  return 'wav'

}



/**

 * 错误处理中间件

 */

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {

  void _next

  if (error instanceof multer.MulterError) {

    if (error.code === 'LIMIT_FILE_SIZE') {

      return res.status(400).json({ error: '?????????????10MB?' })

    }

    return res.status(400).json({ error: '??????: ' + error.message })

  }



  if (error instanceof Error && error.message === '????????') {

    return res.status(400).json({ error: error.message })

  }



  console.error('Voice route error:', error)

  const message = error instanceof Error ? error.message : '??????'

  res.status(500).json({ error: message })

})

export default router
