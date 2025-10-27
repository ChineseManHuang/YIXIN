import { query, TABLES } from '../config/database.js'
import type { UserProfile } from '../config/database.js'

// 风险等级定义
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// 风险类型定义
export type RiskType = 
  | 'suicide_ideation'     // 自杀意念
  | 'self_harm'           // 自伤行为
  | 'violence_threat'     // 暴力威胁
  | 'substance_abuse'     // 物质滥用
  | 'eating_disorder'     // 饮食障碍
  | 'psychosis'           // 精神病性症状
  | 'severe_depression'   // 严重抑郁
  | 'panic_disorder'      // 恐慌障碍
  | 'inappropriate_content' // 不当内容
  | 'boundary_violation'  // 边界违反

// 关键词库
interface KeywordPattern {
  keywords: string[]
  riskType: RiskType
  riskLevel: RiskLevel
  weight: number // 权重
  context?: string[] // 上下文关键词
}

// 风险关键词库
const RISK_KEYWORDS: KeywordPattern[] = [
  // 自杀相关 - 高风险
  {
    keywords: ['自杀', '结束生命', '不想活', '想死', '轻生', '了结', '解脱'],
    riskType: 'suicide_ideation',
    riskLevel: 'critical',
    weight: 10,
    context: ['痛苦', '绝望', '无助', '没有希望']
  },
  {
    keywords: ['跳楼', '上吊', '割腕', '服毒', '安眠药', '煤气'],
    riskType: 'suicide_ideation',
    riskLevel: 'critical',
    weight: 10
  },
  
  // 自伤相关 - 高风险
  {
    keywords: ['自残', '割伤', '烫伤', '撞墙', '掐自己', '咬自己'],
    riskType: 'self_harm',
    riskLevel: 'high',
    weight: 8
  },
  
  // 暴力威胁 - 高风险
  {
    keywords: ['杀死', '报复', '伤害他人', '暴力', '攻击'],
    riskType: 'violence_threat',
    riskLevel: 'high',
    weight: 9,
    context: ['愤怒', '仇恨', '报复']
  },
  
  // 物质滥用 - 中等风险
  {
    keywords: ['吸毒', '酗酒', '药物依赖', '成瘾', '戒断'],
    riskType: 'substance_abuse',
    riskLevel: 'medium',
    weight: 6
  },
  
  // 饮食障碍 - 中等风险
  {
    keywords: ['厌食', '暴食', '催吐', '节食', '体重焦虑'],
    riskType: 'eating_disorder',
    riskLevel: 'medium',
    weight: 5
  },
  
  // 精神病性症状 - 高风险
  {
    keywords: ['幻听', '幻觉', '被监视', '被控制', '妄想'],
    riskType: 'psychosis',
    riskLevel: 'high',
    weight: 8
  },
  
  // 严重抑郁 - 中等风险
  {
    keywords: ['绝望', '无价值', '罪恶感', '无助', '空虚'],
    riskType: 'severe_depression',
    riskLevel: 'medium',
    weight: 4,
    context: ['持续', '严重', '无法']
  },
  
  // 恐慌障碍 - 中等风险
  {
    keywords: ['恐慌发作', '心跳加速', '呼吸困难', '濒死感'],
    riskType: 'panic_disorder',
    riskLevel: 'medium',
    weight: 4
  },
  
  // 不当内容 - 低风险
  {
    keywords: ['性', '色情', '暴露', '不雅'],
    riskType: 'inappropriate_content',
    riskLevel: 'low',
    weight: 2
  }
]

// 伦理监控结果
interface EthicsMonitorResult {
  riskLevel: RiskLevel
  riskTypes: RiskType[]
  concerns: string[]
  recommendations: string[]
  shouldBlock: boolean
  shouldAlert: boolean
  confidence: number
  detectedPatterns: {
    pattern: KeywordPattern
    matches: string[]
    contextScore: number
  }[]
}

// 干预建议模板
const INTERVENTION_TEMPLATES: Record<RiskType, {
  immediate: string[]
  followUp: string[]
  resources: string[]
}> = {
  suicide_ideation: {
    immediate: [
      '立即建议联系心理危机干预热线：400-161-9995',
      '建议寻求紧急专业心理健康服务',
      '如有紧急情况，请拨打120或前往最近的医院急诊科'
    ],
    followUp: [
      '安排紧急心理评估',
      '考虑住院治疗或密切监护',
      '制定安全计划'
    ],
    resources: [
      '全国心理危机干预热线：400-161-9995',
      '北京危机干预热线：400-161-9995',
      '上海心理援助热线：021-64383562'
    ]
  },
  self_harm: {
    immediate: [
      '建议立即寻求专业心理健康服务',
      '评估自伤行为的严重程度和频率',
      '提供替代性应对策略'
    ],
    followUp: [
      '制定自伤预防计划',
      '学习健康的情绪调节技巧',
      '定期心理治疗'
    ],
    resources: [
      '自伤康复支持群体',
      'DBT技能训练资源',
      '情绪调节技巧指南'
    ]
  },
  violence_threat: {
    immediate: [
      '评估暴力风险等级',
      '必要时联系相关部门',
      '确保他人安全'
    ],
    followUp: [
      '愤怒管理训练',
      '冲突解决技巧',
      '定期风险评估'
    ],
    resources: [
      '愤怒管理课程',
      '冲突调解服务',
      '法律咨询资源'
    ]
  },
  substance_abuse: {
    immediate: [
      '评估物质使用严重程度',
      '提供戒断支持信息',
      '建议专业成瘾治疗'
    ],
    followUp: [
      '制定戒断计划',
      '参加支持小组',
      '定期医学监测'
    ],
    resources: [
      '戒毒康复中心',
      '匿名戒酒会',
      '成瘾治疗专家'
    ]
  },
  eating_disorder: {
    immediate: [
      '评估营养状况和医学风险',
      '建议专业饮食障碍治疗',
      '监测体重和健康指标'
    ],
    followUp: [
      '营养康复计划',
      '认知行为治疗',
      '家庭治疗支持'
    ],
    resources: [
      '饮食障碍治疗中心',
      '营养师咨询',
      '康复支持群体'
    ]
  },
  psychosis: {
    immediate: [
      '建议立即精神科评估',
      '考虑药物治疗',
      '确保安全环境'
    ],
    followUp: [
      '定期精神科随访',
      '药物依从性监测',
      '心理社会康复'
    ],
    resources: [
      '精神科专科医院',
      '抗精神病药物信息',
      '精神康复服务'
    ]
  },
  severe_depression: {
    immediate: [
      '评估抑郁严重程度',
      '建议专业心理治疗',
      '考虑药物治疗'
    ],
    followUp: [
      '认知行为治疗',
      '抗抑郁药物治疗',
      '生活方式调整'
    ],
    resources: [
      '抑郁症治疗指南',
      '心理治疗师推荐',
      '抑郁症支持群体'
    ]
  },
  panic_disorder: {
    immediate: [
      '教授呼吸放松技巧',
      '提供恐慌发作应对策略',
      '建议专业治疗'
    ],
    followUp: [
      '认知行为治疗',
      '暴露疗法',
      '药物治疗考虑'
    ],
    resources: [
      '恐慌障碍自助指南',
      '放松训练资源',
      '焦虑症治疗中心'
    ]
  },
  inappropriate_content: {
    immediate: [
      '重新引导对话主题',
      '强调专业边界',
      '提供适当的心理教育'
    ],
    followUp: [
      '讨论健康的人际关系',
      '性教育和心理健康',
      '边界设定技巧'
    ],
    resources: [
      '心理健康教育资源',
      '人际关系指导',
      '专业伦理指南'
    ]
  },
  boundary_violation: {
    immediate: [
      '明确专业边界',
      '重新设定咨询框架',
      '必要时终止会话'
    ],
    followUp: [
      '边界教育',
      '转介其他专业人员',
      '督导咨询'
    ],
    resources: [
      '咨询伦理指南',
      '专业边界教育',
      '督导资源'
    ]
  }
}

// 伦理监控服务
export class EthicsMonitor {
  /**
   * 分析消息内容的风险等级
   */
  static analyzeMessage(content: string, context?: {
    conversationHistory?: Array<{ role: string; content: string }>
    userProfile?: Partial<UserProfile>
    sessionId?: string
  }): EthicsMonitorResult {
    const normalizedContent = content.toLowerCase().trim()
    const detectedPatterns: EthicsMonitorResult['detectedPatterns'] = []
    const riskTypes: Set<RiskType> = new Set()
    let totalRiskScore = 0
    let maxRiskLevel: RiskLevel = 'low'

    // 检查每个风险模式
    for (const pattern of RISK_KEYWORDS) {
      const matches = pattern.keywords.filter(keyword => 
        normalizedContent.includes(keyword.toLowerCase())
      )

      if (matches.length > 0) {
        // 计算上下文得分
        let contextScore = 1
        if (pattern.context) {
          const contextMatches = pattern.context.filter(ctx => 
            normalizedContent.includes(ctx.toLowerCase())
          )
          contextScore = 1 + (contextMatches.length / pattern.context.length)
        }

        const patternScore = matches.length * pattern.weight * contextScore
        totalRiskScore += patternScore

        detectedPatterns.push({
          pattern,
          matches,
          contextScore
        })

        riskTypes.add(pattern.riskType)

        // 更新最高风险等级
        if (this.getRiskLevelPriority(pattern.riskLevel) > this.getRiskLevelPriority(maxRiskLevel)) {
          maxRiskLevel = pattern.riskLevel
        }
      }
    }

    // 分析对话历史中的风险模式
    if (context?.conversationHistory) {
      const historyRisk = this.analyzeConversationHistory(context.conversationHistory)
      totalRiskScore += historyRisk.score
      if (this.getRiskLevelPriority(historyRisk.riskLevel) > this.getRiskLevelPriority(maxRiskLevel)) {
        maxRiskLevel = historyRisk.riskLevel
      }
    }

    // 确定最终风险等级
    const finalRiskLevel = this.calculateFinalRiskLevel(totalRiskScore, maxRiskLevel)
    
    // 生成关注点和建议
    const concerns = this.generateConcerns(Array.from(riskTypes), detectedPatterns)
    const recommendations = this.generateRecommendations(Array.from(riskTypes))
    
    // 判断是否需要阻止或警报
    const shouldBlock = finalRiskLevel === 'critical' && riskTypes.has('suicide_ideation')
    const shouldAlert = finalRiskLevel === 'critical' || finalRiskLevel === 'high'
    
    // 计算置信度
    const confidence = Math.min(totalRiskScore / 50, 1) // 标准化到0-1

    return {
      riskLevel: finalRiskLevel,
      riskTypes: Array.from(riskTypes),
      concerns,
      recommendations,
      shouldBlock,
      shouldAlert,
      confidence,
      detectedPatterns
    }
  }

  /**
   * 记录伦理检查结果
   */
  static async logEthicsCheck(
    sessionId: string,
    userId: string,
    messageContent: string,
    result: EthicsMonitorResult
  ): Promise<void> {
    try {
      const actionTaken = result.shouldBlock ? 'blocked' : result.shouldAlert ? 'alerted' : 'monitored'
      const detectedPatterns = JSON.stringify(result.detectedPatterns.map(p => ({
        riskType: p.pattern.riskType,
        matches: p.matches,
        weight: p.pattern.weight,
        contextScore: p.contextScore
      })))

      await query(
        `INSERT INTO ${TABLES.ETHICS_LOGS}
         (session_id, user_id, message_content, risk_level, risk_types, concerns,
          recommendations, confidence_score, action_taken, detected_patterns, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          sessionId,
          userId,
          messageContent,
          result.riskLevel,
          JSON.stringify(result.riskTypes),
          JSON.stringify(result.concerns),
          JSON.stringify(result.recommendations),
          result.confidence,
          actionTaken,
          detectedPatterns,
          new Date().toISOString()
        ]
      )
    } catch (error: unknown) {
      console.error('记录伦理检查结果失败:', error)
    }
  }

  /**
   * 获取风险等级优先级
   */
  private static getRiskLevelPriority(level: RiskLevel): number {
    const priorities = { low: 1, medium: 2, high: 3, critical: 4 }
    return priorities[level]
  }

  /**
   * 计算最终风险等级
   */
  private static calculateFinalRiskLevel(totalScore: number, maxDetectedLevel: RiskLevel): RiskLevel {
    // 基于总分和检测到的最高等级综合判断
    if (maxDetectedLevel === 'critical' || totalScore >= 50) {
      return 'critical'
    } else if (maxDetectedLevel === 'high' || totalScore >= 30) {
      return 'high'
    } else if (maxDetectedLevel === 'medium' || totalScore >= 15) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 分析对话历史中的风险模式
   */
  private static analyzeConversationHistory(
    history: Array<{ role: string; content: string }>
  ): { score: number; riskLevel: RiskLevel } {
    let historyScore = 0
    let maxHistoryRisk: RiskLevel = 'low'

    // 分析最近5条消息
    const recentMessages = history.slice(-5)
    
    for (const message of recentMessages) {
      if (message.role === 'user') {
        const messageResult = this.analyzeMessage(message.content)
        historyScore += messageResult.confidence * 10
        
        if (this.getRiskLevelPriority(messageResult.riskLevel) > this.getRiskLevelPriority(maxHistoryRisk)) {
          maxHistoryRisk = messageResult.riskLevel
        }
      }
    }

    return {
      score: historyScore * 0.3, // 历史风险权重较低
      riskLevel: maxHistoryRisk
    }
  }

  /**
   * 生成关注点
   */
  private static generateConcerns(riskTypes: RiskType[], patterns: EthicsMonitorResult['detectedPatterns']): string[] {
    const concerns: string[] = []

    if (riskTypes.includes('suicide_ideation')) {
      concerns.push('检测到自杀意念相关内容，需要立即关注')
    }
    if (riskTypes.includes('self_harm')) {
      concerns.push('发现自伤行为倾向，需要专业干预')
    }
    if (riskTypes.includes('violence_threat')) {
      concerns.push('存在暴力威胁风险，需要评估和监控')
    }
    if (riskTypes.includes('psychosis')) {
      concerns.push('可能存在精神病性症状，建议精神科评估')
    }
    if (riskTypes.includes('substance_abuse')) {
      concerns.push('涉及物质滥用问题，需要专业成瘾治疗')
    }

    // 添加基于检测模式的具体关注点
    for (const pattern of patterns) {
      if (pattern.contextScore > 1.5) {
        concerns.push(`${pattern.pattern.riskType}相关内容在特定情境下风险较高`)
      }
    }

    return concerns
  }

  /**
   * 生成建议
   */
  private static generateRecommendations(riskTypes: RiskType[]): string[] {
    const recommendations: string[] = []

    for (const riskType of riskTypes) {
      const template = INTERVENTION_TEMPLATES[riskType]
      if (template) {
        recommendations.push(...template.immediate)
      }
    }

    return [...new Set(recommendations)] // 去重
  }

  /**
   * 生成安全回复
   */
  static generateSafeResponse(riskTypes: RiskType[]): string {
    if (riskTypes.includes('suicide_ideation')) {
      return `我非常关心您现在的感受。如果您有自伤或自杀的想法，请立即寻求帮助：

🆘 紧急情况请拨打：120
📞 心理危机干预热线：400-161-9995
🏥 请前往最近的医院急诊科

您的生命很宝贵，专业的帮助就在身边。我建议您现在就联系专业的心理健康服务。`
    }

    if (riskTypes.includes('self_harm')) {
      return `我理解您现在可能很痛苦。自伤虽然可能暂时缓解情绪，但会带来更多伤害。让我们一起寻找更健康的应对方式：

📞 心理支持热线：400-161-9995
🏥 建议寻求专业心理健康服务
💡 尝试深呼吸、冷水洗脸或握冰块等替代方法

您值得得到专业的帮助和支持。`
    }

    if (riskTypes.includes('violence_threat')) {
      return `我注意到您提到了一些愤怒或冲突的情况。管理这些强烈情绪很重要：

🛑 请先让自己冷静下来
📞 如需要，可联系心理支持：400-161-9995
💭 考虑寻求专业的愤怒管理帮助

每个人都值得在安全的环境中解决问题。`
    }

    return `我注意到您可能正在经历一些困难。虽然我可以提供一些支持，但对于某些情况，专业的帮助会更有效：

📞 心理支持热线：400-161-9995
🏥 考虑咨询专业心理健康服务
👥 寻求信任的朋友或家人支持

请记住，寻求帮助是勇敢的表现。`
  }
}

export { type EthicsMonitorResult }