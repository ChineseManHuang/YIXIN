import axios, { AxiosInstance } from 'axios'
import { env } from '../config/env.js'
import FormData from 'form-data'

// 语音处理相关接口
export interface VoiceToTextRequest {
  audioBuffer: Buffer
  format: 'wav' | 'mp3' | 'webm' | 'ogg'
  language?: string
}

export interface VoiceToTextResponse {
  success: boolean
  text: string
  confidence: number
  duration: number
  error?: string
}

export interface TextToVoiceRequest {
  text: string
  voice?: 'male' | 'female' | 'neutral'
  speed?: number // 0.5 - 2.0
  language?: string
}

export interface TextToVoiceResponse {
  success: boolean
  audioUrl?: string
  audioBuffer?: Buffer
  duration: number
  error?: string
}

/**
 * 语音处理服务
 * 集成阿里云语音服务或其他语音API
 */
export class VoiceService {
  private client: AxiosInstance
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor() {
    this.apiKey = env.ALIBABA_VOICE_API_KEY || ''
    this.baseUrl = env.ALIBABA_VOICE_API_URL || 'https://nls-gateway.cn-shanghai.aliyuncs.com'
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[VoiceService] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[VoiceService] Request error:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[VoiceService] Response status: ${response.status}`)
        return response
      },
      (error) => {
        console.error('[VoiceService] Response error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 语音转文本
   */
  async voiceToText(request: VoiceToTextRequest): Promise<VoiceToTextResponse> {
    try {
      // 如果没有配置API密钥，使用模拟响应
      if (!this.apiKey) {
        console.warn('[VoiceService] No API key configured, using mock response')
        return this.mockVoiceToText(request)
      }

      const formData = new FormData()
      formData.append('audio', request.audioBuffer, {
        filename: `audio.${request.format}`,
        contentType: this.getContentType(request.format)
      })
      formData.append('format', request.format)
      formData.append('language', request.language || 'zh-CN')

      const response = await this.client.post('/stream/v1/asr', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      const result = response.data
      
      return {
        success: true,
        text: result.result || '',
        confidence: result.confidence || 0.9,
        duration: result.duration || 0
      }
    } catch (error: unknown) {
      console.error('[VoiceService] Voice to text error:', error)
      return {
        success: false,
        text: '',
        confidence: 0,
        duration: 0,
        error: error.message || '语音识别失败'
      }
    }
  }

  /**
   * 文本转语音
   */
  async textToVoice(request: TextToVoiceRequest): Promise<TextToVoiceResponse> {
    try {
      // 如果没有配置API密钥，使用模拟响应
      if (!this.apiKey) {
        console.warn('[VoiceService] No API key configured, using mock response')
        return this.mockTextToVoice(request)
      }

      const payload = {
        text: request.text,
        voice: this.mapVoiceType(request.voice || 'female'),
        speed: request.speed || 1.0,
        language: request.language || 'zh-CN',
        format: 'mp3'
      }

      const response = await this.client.post('/stream/v1/tts', payload, {
        responseType: 'arraybuffer'
      })

      const audioBuffer = Buffer.from(response.data)
      
      return {
        success: true,
        audioBuffer,
        duration: this.estimateAudioDuration(request.text)
      }
    } catch (error: unknown) {
      console.error('[VoiceService] Text to voice error:', error)
      return {
        success: false,
        duration: 0,
        error: error.message || '语音合成失败'
      }
    }
  }

  /**
   * 检查语音服务健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn('[VoiceService] No API key configured')
        return false
      }

      const response = await this.client.get('/health')
      return response.status === 200
    } catch (error: unknown) {
      console.error('[VoiceService] Health check failed:', error)
      return false
    }
  }

  /**
   * 模拟语音转文本（用于开发测试）
   */
  private mockVoiceToText(request: VoiceToTextRequest): VoiceToTextResponse {
    // 模拟处理延迟
    const mockTexts = [
      '你好，我想咨询一些心理问题。',
      '最近感觉压力很大，不知道该怎么办。',
      '我觉得很焦虑，睡眠也不好。',
      '谢谢你的建议，我会尝试的。'
    ]
    
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)]
    
    return {
      success: true,
      text: randomText,
      confidence: 0.85 + Math.random() * 0.1,
      duration: request.audioBuffer.length / 16000 // 假设16kHz采样率
    }
  }

  /**
   * 模拟文本转语音（用于开发测试）
   */
  private mockTextToVoice(request: TextToVoiceRequest): TextToVoiceResponse {
    // 创建一个空的音频缓冲区作为占位符
    const mockAudioBuffer = Buffer.alloc(1024)
    
    return {
      success: true,
      audioBuffer: mockAudioBuffer,
      duration: this.estimateAudioDuration(request.text)
    }
  }

  /**
   * 获取音频格式的Content-Type
   */
  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg'
    }
    return contentTypes[format] || 'audio/wav'
  }

  /**
   * 映射语音类型到API参数
   */
  private mapVoiceType(voice: string): string {
    const voiceMap: Record<string, string> = {
      'male': 'zhichu_emo',
      'female': 'zhimiao_emo', 
      'neutral': 'zhiyan_emo'
    }
    return voiceMap[voice] || voiceMap['female']
  }

  /**
   * 估算音频时长（基于文本长度）
   */
  private estimateAudioDuration(text: string): number {
    // 假设中文语音速度约为每分钟200字
    const charsPerMinute = 200
    const textLength = text.length
    return (textLength / charsPerMinute) * 60
  }

  /**
   * 验证音频格式
   */
  static isValidAudioFormat(format: string): boolean {
    const validFormats = ['wav', 'mp3', 'webm', 'ogg']
    return validFormats.includes(format.toLowerCase())
  }

  /**
   * 验证音频缓冲区
   */
  static isValidAudioBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length === 0) {
      return false
    }
    
    // 检查最小音频文件大小（1KB）
    if (buffer.length < 1024) {
      return false
    }
    
    // 检查最大音频文件大小（10MB）
    if (buffer.length > 10 * 1024 * 1024) {
      return false
    }
    
    return true
  }
}

// 导出单例实例
export const voiceService = new VoiceService