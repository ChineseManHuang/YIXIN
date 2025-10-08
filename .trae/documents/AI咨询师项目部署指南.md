# AI咨询师项目部署指南

## 1. 部署概述

本项目是一个基于 React + Node.js + Supabase 的 AI 心理咨询应用，支持前后端一体化部署到 Vercel 平台。

### 1.1 技术架构
- **前端**: React 18 + Vite + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: Vercel
- **认证**: JWT + Supabase Auth

### 1.2 部署方式
- 前后端统一部署到 Vercel
- 使用 Vercel Functions 运行后端 API
- 前端静态文件托管在 Vercel CDN

## 2. 部署前准备

### 2.1 环境要求
- Node.js 20+
- npm 或 yarn
- Git
- Vercel 账号
- Supabase 账号

### 2.2 项目结构确认
```
f:\YIXIN_PROJECT\
├── src/           # 前端源码
├── api/           # 后端 API
├── dist/          # 构建输出
├── vercel.json    # Vercel 配置
├── package.json   # 依赖管理
└── .env          # 环境变量
```

## 3. 环境变量配置

### 3.1 生产环境变量清单

在 Vercel 项目设置中配置以下环境变量：

#### 必需变量
```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 配置
JWT_SECRET=your-secure-random-jwt-secret

# 服务器配置
PORT=3001
CLIENT_ORIGINS=https://your-domain.vercel.app

# 前端配置
VITE_API_URL=/api
VITE_SOCKET_URL=https://your-domain.vercel.app
```

#### 可选变量
```bash
# 阿里云百炼 AI 服务
BAILIAN_API_KEY=your-bailian-api-key
BAILIAN_ENDPOINT=your-bailian-endpoint

# 阿里云语音服务
ALIBABA_VOICE_API_KEY=your-voice-api-key
ALIBABA_VOICE_API_URL=your-voice-api-url

# 部署钩子（用于自动化部署）
BACKEND_DEPLOY_HOOK_URL=your-backend-hook-url
FRONTEND_DEPLOY_HOOK_URL=your-frontend-hook-url
```

### 3.2 获取 Supabase 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings → API
4. 复制以下信息：
   - Project URL → `SUPABASE_URL`
   - anon public → `SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### 3.3 生成 JWT Secret

```bash
# 使用 Node.js 生成安全的 JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 4. Vercel 部署步骤

### 4.1 方式一：通过 Vercel CLI

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **初始化项目**
```bash
cd f:\YIXIN_PROJECT
vercel
```

4. **配置项目设置**
- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

5. **设置环境变量**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
# ... 添加其他必需变量
```

6. **部署**
```bash
vercel --prod
```

### 4.2 方式二：通过 GitHub 集成

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **连接 Vercel**
- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 点击 "New Project"
- 选择 GitHub 仓库
- 导入项目

3. **配置构建设置**
- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

4. **添加环境变量**
- 在项目设置中添加所有必需的环境变量
- 确保所有变量都设置为 Production 环境

5. **触发部署**
- 点击 "Deploy" 按钮
- 等待构建完成

## 5. 数据库迁移

### 5.1 Supabase 数据库设置

1. **运行迁移脚本**
```sql
-- 在 Supabase SQL Editor 中依次执行：
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_update_schema.sql  
-- 3. supabase/migrations/003_voice_logs_table.sql
```

2. **配置 RLS 策略**
- 确保所有表都启用了 Row Level Security
- 验证用户权限策略正确配置

3. **设置存储桶（如需要）**
- 创建用于头像和文件上传的存储桶
- 配置适当的访问策略

## 6. 部署验证

### 6.1 功能测试清单

部署完成后，请验证以下功能：

- [ ] 首页正常加载
- [ ] 用户注册功能
- [ ] 用户登录功能
- [ ] 会话创建和管理
- [ ] 消息发送和接收
- [ ] 语音功能（如已配置）
- [ ] 用户资料管理
- [ ] 响应式设计

### 6.2 性能检查

- [ ] 页面加载速度 < 3秒
- [ ] API 响应时间 < 1秒
- [ ] 移动端适配正常
- [ ] HTTPS 证书有效

### 6.3 错误监控

1. **查看 Vercel 函数日志**
```bash
vercel logs
```

2. **监控 Supabase 日志**
- 在 Supabase Dashboard 查看 API 调用日志
- 检查数据库连接状态

## 7. 域名配置

### 7.1 自定义域名

1. **在 Vercel 项目设置中添加域名**
2. **配置 DNS 记录**
```
Type: CNAME
Name: your-subdomain (或 @)
Value: cname.vercel-dns.com
```

3. **更新环境变量**
```bash
CLIENT_ORIGINS=https://your-custom-domain.com
VITE_SOCKET_URL=https://your-custom-domain.com
```

### 7.2 SSL 证书

Vercel 会自动为自定义域名提供 SSL 证书，通常在域名添加后几分钟内生效。

## 8. 持续部署

### 8.1 自动部署

项目已配置 GitHub 集成，每次推送到 main 分支都会自动触发部署。

### 8.2 部署钩子

使用项目内置的部署脚本：

```bash
# 部署前端和后端
npm run deploy

# 仅部署后端
npm run deploy:backend

# 仅部署前端  
npm run deploy:frontend
```

### 8.3 回滚策略

如果部署出现问题：

1. **通过 Vercel Dashboard 回滚**
   - 进入项目的 Deployments 页面
   - 选择之前的稳定版本
   - 点击 "Promote to Production"

2. **通过 Git 回滚**
```bash
git revert HEAD
git push origin main
```

## 9. 监控和维护

### 9.1 性能监控

- 使用 Vercel Analytics 监控访问量和性能
- 配置 Supabase 监控告警
- 定期检查 API 响应时间

### 9.2 安全维护

- 定期更新依赖包
- 监控 Supabase 安全日志
- 定期轮换 API 密钥

### 9.3 备份策略

- Supabase 自动备份数据库
- 定期导出重要配置
- 保持代码仓库同步

## 10. 故障排除

### 10.1 常见问题

**问题：部署后 API 请求失败**
- 检查环境变量是否正确配置
- 验证 Supabase 连接配置
- 查看 Vercel 函数日志

**问题：前端页面空白**
- 检查构建日志是否有错误
- 验证 `dist` 目录是否正确生成
- 检查 `vercel.json` 路由配置

**问题：数据库连接失败**
- 验证 Supabase URL 和密钥
- 检查数据库迁移是否完成
- 确认 RLS 策略配置正确

### 10.2 调试工具

```bash
# 查看部署日志
vercel logs --follow

# 本地测试生产构建
npm run build
npm run preview

# 检查环境变量
vercel env ls
```

## 11. 成本优化

### 11.1 Vercel 用量优化

- 合理设置函数超时时间
- 优化静态资源大小
- 使用 CDN 缓存策略

### 11.2 Supabase 用量优化

- 合理设计数据库查询
- 使用连接池
- 定期清理过期数据

---

**部署完成后，你的 AI 咨询师应用将在 `https://your-project.vercel.app` 上线运行！**

如有问题，请检查 Vercel 部署日志和 Supabase 监控面板。