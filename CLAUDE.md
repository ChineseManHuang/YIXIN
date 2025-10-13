# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在处理本仓库代码时提供指导。

---

## AI 使用指导

- 为了节省主要上下文空间，在进行代码搜索、检查、故障排查或分析时，请使用 **code-searcher 子代理**，并为子代理提供完整的上下文背景信息
- 在收到工具结果后，请仔细评估结果质量，再决定下一步操作。要先思考，再规划和迭代，然后采取最佳的下一步措施
- 为了最高效率，若需要执行多个相互独立的操作，应当 **同时调用** 所有相关工具，而不是依次调用
- 在完成任务之前，请务必验证你的解决方案
- **只做被要求的事，不要多做，也不要少做**
- **绝不要新建不必要的文件**，除非实现目标确实需要
- 在可能的情况下，**优先修改已有文件**，而不是新建文件
- **绝不要主动创建文档文件（*.md 或 README 文件）**，除非用户明确要求
- 当更新或修改核心上下文文件时，也需要同步更新 Markdown 文档和记忆库
- 在提交更改时，排除 **CLAUDE.md** 和 **CLAUDE-*.md** 记忆库相关文件，**不要删除这些文件**

---

## 记忆库系统

本项目使用结构化的记忆库系统，并包含专门的上下文文件。在开始工作前，请务必检查这些文件，以获取相关信息。

### 核心上下文文件

- **CLAUDE-activeContext.md** - 当前会话的状态、目标与进度（如存在）
- **CLAUDE-patterns.md** - 已建立的代码模式与约定（如存在）
- **CLAUDE-decisions.md** - 架构决策与原因（如存在）
- **CLAUDE-troubleshooting.md** - 常见问题与解决方案（如存在）
- **CLAUDE-config-variables.md** - 配置变量参考（如存在）
- **CLAUDE-temp.md** - 临时草稿区（仅在被引用时读取）

⚠️ 重要提示：
始终优先查看 **active context 文件**，以理解当前正在进行的工作，并保持会话的连续性。

---

### 记忆库系统备份

当需要备份记忆库文件时，应将上述核心上下文文件以及 **@.claude 设置目录** 一并复制到目标备份目录：
`@/path/to/backup-directory`

若备份目录中已有文件，则需要覆盖。

---

## 项目概览

### 项目名称
**意心 (YIXIN)** - AI心理咨询平台

### 技术栈
**前端:**
- React 18 + TypeScript
- Vite (构建工具)
- Tailwind CSS (样式)
- React Router (路由)
- Zustand (状态管理)

**后端:**
- Node.js + Express + TypeScript
- Supabase (PostgreSQL数据库 + 认证)
- 阿里云百炼 API (qwen-turbo, qwen3-omni-flash-realtime)

**部署:**
- 前端: Vercel
- 后端: Vercel Serverless Functions

### 核心功能
1. **用户认证系统** - 基于Supabase的注册/登录/个人资料管理
2. **AI文字咨询** - 传统聊天界面的心理咨询
3. **AI语音咨询** - 沉浸式纯语音交互咨询（最新功能）
4. **KB01-05工作流** - 基于图式治疗(Schema Therapy)和ACT的五阶段线性咨询流程
5. **RAG知识库** - 包含KB01-05、伦理指南、ACT卡片等专业心理学资源

### 项目结构
```
YIXIN_PROJECT/
├── src/                    # 前端源码
│   ├── pages/             # 页面组件
│   │   ├── Consultation.tsx    # 语音咨询（新）
│   │   ├── Chat.tsx           # 文字咨询
│   │   ├── Dashboard.tsx      # 用户控制台
│   │   └── ...
│   ├── lib/               # 工具库
│   │   ├── api.ts         # API客户端
│   │   └── auth-store.ts  # 认证状态管理
│   └── App.tsx            # 路由配置
├── server/                 # 后端源码
│   ├── routes/            # API路由
│   │   ├── messages.ts    # 消息处理（含语音API）
│   │   └── sessions.ts    # 会话管理
│   ├── services/          # 业务服务
│   │   ├── bailian.ts     # 百炼API集成
│   │   ├── rag-loader.ts  # RAG知识库加载器
│   │   ├── kb-engine.ts   # KB阶段引擎
│   │   └── ethics-monitor.ts # 伦理监控
│   └── config/            # 配置
├── rag/                    # RAG知识库文件
│   ├── KB-01_EMS_Intro.md
│   ├── KB-02_Forest_Metaphor_River_Two_Forests.md
│   ├── KB-03_YSQ-S3_Forest_Questions.md
│   ├── KB-04_Hierarchical_Trigger_Dynamite_Tree.md
│   ├── KB-05_RNT_Assessment_Hierarchical_Trigger.md
│   ├── ethics_rag.md
│   └── act_rag_cards.md
└── dist/                   # 构建输出
```

### 关键路由
- `/` - 首页
- `/login` - 登录
- `/register` - 注册
- `/dashboard` - 用户控制台
- `/chat/:sessionId` - 文字咨询
- `/consultation/:sessionId` - 语音咨询（新）
- `/profile` - 个人资料
- `/resources` - 资源中心

### API端点
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/sessions` - 创建会话
- `GET /api/sessions` - 获取会话列表
- `GET /api/sessions/:id` - 获取会话详情
- `POST /api/messages` - 发送文字消息
- `POST /api/messages/voice` - 发送语音消息（新）
- `GET /api/messages/:sessionId` - 获取消息历史

### 环境变量
**必需:**
- `SUPABASE_URL` - Supabase项目URL
- `SUPABASE_ANON_KEY` - Supabase匿名密钥
- `SUPABASE_SERVICE_KEY` - Supabase服务密钥
- `JWT_SECRET` - JWT签名密钥

**可选（百炼API）:**
- `BAILIAN_ENDPOINT` - 百炼API端点
- `BAILIAN_API_KEY` - 百炼API密钥

### 数据库模式
**主要表:**
- `users` - 用户账户
- `user_profiles` - 用户个人资料
- `sessions` - 咨询会话
- `messages` - 消息记录
- `kb_progress` - KB阶段进度跟踪
- `ethics_logs` - 伦理检查日志

---

## 项目特定约定

### 代码风格
- 使用TypeScript严格模式
- React函数组件 + Hooks
- 优先使用Tailwind CSS工具类
- 文件命名: PascalCase for components, kebab-case for utilities

### Git提交规范
- 使用描述性commit消息
- 包含变更类型（feat/fix/refactor/docs等）
- 结尾添加Claude Code标识

### 测试策略
- 构建前必须通过TypeScript类型检查
- 使用`npm run build`验证构建成功
- 手动测试关键用户流程

---

## 当前开发状态

参见 **CLAUDE-activeContext.md** 了解最新进展
