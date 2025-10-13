# Code Patterns - 意心AI心理咨询平台

本文档记录项目中建立的代码模式、约定和最佳实践。

---

## 前端模式

### 1. React组件结构

**标准组件模板:**
```typescript
/**
 * 组件描述
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import { IconComponent } from 'lucide-react'
import type { TypeImports } from '../lib/types'

const ComponentName: React.FC = () => {
  const navigate = useNavigate()
  const { param } = useParams<{ param: string }>()
  const { isAuthenticated } = useAuthStore()

  // 状态声明（按类别分组）
  const [data, setData] = useState<Type | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const someRef = useRef<HTMLElement | null>(null)

  // Effects
  useEffect(() => {
    // 效果逻辑
  }, [dependencies])

  // 事件处理器
  const handleEvent = useCallback(async () => {
    // 处理逻辑
  }, [dependencies])

  // 条件渲染
  if (!isAuthenticated) {
    return null
  }

  // 主渲染
  return (
    <div className="container">
      {/* JSX */}
    </div>
  )
}

export default ComponentName
```

### 2. 状态管理模式

**Zustand Store:**
```typescript
import { create } from 'zustand'

interface StoreState {
  // 状态
  data: Type | null
  isLoading: boolean

  // 动作
  setData: (data: Type) => void
  fetchData: () => Promise<void>
  reset: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  data: null,
  isLoading: false,

  setData: (data) => set({ data }),

  fetchData: async () => {
    set({ isLoading: true })
    try {
      const result = await api.getData()
      set({ data: result })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  reset: () => set({ data: null, isLoading: false })
}))
```

### 3. API调用模式

**使用api.ts客户端:**
```typescript
// 好的做法
const response = await api.sessions.get(sessionId)
if (response.success && response.data) {
  setSession(response.data.session)
}

// 避免直接fetch（除非特殊情况如文件上传）
const token = localStorage.getItem('auth_token')
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 4. 错误处理模式

**统一错误处理:**
```typescript
try {
  setIsLoading(true)
  setError(null)

  const response = await api.someAction()
  if (response.success && response.data) {
    // 成功处理
  } else {
    throw new Error(response.error || '操作失败')
  }
} catch (err) {
  console.error('Operation failed:', err)
  const errorMessage = err instanceof Error ? err.message : '操作失败，请重试'
  setError(errorMessage)

  // 特殊错误类型处理
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    setError('无法连接到服务器，请检查网络连接')
  }
} finally {
  setIsLoading(false)
}
```

### 5. Tailwind CSS模式

**组件样式约定:**
```typescript
// 容器
<div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

// 卡片
<div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200/50">

// 按钮 - 主要
<button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md">

// 按钮 - 次要
<button className="px-5 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200">

// 输入框
<input className="w-full px-4 py-3 border border-gray-300/50 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />

// 加载状态
<Loader2 className="w-5 h-5 animate-spin" />

// 动画
<div className="animate-in slide-in-from-bottom-2 fade-in duration-500">
```

---

## 后端模式

### 1. Express路由结构

**标准路由模板:**
```typescript
import { Router, type Request, type Response } from 'express'
import { supabase } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// 认证中间件
router.use(authenticateToken)

/**
 * 端点描述
 * METHOD /api/path
 */
router.method('/path', async (req: Request, res: Response): Promise<void> => {
  try {
    const { param } = req.body
    const userId = req.user!.id

    // 参数验证
    if (!param) {
      res.status(400).json({
        success: false,
        error: 'Parameter required'
      })
      return
    }

    // 业务逻辑
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    // 成功响应
    res.json({
      success: true,
      data: data
    })
  } catch (error: unknown) {
    console.error('Operation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router
```

### 2. Supabase查询模式

**常用查询模式:**
```typescript
// 单条记录（带权限检查）
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('id', sessionId)
  .eq('user_id', userId)
  .single()

// 关联查询
const { data } = await supabase
  .from('sessions')
  .select(`
    *,
    users!inner (
      id,
      email,
      user_profiles (
        full_name,
        age
      )
    )
  `)
  .eq('id', sessionId)

// 插入并返回
const { data: newRecord } = await supabase
  .from('table')
  .insert({
    field1: value1,
    field2: value2
  })
  .select('*')
  .single()

// 更新
await supabase
  .from('table')
  .update({ field: value })
  .eq('id', id)

// 分页查询
const { data } = await supabase
  .from('table')
  .select('*')
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1)
```

### 3. 服务类模式

**单例服务:**
```typescript
class ServiceName {
  private client: SomeClient
  private config: Config

  constructor() {
    this.config = this.loadConfig()
    this.client = this.initializeClient()
  }

  private loadConfig(): Config {
    // 配置加载
  }

  private initializeClient(): SomeClient {
    // 客户端初始化
  }

  async performAction(params: Params): Promise<Result> {
    try {
      // 业务逻辑
      return result
    } catch (error) {
      console.error('[服务名] 操作失败:', error)
      throw new Error('友好的错误消息')
    }
  }
}

// 导出单例
export const serviceName = new ServiceName()
export default serviceName
```

### 4. RAG知识库模式

**知识库加载:**
```typescript
class RAGLoader {
  private cache: Map<string, Content> = new Map()
  private isLoaded = false

  constructor() {
    this.loadAllKnowledge()
  }

  private async loadAllKnowledge(): Promise<void> {
    // 加载所有文件
    await Promise.all([
      this.loadKBFiles(),
      this.loadEthicsGuideline(),
      this.loadACTCards()
    ])
    this.isLoaded = true
  }

  public getKB(kbId: string): Content | undefined {
    return this.cache.get(kbId)
  }

  public buildSystemPrompt(stage: number, context: Record<string, unknown>): string {
    const kb = this.getKB(`KB-0${stage}`)
    // 构建提示词
    return prompt
  }
}

export const ragLoader = new RAGLoader()
```

---

## 数据模式

### 1. 类型定义

**API响应类型:**
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    has_more: boolean
  }
}
```

**实体类型:**
```typescript
export interface User {
  id: string
  email: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string
  status: 'active' | 'completed' | 'paused'
  current_kb_step: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  sender_type: 'user' | 'ai'
  content: string
  message_type: 'text' | 'audio'
  metadata?: Record<string, unknown>
  created_at: string
}
```

### 2. KB阶段流程

**KB01-05线性工作流:**
```
KB-01: 早期不良图式介绍
  └─> 建立信任关系，介绍EMS概念

KB-02: 森林隐喻
  └─> 使用隐喻探索图式来源

KB-03: YSQ森林问答
  └─> 通过问题识别具体图式

KB-04: 层级化触发
  └─> 分析触发机制和应对模式

KB-05: RNT评估
  └─> 评估反刍思维，总结和规划
```

---

## 命名约定

### 文件命名
- **组件:** PascalCase (Dashboard.tsx, VoiceConsultation.tsx)
- **工具/服务:** kebab-case (auth-store.ts, rag-loader.ts)
- **类型文件:** types.ts, api.ts
- **配置文件:** kebab-case (database.ts, env.ts)

### 变量命名
- **状态:** camelCase (isLoading, currentMessage)
- **常量:** UPPER_SNAKE_CASE (API_URL, MAX_RETRIES)
- **组件:** PascalCase (Button, VoiceButton)
- **函数:** camelCase (handleClick, fetchData)
- **类型/接口:** PascalCase (User, ApiResponse)

### 函数命名前缀
- `handle*` - 事件处理器 (handleSubmit, handleClick)
- `fetch*` - 数据获取 (fetchSessions, fetchUser)
- `load*` - 资源加载 (loadSession, loadKB)
- `initialize*` - 初始化 (initializeSession)
- `validate*` - 验证 (validateInput)
- `build*` - 构建 (buildPrompt)
- `generate*` - 生成 (generateResponse)

---

## 安全模式

### 1. 认证检查
```typescript
// 前端路由保护
useEffect(() => {
  if (!isAuthenticated) {
    navigate('/login')
  }
}, [isAuthenticated, navigate])

// 后端路由保护
router.use(authenticateToken)
```

### 2. 数据验证
```typescript
// 参数验证
if (!sessionId || typeof content !== 'string' || content.trim().length === 0) {
  res.status(400).json({
    success: false,
    error: 'Required parameters missing'
  })
  return
}

// 所有权验证
const { data: session } = await supabase
  .from('sessions')
  .select('id')
  .eq('id', sessionId)
  .eq('user_id', userId)
  .single()

if (!session) {
  res.status(404).json({
    success: false,
    error: 'Not found or access denied'
  })
  return
}
```

### 3. 错误信息脱敏
```typescript
// 好的做法 - 不暴露内部细节
res.status(500).json({
  success: false,
  error: 'Internal server error'
})

// 避免 - 暴露数据库错误
res.status(500).json({
  success: false,
  error: error.message  // 可能包含敏感信息
})
```

---

## 性能优化模式

### 1. React优化
```typescript
// 使用useCallback避免重新渲染
const handleClick = useCallback(() => {
  // 逻辑
}, [dependencies])

// 使用useMemo缓存计算结果
const filteredData = useMemo(() => {
  return data.filter(item => condition)
}, [data, condition])

// 条件性useEffect
useEffect(() => {
  if (shouldRun) {
    doSomething()
  }
}, [shouldRun, dependencies])
```

### 2. API优化
```typescript
// 并行请求
const [sessions, messages] = await Promise.all([
  api.sessions.list(),
  api.messages.get(sessionId)
])

// 请求去重
let cachedData: Data | null = null
async function getData() {
  if (cachedData) return cachedData
  cachedData = await fetchData()
  return cachedData
}
```

---

## 测试模式

### 1. 构建验证
```bash
# TypeScript类型检查
npm run type-check

# 构建测试
npm run build
```

### 2. 手动测试清单
- [ ] 用户注册登录流程
- [ ] 创建新会话
- [ ] 发送文字消息
- [ ] 发送语音消息
- [ ] KB阶段推进
- [ ] 错误处理（网络断开、权限错误等）
- [ ] 移动端响应式
- [ ] 跨浏览器兼容性

---

## Git提交模式

### Commit消息格式
```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**类型:**
- `feat` - 新功能
- `fix` - 修复bug
- `refactor` - 重构
- `docs` - 文档更新
- `style` - 代码格式
- `test` - 测试相关
- `chore` - 构建/工具相关

**示例:**
```
feat: Implement immersive voice-only consultation interface

- Removed all dialog boxes and chat bubbles
- Added large circular voice button (192px)
- AI auto-initiates conversation with KB-stage-specific greetings
- Fixed voice API endpoint with fallback mechanism

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
