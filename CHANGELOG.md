# Changelog - 意心AI心理咨询平台

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 进行中
- **架构迁移: Vercel → 阿里云 + EdgeOne** (2025-01-13 开始)
  - 目标: 全面迁移到中国大陆友好的部署架构
  - 后端: 阿里云轻量应用服务器 (Node.js + PM2 + Nginx)
  - 前端: 腾讯云 EdgeOne CDN
  - 原因: 提升国内用户访问速度，避免 Vercel 阻隔问题
  - 状态: 准备阶段 - 已创建部署指南

### 待开发
- 会话历史RAG（跨会话上下文持久化）
- 实时语音对话（WebRTC全双工通信）
- 真实语音识别服务集成
- 移动端适配优化

---

## [0.2.1] - 2025-01-13

### Fixed
- **修复TypeScript构建错误** (`server/routes/messages.ts`)
  - 问题: 复杂的条件类型推断导致TS2536错误
  - 原因: 使用 `typeof service.method extends ... infer R ? R['field'] : never` 语法
  - 解决: 替换为明确的类型定义 `UsageStats | null` 和 `EthicsCheckResult | null`
  - 影响: 修复后构建成功通过，Vercel部署恢复正常
  - 提交: `64bf246`

### Changed
- **更新项目文档**
  - 在 `CLAUDE-activeContext.md` 中记录TypeScript修复
  - 在 `CLAUDE-troubleshooting.md` 中添加TS2536错误排查指南
  - 标记"语音API类型定义不完整"技术债务为已解决
  - 提交: `246819e`

---

## [0.2.0] - 2025-01-12

### Added
- **沉浸式纯语音咨询界面** (`src/pages/Consultation.tsx`)
  - 完全移除传统对话框和聊天气泡设计
  - 实现192px大圆形语音按钮作为唯一交互元素
  - 移除文字输入框，改为纯语音交互模式
  - AI回复以文字+语音双重形式呈现
  - 实时状态反馈（录音/说话/处理中）
  - 流畅动画效果（ping/pulse/scale）
  - 渐变背景装饰
  - 响应式设计

- **AI主动引导对话机制**
  - AI在会话初始化时自动发起问候
  - 根据KB-01至KB-05不同阶段提供个性化问候语
  - 客户端实现问候逻辑，避免不必要的API调用
  - 体现心理咨询师的主动性和专业性

- **语音API Fallback机制** (`/api/messages/voice`)
  - 百炼语音API失败时自动回退到文本API
  - 确保基本咨询功能始终可用
  - 改进错误处理和用户提示
  - 使用占位符 `[语音消息 - 暂时无法转写]` 作为临时方案

- **路由和导航更新**
  - 在 `App.tsx` 中添加 `/consultation/:sessionId` 路由
  - 在 `Dashboard.tsx` 中添加"语音咨询"按钮
  - 自动区分文字会话和语音会话
  - 支持语音和文字两种咨询模式

- **完整项目文档** (CLAUDE记忆库系统)
  - `CLAUDE.md` - 主指导文档，包含技术栈、结构、约定
  - `CLAUDE-activeContext.md` - 当前项目状态和进展追踪
  - `CLAUDE-patterns.md` - 代码模式和最佳实践
  - `CLAUDE-decisions.md` - 11个架构决策记录(ADR)
  - `CLAUDE-troubleshooting.md` - 19个常见问题及解决方案

### Fixed
- **修复语音API用户消息保存错误** (`server/routes/messages.ts:649`)
  - 问题: 用户消息内容被错误地保存为AI回复
  - 原因: `content: voiceResponse.responseText` 使用了AI的响应
  - 解决: 改为保存用户语音转文字结果 `userTranscript`
  - 相关: ADR-008 语音API Fallback策略

### Changed
- **完全重构语音咨询体验**
  - 从传统聊天界面转向沉浸式语音交互
  - 模拟真实心理咨询场景（面对面，不看屏幕）
  - 减少视觉干扰，让用户专注于语音交流
  - 差异化体验，区别于传统聊天机器人
  - 相关: ADR-006 纯语音交互界面, ADR-007 AI主动引导对话

### Technical Debt
- ⚠️ `VoiceConsultation.tsx` 文件冗余（与 `Consultation.tsx` 内容相同）
- ⚠️ 语音转文字使用占位符，需集成真实ASR服务
- ⚠️ 移动端浏览器兼容性未测试

---

## [0.1.0] - 2024年初始版本

### Added
- **核心功能**
  - 用户注册和登录系统
  - 文字聊天咨询功能
  - KB-01至KB-05线性工作流引擎
  - 基于图式治疗(Schema Therapy)的心理咨询框架
  - Supabase数据库集成
  - 百炼API文本对话集成

- **技术栈**
  - 前端: React + TypeScript + Vite + Tailwind CSS
  - 后端: Node.js + Express + TypeScript
  - 数据库: Supabase (PostgreSQL)
  - AI: 阿里云百炼 (qwen-turbo)
  - 状态管理: Zustand
  - 部署: Vercel

- **RAG知识库**
  - 本地Markdown文件作为知识源
  - KB-01至KB-05各阶段专业指导文档
  - 伦理规范文档 (ethics_rag.md)
  - ACT卡片隐喻文档 (act_rag_cards.md)

- **安全功能**
  - JWT认证
  - Row-Level Security (RLS)
  - 伦理风险监测 (EthicsMonitor)
  - KB进度追踪 (KBEngine)

### Infrastructure
- Vercel自动部署
- GitHub版本控制
- 环境变量管理
- SPA单页应用架构

---

## 版本说明

- **[Unreleased]** - 规划中的功能
- **[0.2.1]** - TypeScript修复和文档更新
- **[0.2.0]** - 纯语音交互界面重大更新
- **[0.1.0]** - 初始发布版本

---

## 贡献者

- **开发**: 由 Claude Code 辅助开发
- **项目**: 意心AI心理咨询平台团队

---

## 链接

- [GitHub 仓库](https://github.com/ChineseManHuang/YIXIN)
- [Vercel 部署](https://yixin-opal.vercel.app)
- [百炼API文档](https://help.aliyun.com/zh/dashscope/)
- [Supabase文档](https://supabase.com/docs)
