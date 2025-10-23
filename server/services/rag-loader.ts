/**
 * RAG知识库加载服务
 * 负责加载和管理KB01-05、ethics_rag和act_rag_cards
 */
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface KBContent {
  id: string
  name: string
  content: string
  purpose?: string
  workflow?: string[]
  questions?: string[]
  examples?: string[]
  notes?: string[]
}

export interface EthicsGuideline {
  principles: string[]
  checklist: Record<string, string[]>
  procedures: Record<string, string[]>
}

export interface ACTCard {
  id: string
  type: 'card' | 'case' | 'micro'
  keywords: string[]
  content: string
  summary?: string
  usage?: string
}

class RAGLoader {
  private kbCache: Map<string, KBContent> = new Map()
  private ethicsCache: EthicsGuideline | null = null
  private actCardsCache: ACTCard[] = []
  private isLoaded = false

  constructor() {
    this.loadAllKnowledge()
  }

  /**
   * 加载所有知识库内容
   */
  private async loadAllKnowledge(): Promise<void> {
    try {
      const ragDir = path.join(__dirname, '../../rag')

      // 加载KB01-05
      await this.loadKBFiles(ragDir)

      // 加载伦理指南
      await this.loadEthicsGuideline(ragDir)

      // 加载ACT卡片
      await this.loadACTCards(ragDir)

      this.isLoaded = true
      console.log('[RAG加载器] 所有知识库内容已加载完成')
    } catch (error) {
      console.error('[RAG加载器] 加载知识库失败:', error)
    }
  }

  /**
   * 加载KB文件(KB-01到KB-05)
   */
  private async loadKBFiles(ragDir: string): Promise<void> {
    const kbFiles = [
      { id: 'KB-01', file: 'KB-01_EMS_Intro.md', name: '早期不良图式:概念与工作方式' },
      { id: 'KB-02', file: 'KB-02_Forest_Metaphor_River_Two_Forests.md', name: '森林隐喻' },
      { id: 'KB-03', file: 'KB-03_YSQ-S3_Forest_Questions.md', name: 'YSQ森林问答' },
      { id: 'KB-04', file: 'KB-04_Hierarchical_Trigger_Dynamite_Tree.md', name: '层级化触发' },
      { id: 'KB-05', file: 'KB-05_RNT_Assessment_Hierarchical_Trigger.md', name: 'RNT评估' }
    ]

    for (const kb of kbFiles) {
      try {
        const filePath = path.join(ragDir, kb.file)
        const content = await fs.readFile(filePath, 'utf-8')

        // 解析markdown内容
        const parsed = this.parseKBMarkdown(content)

        this.kbCache.set(kb.id, {
          id: kb.id,
          name: kb.name,
          content,
          ...parsed
        })

        console.log(`[RAG加载器] 已加载 ${kb.id}: ${kb.name}`)
      } catch (error) {
        console.error(`[RAG加载器] 加载 ${kb.id} 失败:`, error)
      }
    }
  }

  /**
   * 解析KB Markdown文件
   */
  private parseKBMarkdown(content: string): Partial<KBContent> {
    const result: Partial<KBContent> = {
      workflow: [],
      questions: [],
      examples: [],
      notes: []
    }

    // 提取Purpose
    const purposeMatch = content.match(/> Purpose: (.+)/i)
    if (purposeMatch) {
      result.purpose = purposeMatch[1].trim()
    }

    // 提取工作流
    const workflowSection = content.match(/## 工作流\s+([\s\S]*?)(?=##|$)/i)
    if (workflowSection) {
      const steps = workflowSection[1].match(/\d+\.\s*\*\*(.+?)\*\*[：:]\s*(.+?)(?=\d+\.|$)/gs)
      if (steps) {
        result.workflow = steps.map(s => s.trim())
      }
    }

    // 提取问题清单
    const questionsSection = content.match(/## (?:提问清单|问句清单)\s+([\s\S]*?)(?=##|$)/i)
    if (questionsSection) {
      const questions = questionsSection[1].match(/[-•]\s*["""'](.+?)["""']/g)
      if (questions) {
        result.questions = questions.map(q => q.replace(/[-•]\s*["""']/g, '').replace(/["""']/g, '').trim())
      }
    }

    // 提取注意事项
    const notesSection = content.match(/## 注意事项\s+([\s\S]*?)(?=##|$)/i)
    if (notesSection) {
      const notes = notesSection[1].match(/[-•]\s*(.+?)(?=\n[-•]|$)/g)
      if (notes) {
        result.notes = notes.map(n => n.replace(/[-•]\s*/g, '').trim())
      }
    }

    return result
  }

  /**
   * 加载伦理指南
   */
  private async loadEthicsGuideline(ragDir: string): Promise<void> {
    try {
      const filePath = path.join(ragDir, 'ethics_rag.md')
      const content = await fs.readFile(filePath, 'utf-8')

      // 提取核心伦理原则
      const principlesMatch = content.match(/# 1\. 核心伦理原则[\s\S]*?- \*\*(.+?)\*\*：(.+?)(?=- \*\*|#)/g)
      const principles = principlesMatch ? principlesMatch.map(p => {
        const match = p.match(/\*\*(.+?)\*\*：(.+)/)
        return match ? `${match[1]}: ${match[2].trim()}` : ''
      }).filter(Boolean) : []

      // 提取检查清单
      const checklist: Record<string, string[]> = {}
      const checklistSections = content.match(/## (\d+\.\d+) (.+?)清单\s+([\s\S]*?)(?=##|---|\n\n#)/g)
      if (checklistSections) {
        for (const section of checklistSections) {
          const titleMatch = section.match(/## \d+\.\d+ (.+?)清单/)
          const items = section.match(/- \[ \] (.+)/g)
          if (titleMatch && items) {
            checklist[titleMatch[1]] = items.map(i => i.replace(/- \[ \] /, '').trim())
          }
        }
      }

      // 提取决策流程
      const procedures: Record<string, string[]> = {}
      const procedureSections = content.match(/## (\d+\.\d+) (.+?)流程[\s\S]*?(?=##|---|\n\n#)/g)
      if (procedureSections) {
        for (const section of procedureSections) {
          const titleMatch = section.match(/## \d+\.\d+ (.+?)流程/)
          const steps = section.match(/\d+\.\s+(.+?)(?=\d+\.|$)/g)
          if (titleMatch && steps) {
            procedures[titleMatch[1]] = steps.map(s => s.trim())
          }
        }
      }

      this.ethicsCache = {
        principles,
        checklist,
        procedures
      }

      console.log('[RAG加载器] 已加载伦理指南')
    } catch (error) {
      console.error('[RAG加载器] 加载伦理指南失败:', error)
    }
  }

  /**
   * 加载ACT卡片
   */
  private async loadACTCards(ragDir: string): Promise<void> {
    try {
      const filePath = path.join(ragDir, 'act_rag_cards.md')
      const content = await fs.readFile(filePath, 'utf-8')

      // 按---分割卡片
      const cardSections = content.split(/\n---\n/)

      for (const section of cardSections) {
        if (!section.trim() || section.startsWith('---\ntitle:')) continue

        const idMatch = section.match(/id:\s*(.+)/)
        const keywordsMatch = section.match(/keywords:\s*\[(.+?)\]/)
        const summaryMatch = section.match(/summary:\s*(.+?)(?=\n[a-z_]+:|$)/s)
        const usageMatch = section.match(/usage:\s*(.+?)(?=\n[a-z_]+:|---|\n\n#)/s)

        if (idMatch) {
          const card: ACTCard = {
            id: idMatch[1].trim(),
            type: idMatch[1].includes('case') ? 'case' : idMatch[1].includes('micro') ? 'micro' : 'card',
            keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
            content: section.trim(),
            summary: summaryMatch ? summaryMatch[1].trim() : undefined,
            usage: usageMatch ? usageMatch[1].trim() : undefined
          }

          this.actCardsCache.push(card)
        }
      }

      console.log(`[RAG加载器] 已加载 ${this.actCardsCache.length} 张ACT卡片`)
    } catch (error) {
      console.error('[RAG加载器] 加载ACT卡片失败:', error)
    }
  }

  /**
   * 获取指定KB内容
   */
  public getKB(kbId: string): KBContent | undefined {
    return this.kbCache.get(kbId)
  }

  /**
   * 获取当前阶段的KB内容
   */
  public getKBByStage(stage: number): KBContent | undefined {
    return this.kbCache.get(`KB-0${stage}`)
  }

  /**
   * 获取所有KB内容
   */
  public getAllKBs(): KBContent[] {
    return Array.from(this.kbCache.values())
  }

  /**
   * 获取伦理指南
   */
  public getEthicsGuideline(): EthicsGuideline | null {
    return this.ethicsCache
  }

  /**
   * 根据关键词搜索ACT卡片
   */
  public searchACTCards(keywords: string[]): ACTCard[] {
    return this.actCardsCache.filter(card => {
      return keywords.some(keyword =>
        card.keywords.some(k => k.includes(keyword) || keyword.includes(k)) ||
        card.content.includes(keyword)
      )
    })
  }

  /**
   * 根据类型获取ACT卡片
   */
  public getACTCardsByType(type: 'card' | 'case' | 'micro'): ACTCard[] {
    return this.actCardsCache.filter(card => card.type === type)
  }

  /**
   * 获取所有ACT卡片
   */
  public getAllACTCards(): ACTCard[] {
    return this.actCardsCache
  }

  /**
   * 构建系统提示词(包含KB和伦理指南)
   */
  public buildSystemPrompt(kbStage: number, userContext?: Record<string, unknown>): string {
    const kb = this.getKBByStage(kbStage)
    const ethics = this.ethicsCache

    if (!kb) {
      return '你是一位专业的AI心理咨询师,请提供温暖、专业的心理支持。'
    }

    let prompt = `# 角色定位
你是一位专业的AI心理咨询师,正在进行基于图式治疗(Schema Therapy)和接纳承诺疗法(ACT)的心理咨询。

# 当前咨询阶段
**阶段**: ${kb.id} - ${kb.name}
**目的**: ${kb.purpose || '帮助来访者探索和理解'}

# 工作流程
${kb.workflow?.map((step, i) => `${i + 1}. ${step}`).join('\n') || ''}

# 关键探索问题
${kb.questions?.map(q => `- ${q}`).join('\n') || ''}

`

    // 添加伦理指南
    if (ethics) {
      prompt += `\n# 伦理原则
${ethics.principles.map(p => `- ${p}`).join('\n')}

# 注意事项
${kb.notes?.map(n => `- ${n}`).join('\n') || ''}

`
    }

    // 添加用户上下文
    if (userContext) {
      prompt += `\n# 来访者背景
`
      Object.entries(userContext).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`
      })
    }

    prompt += `\n# 咨询原则
1. **温暖共情**: 以温暖、非评判的态度倾听和回应
2. **线性引导**: 严格按照当前阶段的工作流程线性推进
3. **适度探索**: 根据来访者的反应灵活调整探索深度
4. **价值导向**: 帮助来访者识别价值并采取一致的行动
5. **安全第一**: 时刻关注来访者的安全和伦理边界

# 回应要求
- 使用口语化、亲和的表达方式
- 每次回应控制在2-3句话,保持简洁
- 适当使用引导性问题推进咨询
- 避免诊断性语言和专业术语堆砌
- 在语音交互中,表达应该自然流畅

请根据以上指引,提供专业、温暖的心理咨询服务。`

    return prompt
  }

  /**
   * 检查是否已加载
   */
  public isReady(): boolean {
    return this.isLoaded
  }
}

// 导出单例
export const ragLoader = new RAGLoader()
export default ragLoader
