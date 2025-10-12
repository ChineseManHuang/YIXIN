import { supabase } from '../config/database'
import type { KBProgress } from '../config/database'

export type KBStage = 'KB-01' | 'KB-02' | 'KB-03' | 'KB-04' | 'KB-05'

interface KBStageConfig {
  stage: KBStage
  name: string
  description: string
  objectives: string[]
  keyQuestions: string[]
  expectedDuration: number
  minMessages: number
  completionCriteria: string[]
  nextStage?: KBStage
}

export interface KBProgressAssessment {
  currentStage: KBStage
  canProgress: boolean
  completionRate: number
  missingCriteria: string[]
  recommendations: string[]
  nextStage?: KBStage
}

const KB_STAGES: Record<KBStage, KBStageConfig> = {
  'KB-01': {
    stage: 'KB-01',
    name: '建立关系和收集基本信息',
    description: '与来访者建立信任关系，收集基本个人信息和主要困扰',
    objectives: [
      '建立安全、信任的咨询关系',
      '了解来访者基本情况',
      '识别主要问题和困扰',
      '评估来访者的动机和期待',
    ],
    keyQuestions: [
      '您今天来咨询希望解决什么问题？',
      '这个问题困扰您多长时间了？',
      '您之前是否寻求过帮助？',
      '您希望通过咨询达到什么目标？',
    ],
    expectedDuration: 15,
    minMessages: 6,
    completionCriteria: [
      '来访者表达了主要困扰',
      '建立了基本的信任关系',
      '收集了基本个人信息',
      '明确了咨询目标',
    ],
    nextStage: 'KB-02',
  },
  'KB-02': {
    stage: 'KB-02',
    name: '深入探索问题',
    description: '深入了解问题的具体表现、影响因素和背景',
    objectives: [
      '深入了解问题的具体表现',
      '探索问题的发生背景和诱因',
      '了解问题对生活的影响',
      '识别相关的情绪和认知模式',
    ],
    keyQuestions: [
      '能具体描述一下这个问题是如何表现的吗？',
      '什么情况下问题会加重或减轻？',
      '这个问题对您的生活造成了哪些影响？',
      '您是如何理解这个问题的？',
    ],
    expectedDuration: 20,
    minMessages: 8,
    completionCriteria: [
      '问题表现得到详细描述',
      '识别了影响因素',
      '了解了问题的影响范围',
      '探索了相关的情绪和认知',
    ],
    nextStage: 'KB-03',
  },
  'KB-03': {
    stage: 'KB-03',
    name: '分析和理解',
    description: '分析问题的根源，帮助来访者获得新的理解和洞察',
    objectives: [
      '分析问题的深层原因',
      '帮助来访者获得新的理解',
      '识别不合理的认知和行为模式',
      '探索个人资源和优势',
    ],
    keyQuestions: [
      '您觉得这个问题可能的原因是什么？',
      '在类似情况下，您通常是如何思考的？',
      '您有哪些应对这类问题的经验？',
      '您认为什么因素可能有助于改善现状？',
    ],
    expectedDuration: 25,
    minMessages: 10,
    completionCriteria: [
      '识别了问题的深层原因',
      '来访者获得了新的理解',
      '发现了不合理的认知模式',
      '识别了个人资源和优势',
    ],
    nextStage: 'KB-04',
  },
  'KB-04': {
    stage: 'KB-04',
    name: '制定解决方案',
    description: '与来访者共同制定具体的解决方案和行动计划',
    objectives: [
      '制定具体的解决策略',
      '设定可实现的目标',
      '制定行动计划',
      '预期可能的困难和应对方法',
    ],
    keyQuestions: [
      '基于我们的讨论，您觉得可以尝试哪些方法？',
      '您希望先从哪个方面开始改变？',
      '您觉得什么样的目标是现实可行的？',
      '在实施过程中可能遇到哪些困难？',
    ],
    expectedDuration: 20,
    minMessages: 8,
    completionCriteria: [
      '制定了具体的解决策略',
      '设定了可实现的目标',
      '制定了详细的行动计划',
      '预期了可能的困难',
    ],
    nextStage: 'KB-05',
  },
  'KB-05': {
    stage: 'KB-05',
    name: '总结和巩固',
    description: '回顾咨询成果，巩固积极变化并规划后续支持',
    objectives: [
      '回顾咨询过程中的收获',
      '巩固新的认知和行为模式',
      '制定维持与巩固计划',
      '规划后续支持资源',
    ],
    keyQuestions: [
      '通过这段咨询，您有哪些新的收获？',
      '有哪些方法对您最有帮助？',
      '为了巩固这些变化，您接下来可以做什么？',
      '当遇到困难时，您会寻求哪些支持？',
    ],
    expectedDuration: 20,
    minMessages: 6,
    completionCriteria: [
      '回顾了咨询成果',
      '巩固了新的认知和行为模式',
      '制定了维持计划',
      '规划了后续支持',
    ],
  },
}

export class KBEngine {
  static getStageConfig(stage: KBStage): KBStageConfig {
    return KB_STAGES[stage]
  }

  static getAllStages(): KBStageConfig[] {
    return Object.values(KB_STAGES)
  }

  static async initializeKBProgress(sessionId: string, userId: string): Promise<KBProgress> {
    const { data, error } = await supabase
      .from('kb_progress')
      .insert({
        session_id: sessionId,
        user_id: userId,
        current_stage: 'KB-01',
        stage_progress: {
          'KB-01': { started: true, completed: false, startTime: new Date().toISOString() },
        },
        completion_criteria: {},
        total_messages: 0,
        stage_messages: 0,
        completed_stages: [],
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`初始化KB进度失败: ${error?.message}`)
    }

    return data
  }

  static async updateKBProgress(
    sessionId: string,
    messageCount: number,
    stageMessageCount: number,
    completionData?: KBProgress['completion_criteria'],
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      total_messages: messageCount,
      stage_messages: stageMessageCount,
      updated_at: new Date().toISOString(),
    }

    if (completionData) {
      updateData.completion_criteria = completionData
    }

    const { error } = await supabase
      .from('kb_progress')
      .update(updateData)
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`更新KB进度失败: ${error.message}`)
    }
  }

  static async assessStageProgress(
    sessionId: string,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>,
  ): Promise<KBProgressAssessment> {
    const { data: progress, error } = await supabase
      .from('kb_progress')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error || !progress) {
      throw new Error('获取KB进度失败')
    }

    return this.assessStageProgressFromRecord(progress, conversationHistory)
  }

  static assessStageProgressFromRecord(
    progress: KBProgress,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>,
  ): KBProgressAssessment {
    const currentStage = (progress.current_stage || 'KB-01') as KBStage
    const stageConfig = KB_STAGES[currentStage]
    const stageMessages = progress.stage_messages || 0

    const missingCriteria: string[] = []
    let completedCriteria = 0

    if (stageMessages < stageConfig.minMessages) {
      missingCriteria.push(`需要至少${stageConfig.minMessages}条对话消息`)
    } else {
      completedCriteria++
    }

    const conversationText = conversationHistory
      .map((msg) => msg.content)
      .join(' ')
      .toLowerCase()

    const keywordMatches = this.analyzeKeywordMatches(currentStage, conversationText)
    if (keywordMatches.score < 0.6) {
      missingCriteria.push('需要更深入地讨论核心问题')
    } else {
      completedCriteria++
    }

    const totalCriteria = Math.max(stageConfig.completionCriteria.length, 1)
    const completionRate = Math.min(completedCriteria / totalCriteria, 1)
    const canProgress = missingCriteria.length === 0 && completionRate >= 0.8
    const recommendations = this.generateRecommendations(currentStage, missingCriteria, completionRate)

    return {
      currentStage,
      canProgress,
      completionRate,
      missingCriteria,
      recommendations,
      nextStage: stageConfig.nextStage,
    }
  }

  static async progressToNextStage(sessionId: string): Promise<KBStage | null> {
    const { data: progress, error } = await supabase
      .from('kb_progress')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error || !progress) {
      throw new Error('获取KB进度失败')
    }

    const currentStage = progress.current_stage as KBStage
    const nextStage = KB_STAGES[currentStage].nextStage

    if (!nextStage) {
      return null
    }

    const stageProgress = progress.stage_progress || {}
    stageProgress[currentStage] = {
      ...(stageProgress[currentStage] || {}),
      completed: true,
      completedTime: new Date().toISOString(),
    }
    stageProgress[nextStage] = {
      ...(stageProgress[nextStage] || {}),
      started: true,
      completed: false,
      startTime: new Date().toISOString(),
    }

    const completedStages = Array.isArray(progress.completed_stages)
      ? Array.from(new Set([...progress.completed_stages, currentStage]))
      : [currentStage]

    const { error: updateError } = await supabase
      .from('kb_progress')
      .update({
        current_stage: nextStage,
        stage_progress: stageProgress,
        stage_messages: 0,
        completed_stages: completedStages,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)

    if (updateError) {
      throw new Error(`更新KB阶段失败: ${updateError.message}`)
    }

    return nextStage
  }

  private static analyzeKeywordMatches(stage: KBStage, conversationText: string): { score: number; matches: string[] } {
    const stageKeywords: Record<KBStage, string[]> = {
      'KB-01': ['问题', '困扰', '帮助', '目标', '期望', '情况'],
      'KB-02': ['具体', '表现', '影响', '感受', '情绪', '发生'],
      'KB-03': ['原因', '理解', '想法', '认为', '觉得', '经验'],
      'KB-04': ['方法', '计划', '目标', '改变', '尝试', '行动'],
      'KB-05': ['总结', '收获', '帮助', '未来', '计划', '期望'],
    }

    const keywords = stageKeywords[stage] || []
    if (keywords.length === 0) {
      return { score: 1, matches: [] }
    }

    const matches = keywords.filter((keyword) => conversationText.includes(keyword))
    const score = matches.length / keywords.length
    return { score, matches }
  }

  private static generateRecommendations(stage: KBStage, missingCriteria: string[], completionRate: number): string[] {
    const recommendations: string[] = []
    const stageConfig = KB_STAGES[stage]

    if (completionRate < 0.3) {
      recommendations.push(`当前处于${stageConfig.name}阶段，建议重点关注：${stageConfig.objectives[0]}`)
    } else if (completionRate < 0.6) {
      recommendations.push(`继续深入探讨${stageConfig.name}的核心内容`)
    } else if (completionRate < 0.8) {
      recommendations.push(`即将完成${stageConfig.name}阶段，请确保达成所有目标`)
    } else {
      recommendations.push(`${stageConfig.name}阶段进展良好，可以考虑进入下一阶段`)
    }

    missingCriteria.forEach((criteria) => {
      recommendations.push(`建议：${criteria}`)
    })

    return recommendations
  }

  static getStageGuidanceQuestions(stage: KBStage, completionRate: number): string[] {
    const stageConfig = KB_STAGES[stage]
    const questions = [...stageConfig.keyQuestions]

    if (completionRate < 0.5) {
      return questions.slice(0, 2)
    }

    return questions
  }
}

export { KB_STAGES, type KBStageConfig }



