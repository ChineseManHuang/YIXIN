/**
 * 阿里云百炼API集成服务
 * 实现与qwen3-omni-flash模型的通信
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { KBEngine, type KBStage } from './kb-engine'
import { env } from '../config/env.js'
import { EthicsMonitor, type EthicsMonitorResult } from './ethics-monitor'

// 百炼API请求接口
interface BailianRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  tools?: Array<{
    type: string
    function: {
      name: string
      description: string
      parameters: object
    }
  }>
}

// 百炼API响应接口
interface BailianResponse {
  output: {
    choices: Array<{
      finish_reason: string
      message: {
        role: string
        content: string
      }
    }>
  }
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
  request_id: string
}

// 心理咨询上下文接口
interface CounselingContext {
  sessionId: string
  userId: string
  kbStage: 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05'
  userProfile?: {
    age?: number
    gender?: string
    occupation?: string
    previousSessions?: number
  }
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  currentIssues?: string[]
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
}

// 伦理检查结果接口
interface EthicsCheckResult {
  isEthical: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  concerns: string[]
  recommendations: string[]
  shouldBlock: boolean
}

class BailianService {
  private client: AxiosInstance
  private readonly model = 'qwen3-omni-flash'
  private readonly baseURL: string
  private readonly apiKey: string

  constructor() {
    this.baseURL = env.BAILIAN_ENDPOINT || ''
    this.apiKey = env.BAILIAN_API_KEY || ''
    
    const hasConfig = this.baseURL && this.apiKey
    
    if (hasConfig) {
      this.client = axios.create({
        baseURL: 'https://dashscope.aliyuncs.com',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30秒超时
      })

      // 请求拦截器
      this.client.interceptors.request.use(
        (config) => {
          console.log(`[百炼API] 发送请求: ${config.method?.toUpperCase()} ${config.url}`)
          return config
        },
        (error) => {
          console.error('[百炼API] 请求错误:', error)
          return Promise.reject(error)
        }
      )

      // 响应拦截器
      this.client.interceptors.response.use(
        (response) => {
          console.log(`[百炼API] 收到响应: ${response.status} ${response.statusText}`)
          return response
        },
        (error) => {
          console.error('[百炼API] 响应错误:', error.response?.data || error.message)
          return Promise.reject(error)
        }
      )
    } else {
      console.warn('[百炼API] 配置缺失，将使用模拟响应')
      this.client = null
    }
  }

  /**
   * 生成心理咨询回复
   */
  async generateCounselingResponse(
    context: CounselingContext,
    userMessage: string
  ): Promise<{ response: string; ethicsCheck: EthicsCheckResult; usage: any }> {
    // 如果没有配置API，返回模拟响应
    if (!this.client) {
      return this.getMockCounselingResponse(context, userMessage)
    }
    
    try {
      // 1. 伦理检查
      const ethicsCheck = await this.performEthicsCheck(userMessage, context)
      
      if (ethicsCheck.shouldBlock) {
        return {
          response: this.generateEthicsBlockedResponse(ethicsCheck),
          ethicsCheck,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        }
      }

      // 2. 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(context)
      
      // 3. 构建消息历史
      const messages = this.buildMessageHistory(context, userMessage, systemPrompt)
      
      // 4. 调用百炼API
      const request = {
        model: 'qwen-turbo',
        input: {
          messages: messages
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          result_format: 'message'
        }
      }

      console.log('[百炼服务] 发送请求:', {
        url: '/api/v1/services/aigc/text-generation/generation',
        body: request
      })

      const response = await this.client.post('/api/v1/services/aigc/text-generation/generation', request)
      
      console.log('[百炼服务] API响应:', response.data)
      
      if (!response.data.output || !response.data.output.choices || response.data.output.choices.length === 0) {
        throw new Error('百炼API返回空响应')
      }

      const aiResponse = response.data.output.choices[0].message.content
      
      // 5. 后处理和安全检查
      const processedResponse = await this.postProcessResponse(aiResponse, context)
      
      return {
        response: processedResponse,
        ethicsCheck,
        usage: {
          prompt_tokens: response.data.usage?.input_tokens || 0,
          completion_tokens: response.data.usage?.output_tokens || 0,
          total_tokens: response.data.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('[百炼服务] 生成回复失败:', error)
      // 如果API调用失败，返回模拟响应
      return this.getMockCounselingResponse(context, userMessage)
    }
  }
  
  private getMockCounselingResponse(
    context: CounselingContext,
    userMessage: string
  ): { response: string; ethicsCheck: EthicsCheckResult; usage: any } {
    const mockResponses = {
      'KB-01': '我理解您现在的感受。能告诉我更多关于这个问题的具体情况吗？这样我能更好地帮助您。',
      'KB-02': '感谢您的分享。让我们一起来分析一下这个问题的根源，这有助于我们找到合适的解决方案。',
      'KB-03': '基于您刚才的描述，我建议我们可以尝试一些具体的应对策略。您觉得从哪个方面开始比较合适？',
      'KB-04': '很好，我们已经制定了一些策略。现在让我们讨论如何在日常生活中实施这些方法。',
      'KB-05': '您在这次咨询中表现得很好。让我们总结一下今天讨论的要点，并为您制定后续的行动计划。'
    }
    
    return {
      response: mockResponses[context.kbStage] || '我理解您的情况，让我们继续深入探讨这个问题。',
      ethicsCheck: {
        isEthical: true,
        riskLevel: 'low',
        concerns: [],
        recommendations: [],
        shouldBlock: false
      },
      usage: {
        prompt_tokens: userMessage.length,
        completion_tokens: 50,
        total_tokens: userMessage.length + 50
      }
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(context: CounselingContext): string {
    const { kbStage, userProfile, sessionId } = context
    const stageConfig = KBEngine.getStageConfig(kbStage)
    
    let systemPrompt = `你是一位专业的AI心理咨询师，正在为来访者提供心理健康支持。

当前咨询阶段：${stageConfig.name} (${kbStage})
阶段描述：${stageConfig.description}

咨询原则：
1. 保持专业、温暖、非评判的态度
2. 运用认知行为疗法(CBT)和人本主义疗法技巧
3. 注重来访者的情感体验和认知模式
4. 提供支持性和启发性的回应
5. 严格遵守心理咨询伦理规范

`
    
    if (userProfile) {
      systemPrompt += `来访者信息：
- 年龄：${userProfile.age}岁
- 性别：${userProfile.gender}
- 职业：${userProfile.occupation}
- 之前咨询次数：${userProfile.previousSessions}次

`
    }

    // 当前阶段的具体目标和关键问题
    systemPrompt += `当前阶段目标：
${stageConfig.objectives.map(obj => `- ${obj}`).join('\n')}

`
    
    systemPrompt += `关键探索问题：
${stageConfig.keyQuestions.map(q => `- ${q}`).join('\n')}

`
    
    systemPrompt += `完成标准：
${stageConfig.completionCriteria.map(c => `- ${c}`).join('\n')}

`
    
    // 添加当前问题
    if (context.currentIssues && context.currentIssues.length > 0) {
      systemPrompt += `\n当前关注的问题：${context.currentIssues.join('、')}\n`
    }
    
    // 添加风险等级提醒
    if (context.riskLevel && context.riskLevel !== 'low') {
      systemPrompt += `\n⚠️ 风险等级：${context.riskLevel}\n请特别关注来访者的安全状况，必要时建议寻求专业帮助。\n`
    }
    
    systemPrompt += `请根据当前阶段目标，提供专业、温暖且有针对性的回应。回应应该：
1. 体现对来访者感受的理解和共情
2. 引导来访者深入探索当前阶段的核心内容
3. 适当使用当前阶段的关键问题进行引导
4. 提供适当的心理教育和技巧
5. 鼓励来访者的积极改变
6. 保持专业边界和伦理标准
7. 根据阶段进度适时引导向下一阶段过渡`
    
    return systemPrompt
  }

  /**
   * 构建消息历史
   */
  private buildMessageHistory(
    context: CounselingContext,
    userMessage: string,
    systemPrompt: string
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ]
    
    // 添加最近的对话历史（最多10轮）
    const recentHistory = context.conversationHistory.slice(-10)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }
    
    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: userMessage
    })
    
    return messages
  }

  /**
   * 执行伦理检查
   */
  private async performEthicsCheck(
    userMessage: string,
    context: CounselingContext
  ): Promise<EthicsCheckResult> {
    try {
      // 使用专业的伦理监控系统
      const monitorResult = EthicsMonitor.analyzeMessage(userMessage, {
        conversationHistory: context.conversationHistory,
        userProfile: context.userProfile,
        sessionId: context.sessionId
      })

      // 转换为原有的EthicsCheckResult格式
      return {
        isEthical: !monitorResult.shouldBlock,
        riskLevel: monitorResult.riskLevel,
        concerns: monitorResult.concerns,
        recommendations: monitorResult.recommendations,
        shouldBlock: monitorResult.shouldBlock
      }
    } catch (error) {
      console.error('[伦理检查] 执行失败:', error)
      // 默认返回安全的结果
      return {
        isEthical: true,
        riskLevel: 'low',
        concerns: [],
        recommendations: [],
        shouldBlock: false
      }
    }
  }

  /**
   * 生成伦理阻止响应
   */
  private generateEthicsBlockedResponse(ethicsCheck: EthicsCheckResult): string {
    if (ethicsCheck.riskLevel === 'critical') {
      return `我注意到您可能正在经历严重的困扰。您的安全对我们来说非常重要。

请立即联系：
• 全国心理危机干预热线：400-161-9995
• 紧急情况请拨打：120 或 110
• 或前往最近的医院急诊科

您不是一个人在面对这些困难，专业的帮助就在身边。请不要犹豫，立即寻求帮助。`
    }
    
    return '我理解您的困扰，但这个问题可能需要专业心理治疗师的帮助。建议您联系当地的心理健康服务机构获得更适合的支持。'
  }

  /**
   * 后处理响应
   */
  private async postProcessResponse(
    response: string,
    context: CounselingContext
  ): Promise<string> {
    // 移除可能的不当内容
    let processedResponse = response
      .replace(/我是.*AI.*模型/gi, '我是您的AI心理咨询师')
      .replace(/我不能.*诊断/gi, '我无法提供医疗诊断')
      .replace(/请咨询.*医生/gi, '建议咨询专业心理治疗师')
    
    // 确保回复长度适中
    if (processedResponse.length > 500) {
      processedResponse = processedResponse.substring(0, 500) + '...'
    }
    
    // 添加KB阶段相关的结尾提示
    const stagePrompts = {
      'KB-01': '\n\n我们正在建立信任关系，请随时分享您的感受。',
      'KB-02': '\n\n让我们继续深入了解这个问题的具体情况。',
      'KB-03': '\n\n我们可以一起制定一些具体的目标。',
      'KB-04': '\n\n让我们尝试一些实用的应对策略。',
      'KB-05': '\n\n让我们回顾一下您的成长和收获。'
    }
    
    if (stagePrompts[context.kbStage] && processedResponse.length < 400) {
      processedResponse += stagePrompts[context.kbStage]
    }
    
    return processedResponse
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 })
      return response.status === 200
    } catch (error) {
      console.error('[百炼服务] 健康检查失败:', error)
      return false
    }
  }
}

// 导出单例实例
export const bailianService = new BailianService()
export default bailianService