# Troubleshooting Guide - 意心AI心理咨询平台

本文档记录常见问题及其解决方案。

---

## 前端问题

### 问题1: 构建失败 - TypeScript类型错误
**症状:**
```
npm run build
> tsc -b && vite build
src/pages/Component.tsx:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.
```

**原因:** TypeScript类型不匹配

**解决方案:**
1. 检查类型定义是否正确
2. 使用类型断言（谨慎使用）
3. 修正实际类型不匹配

**示例:**
```typescript
// 错误
const id: number = "123"

// 正确
const id: number = 123
// 或
const id: string = "123"
```

**常见案例 - 复杂类型推断错误 (2025-01-13修复):**
```typescript
// ❌ 错误: 复杂的条件类型推断可能导致TS2536错误
let usage: typeof service.method extends (...args: any[]) => Promise<infer R> ? R['usage'] : never

// ✅ 正确: 使用明确的类型定义
import type { UsageStats } from './types'
let usage: UsageStats | null = null
```

---

### 问题2: 路由404错误（Vercel部署后）
**症状:**
- 首页可访问
- 刷新 `/dashboard` 等路由返回404

**原因:** Vercel默认不处理SPA路由，需要配置fallback

**解决方案:**
确保 `vercel.json` 包含:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**验证:**
```bash
# 本地测试构建产物
npm run build
npx serve dist
# 测试刷新页面是否404
```

---

### 问题3: 认证状态丢失（刷新后退出登录）
**症状:**
- 登录成功
- 刷新页面后退出登录

**原因:**
1. token未正确存储到localStorage
2. useAuthStore初始化问题

**解决方案:**
检查 `auth-store.ts`:
```typescript
// 确保有初始化逻辑
const useAuthStore = create<AuthState>((set) => ({
  // 从localStorage恢复状态
  token: localStorage.getItem('auth_token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: async (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  }
}))
```

**验证:**
```javascript
// 浏览器控制台
localStorage.getItem('auth_token')  // 应该有值
```

---

### 问题4: 语音录制失败 - 无法访问麦克风
**症状:**
```
Error: Failed to start recording
DOMException: Permission denied
```

**原因:**
1. 未授予麦克风权限
2. 非HTTPS环境（除localhost外）
3. 浏览器不支持MediaRecorder

**解决方案:**
1. 检查浏览器权限设置
2. 确保使用HTTPS或localhost
3. 检查浏览器兼容性

**浏览器兼容性:**
- ✅ Chrome 47+
- ✅ Firefox 25+
- ✅ Edge 79+
- ⚠️ Safari 14.1+ (部分支持)

**调试命令:**
```javascript
// 浏览器控制台测试
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('麦克风可用', stream))
  .catch(error => console.error('麦克风不可用', error))
```

---

### 问题5: TTS语音不播放
**症状:**
- AI回复显示文字
- 但无语音播放

**原因:**
1. 浏览器自动播放策略阻止
2. speechSynthesis未初始化
3. 音频格式不支持

**解决方案:**
```typescript
// 1. 确保用户有交互后再播放
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()  // 清除队列

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.pitch = 1.0

    // 添加错误处理
    utterance.onerror = (error) => {
      console.error('TTS error:', error)
    }

    speechSynthesis.speak(utterance)
  }
}

// 2. 检查语音列表
window.speechSynthesis.getVoices()
```

**替代方案:**
如果浏览器TTS不可用，考虑使用Audio元素播放base64音频

---

## 后端问题

### 问题6: Supabase连接失败
**症状:**
```
Error: Failed to fetch
或
Error: Invalid JWT
```

**原因:**
1. 环境变量未设置
2. Supabase URL/密钥错误
3. RLS策略阻止访问

**解决方案:**
```bash
# 1. 检查环境变量
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# 2. 验证Supabase配置
# server/config/database.ts
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  # 注意：后端使用SERVICE_KEY
)

# 3. 检查RLS策略
# Supabase Dashboard -> Authentication -> Policies
```

**调试:**
```typescript
// 测试连接
const { data, error } = await supabase
  .from('users')
  .select('count')

console.log('Supabase test:', { data, error })
```

---

### 问题7: 百炼API调用失败
**症状:**
```
Error: 语音咨询服务暂时不可用
或
Error: Bailian API returned empty response
```

**原因:**
1. API密钥未配置或错误
2. 网络问题
3. API调用次数超限
4. 请求格式不正确

**解决方案:**
```bash
# 1. 检查环境变量
echo $BAILIAN_ENDPOINT
echo $BAILIAN_API_KEY

# 2. 测试API连接
curl -X POST 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation' \
  -H "Authorization: Bearer $BAILIAN_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "qwen-turbo",
    "input": {
      "messages": [
        {"role": "user", "content": "测试"}
      ]
    }
  }'
```

**fallback机制:**
当API不可用时，系统会自动回退到模拟响应:
```typescript
if (!this.client) {
  return this.getMockCounselingResponse(context, userMessage)
}
```

---

### 问题8: 语音API用户消息保存错误
**症状:**
- 用户发送语音消息
- 数据库中用户消息内容是AI的回复

**原因:**
之前的实现错误地将AI回复保存为用户消息

**解决方案:**
已在ADR-008中修复，现在使用:
```typescript
// 正确的实现
userTranscript = '[语音消息 - 暂时无法转写]'  // 或真实ASR结果
const { data: userMessage } = await supabase
  .from('messages')
  .insert({
    sender_type: 'user',
    content: userTranscript,  // 用户输入
    // ...
  })
```

---

### 问题9: JWT token过期
**症状:**
```
Error: JWT expired
或
401 Unauthorized
```

**原因:**
JWT token有效期到期（通常24小时）

**解决方案:**
1. 实现token刷新机制
2. 或要求用户重新登录

**当前实现:**
要求用户重新登录（简单方案）

**未来改进:**
```typescript
// 在api.ts中添加token刷新逻辑
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // 尝试刷新token
      const newToken = await refreshToken()
      // 重试原请求
    }
    return Promise.reject(error)
  }
)
```

---

### 问题10: KB进度不更新
**症状:**
- 用户完成多轮对话
- KB阶段始终是KB-01

**原因:**
1. KB进度评估逻辑未触发
2. 评估标准过于严格
3. 数据库更新失败

**解决方案:**
```typescript
// 检查kb-engine.ts中的评估逻辑
const assessment = await KBEngine.assessStageProgress(
  sessionId,
  conversationHistory
)

console.log('KB Assessment:', assessment)

// 检查进度条件
if (assessment.canProgress && assessment.nextStage) {
  await KBEngine.progressToNextStage(sessionId)
}
```

**调试:**
```sql
-- 检查kb_progress表
SELECT * FROM kb_progress WHERE session_id = 'xxx';

-- 检查评估结果
SELECT metadata->'kb_progress' FROM messages
WHERE session_id = 'xxx'
ORDER BY created_at DESC LIMIT 1;
```

---

## 部署问题

### 问题11: Vercel部署失败 - 构建超时
**症状:**
```
Error: Build exceeded maximum time limit
```

**原因:**
1. 依赖安装慢
2. TypeScript编译慢
3. 构建脚本低效

**解决方案:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",  // 使用ci而非install
  "framework": "vite"
}
```

**优化构建:**
```json
// package.json
{
  "scripts": {
    "build": "tsc -b && vite build --mode production"
  }
}
```

---

### 问题12: 环境变量未生效
**症状:**
- 本地运行正常
- Vercel部署后功能异常

**原因:**
Vercel环境变量未配置

**解决方案:**
1. Vercel Dashboard -> Settings -> Environment Variables
2. 添加所有必需变量:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET
   - BAILIAN_ENDPOINT (可选)
   - BAILIAN_API_KEY (可选)

3. 重新部署

**验证:**
```bash
# 在Vercel部署日志中检查
vercel logs
```

---

### 问题13: API路由404（Vercel）
**症状:**
- 前端页面正常
- API请求返回404

**原因:**
Vercel Serverless函数未正确配置

**解决方案:**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**检查函数:**
- Vercel Dashboard -> Functions
- 确保所有API路由都在列表中

---

## 数据库问题

### 问题14: RLS策略阻止访问
**症状:**
```
Error: new row violates row-level security policy
或
返回空数据但应该有数据
```

**原因:**
Supabase RLS策略过于严格

**解决方案:**
```sql
-- 检查现有策略
SELECT * FROM pg_policies WHERE tablename = 'sessions';

-- 示例：允许用户访问自己的会话
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**临时禁用RLS（仅开发环境）:**
```sql
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
```

---

### 问题15: 外键约束违反
**症状:**
```
Error: insert or update on table "messages" violates foreign key constraint
```

**原因:**
- session_id不存在
- user_id不存在

**解决方案:**
```typescript
// 始终先验证关联记录存在
const { data: session } = await supabase
  .from('sessions')
  .select('id')
  .eq('id', sessionId)
  .eq('user_id', userId)
  .single()

if (!session) {
  throw new Error('Session not found')
}

// 然后再插入消息
const { data: message } = await supabase
  .from('messages')
  .insert({ session_id: sessionId, ... })
```

---

## 性能问题

### 问题16: 首次加载慢
**症状:**
- 首次访问网站加载时间>5秒

**原因:**
1. Bundle过大
2. 未使用代码分割
3. 未启用压缩

**解决方案:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

**验证:**
```bash
npm run build
# 检查dist/assets目录中的文件大小
```

---

### 问题17: API响应慢
**症状:**
- API请求时间>3秒

**原因:**
1. Serverless冷启动
2. 数据库查询未优化
3. 百炼API响应慢

**解决方案:**
```typescript
// 1. 预热Serverless函数
// 使用cron job定期ping API

// 2. 优化数据库查询
// 添加索引
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

// 3. 并行请求
const [sessions, messages] = await Promise.all([
  api.sessions.list(),
  api.messages.get(sessionId)
])
```

---

## 兼容性问题

### 问题18: Safari语音功能异常
**症状:**
- Chrome正常
- Safari无法录音或播放

**原因:**
Safari对Web Audio API支持有限

**解决方案:**
```typescript
// 检测Safari并提供替代方案
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

if (isSafari) {
  // 使用兼容性更好的MediaRecorder配置
  const recorder = new MediaRecorder(stream, {
    mimeType: 'audio/mp4'  // Safari推荐格式
  })
}
```

**用户提示:**
如果功能不可用，显示友好提示:
```
"您的浏览器可能不支持语音功能，建议使用Chrome、Firefox或Edge浏览器"
```

---

### 问题19: 移动端语音按钮太小
**症状:**
- 桌面端正常
- 移动端按钮难以点击

**解决方案:**
```typescript
// 响应式设计
<button className="
  w-48 h-48          // 桌面端
  md:w-40 md:h-40    // 平板
  sm:w-32 sm:h-32    // 手机
">
```

---

## 快速诊断清单

当遇到问题时，依次检查:

**前端:**
- [ ] 浏览器控制台是否有错误？
- [ ] 网络请求是否成功（Network标签）？
- [ ] localStorage中token是否存在？
- [ ] 是否使用HTTPS（语音功能）？

**后端:**
- [ ] 环境变量是否正确设置？
- [ ] Supabase连接是否正常？
- [ ] API日志显示什么错误？
- [ ] RLS策略是否正确？

**部署:**
- [ ] Vercel构建是否成功？
- [ ] 环境变量是否在Vercel配置？
- [ ] API函数是否部署成功？

**数据库:**
- [ ] 表结构是否正确？
- [ ] 数据是否存在？
- [ ] 外键约束是否满足？

---

## 获取帮助

### 日志位置
- **前端:** 浏览器控制台 (F12)
- **后端:** Vercel Dashboard -> Logs
- **数据库:** Supabase Dashboard -> Logs

### 常用命令
```bash
# 本地调试
npm run dev
npm run build
npm run type-check

# 查看Vercel日志
vercel logs

# 数据库诊断
# 在Supabase SQL编辑器中运行诊断查询
```

### 联系支持
- GitHub Issues: https://github.com/ChineseManHuang/YIXIN/issues
- 项目文档: ./README.md
- Claude Code记忆库: CLAUDE-*.md files
