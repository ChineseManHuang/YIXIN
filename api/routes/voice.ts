import { Router, Request, Response, NextFunction } from 'express'

import multer from 'multer'

import { voiceService, VoiceService } from '../services/voice'

import { authenticateToken } from '../middleware/auth'

import { supabase } from '../config/database'



const router = Router()



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

      await supabase

        .from('voice_logs')

        .insert({

          user_id: userId,

          action_type: 'speech_to_text',

          input_size: audioFile.buffer.length,

          output_text: result.text,

          confidence: result.confidence,

          duration: result.duration,

          language,

          format

        })

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

      await supabase

        .from('voice_logs')

        .insert({

          user_id: userId,

          action_type: 'text_to_speech',

          input_text: text,

          output_size: result.audioBuffer?.length || 0,

          duration: result.duration,

          language,

          voice_type: voice,

          speed

        })

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

function getAudioFormat(mimeType: string, filename?: string): 'wav' | 'mp3' | 'webm' | 'ogg' {

  // 首先尝试从MIME类型推断

  const mimeToFormat: Record<string, string> = {

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

    if (extension && ['wav', 'mp3', 'webm', 'ogg'].includes(extension)) {

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