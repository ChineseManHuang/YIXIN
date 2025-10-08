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
    name: '������ϵ���ռ�������Ϣ',
    description: '�������߽������ι�ϵ���ռ�����������Ϣ����Ҫ����',
    objectives: [
      '������ȫ�����ε���ѯ��ϵ',
      '�˽������߻������',
      'ʶ����Ҫ���������',
      '���������ߵĶ������ڴ�',
    ],
    keyQuestions: [
      '����������ѯϣ�����ʲô���⣿',
      '��������������೤ʱ���ˣ�',
      '��֮ǰ�Ƿ�Ѱ���������',
      '��ϣ��ͨ����ѯ�ﵽʲôĿ�ꣿ',
    ],
    expectedDuration: 15,
    minMessages: 6,
    completionCriteria: [
      '�����߱������Ҫ����',
      '�����˻��������ι�ϵ',
      '�ռ��˻���������Ϣ',
      '��ȷ����ѯĿ��',
    ],
    nextStage: 'KB-02',
  },
  'KB-02': {
    stage: 'KB-02',
    name: '����̽������',
    description: '�����˽�����ľ�����֡�Ӱ�����غͱ���',
    objectives: [
      '�����˽�����ľ������',
      '̽������ķ�������������',
      '�˽�����������Ӱ��',
      'ʶ����ص���������֪ģʽ',
    ],
    keyQuestions: [
      '�ܾ�������һ�������������α��ֵ���',
      'ʲô������������ػ���᣿',
      '�����������������������ЩӰ�죿',
      '�����������������ģ�',
    ],
    expectedDuration: 20,
    minMessages: 8,
    completionCriteria: [
      '������ֵõ���ϸ����',
      'ʶ����Ӱ������',
      '�˽��������Ӱ�췶Χ',
      '̽������ص���������֪',
    ],
    nextStage: 'KB-03',
  },
  'KB-03': {
    stage: 'KB-03',
    name: '���������',
    description: '��������ĸ�Դ�����������߻���µ����Ͷ���',
    objectives: [
      '������������ԭ��',
      '���������߻���µ����',
      'ʶ�𲻺������֪����Ϊģʽ',
      '̽��������Դ������',
    ],
    keyQuestions: [
      '���������������ܵ�ԭ����ʲô��',
      '����������£���ͨ�������˼���ģ�',
      '������ЩӦ����������ľ��飿',
      '����Ϊʲô���ؿ��������ڸ�����״��',
    ],
    expectedDuration: 25,
    minMessages: 10,
    completionCriteria: [
      'ʶ������������ԭ��',
      '�����߻�����µ����',
      '�����˲��������֪ģʽ',
      'ʶ���˸�����Դ������',
    ],
    nextStage: 'KB-04',
  },
  'KB-04': {
    stage: 'KB-04',
    name: '�ƶ��������',
    description: '�������߹�ͬ�ƶ�����Ľ���������ж��ƻ�',
    objectives: [
      '�ƶ�����Ľ������',
      '�趨��ʵ�ֵ�Ŀ��',
      '�ƶ��ж��ƻ�',
      'Ԥ�ڿ��ܵ����Ѻ�Ӧ�Է���',
    ],
    keyQuestions: [
      '�������ǵ����ۣ������ÿ��Գ�����Щ������',
      '��ϣ���ȴ��ĸ����濪ʼ�ı䣿',
      '������ʲô����Ŀ������ʵ���еģ�',
      '��ʵʩ�����п���������Щ���ѣ�',
    ],
    expectedDuration: 20,
    minMessages: 8,
    completionCriteria: [
      '�ƶ��˾���Ľ������',
      '�趨�˿�ʵ�ֵ�Ŀ��',
      '�ƶ�����ϸ���ж��ƻ�',
      'Ԥ���˿��ܵ�����',
    ],
    nextStage: 'KB-05',
  },
  'KB-05': {
    stage: 'KB-05',
    name: '�ܽ�͹���',
    description: '�ع���ѯ�ɹ������̻����仯���滮����֧��',
    objectives: [
      '�ع���ѯ�����е��ջ�',
      '�����µ���֪����Ϊģʽ',
      '�ƶ�ά���빮�̼ƻ�',
      '�滮����֧����Դ',
    ],
    keyQuestions: [
      'ͨ�������ѯ��������Щ�µ��ջ�',
      '����Щ�����������а�����',
      'Ϊ�˹�����Щ�仯����������������ʲô��',
      '����������ʱ������Ѱ����Щ֧�֣�',
    ],
    expectedDuration: 20,
    minMessages: 6,
    completionCriteria: [
      '�ع�����ѯ�ɹ�',
      '�������µ���֪����Ϊģʽ',
      '�ƶ���ά�ּƻ�',
      '�滮�˺���֧��',
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
      throw new Error(`��ʼ��KB����ʧ��: ${error?.message}`)
    }

    return data
  }

  static async updateKBProgress(
    sessionId: string,
    messageCount: number,
    stageMessageCount: number,
    completionData?: Record<string, any>,
  ): Promise<void> {
    const updateData: Record<string, any> = {
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
      throw new Error(`����KB����ʧ��: ${error.message}`)
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
      throw new Error('��ȡKB����ʧ��')
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
      missingCriteria.push(`��Ҫ����${stageConfig.minMessages}���Ի���Ϣ`)
    } else {
      completedCriteria++
    }

    const conversationText = conversationHistory
      .map((msg) => msg.content)
      .join(' ')
      .toLowerCase()

    const keywordMatches = this.analyzeKeywordMatches(currentStage, conversationText)
    if (keywordMatches.score < 0.6) {
      missingCriteria.push('��Ҫ����������ۺ�������')
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
      throw new Error('��ȡKB����ʧ��')
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
      throw new Error(`����KB�׶�ʧ��: ${updateError.message}`)
    }

    return nextStage
  }

  private static analyzeKeywordMatches(stage: KBStage, conversationText: string): { score: number; matches: string[] } {
    const stageKeywords: Record<KBStage, string[]> = {
      'KB-01': ['����', '����', '����', 'Ŀ��', '����', '���'],
      'KB-02': ['����', '����', 'Ӱ��', '����', '����', '����'],
      'KB-03': ['ԭ��', '���', '�뷨', '��Ϊ', '����', '����'],
      'KB-04': ['����', '�ƻ�', 'Ŀ��', '�ı�', '����', '�ж�'],
      'KB-05': ['�ܽ�', '�ջ�', '����', 'δ��', '�ƻ�', '����'],
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
      recommendations.push(`��ǰ����${stageConfig.name}�׶Σ������ص��ע��${stageConfig.objectives[0]}`)
    } else if (completionRate < 0.6) {
      recommendations.push(`��������̽��${stageConfig.name}�ĺ�������`)
    } else if (completionRate < 0.8) {
      recommendations.push(`�������${stageConfig.name}�׶Σ���ȷ���������Ŀ��`)
    } else {
      recommendations.push(`${stageConfig.name}�׶ν�չ���ã����Կ��ǽ�����һ�׶�`)
    }

    missingCriteria.forEach((criteria) => {
      recommendations.push(`���飺${criteria}`)
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


