# Vercel部署指南

本项目已完全配置好用于Vercel部署。按照以下步骤进行部署：

## 前置要求

- GitHub账号
- Vercel账号（可用GitHub账号登录）
- 项目代码已推送到GitHub仓库

## 部署步骤

### 方法1: 通过Vercel网站部署（推荐新手）

1. **访问Vercel并登录**
   - 前往 https://vercel.com
   - 使用GitHub账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的GitHub仓库（YIXIN_PROJECT）
   - 点击 "Import"

3. **配置项目设置**
   - **Framework Preset**: Vite
   - **Root Directory**: ./（保持默认）
   - **Build Command**: `npm run build`（已在vercel.json配置）
   - **Output Directory**: `dist`（已在vercel.json配置）
   - **Install Command**: `npm ci`（已在vercel.json配置）

4. **配置环境变量**（重要！）
   在 "Environment Variables" 部分添加以下变量：

   ```
   VITE_SB_URL=你的Supabase项目URL
   VITE_SB_ANON_KEY=你的Supabase匿名密钥

   SB_URL=你的Supabase项目URL
   SB_ANON_KEY=你的Supabase匿名密钥
   SB_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
   JWT_SECRET=你的JWT密钥（至少32字符的随机字符串）

   # 可选的外部服务
   BAILIAN_API_KEY=你的百炼API密钥（如果使用）
   BAILIAN_ENDPOINT=百炼API端点（如果使用）
   ALIBABA_VOICE_API_KEY=阿里语音API密钥（如果使用）
   ALIBABA_VOICE_API_URL=阿里语音API地址（如果使用）
   ```

   **注意**: 不要设置 `CLIENT_ORIGINS` 和 `VITE_API_URL`，因为：
   - 前端会自动使用 `window.location.origin/api`（见 src/lib/api.ts:14-19）
   - 后端会在部署后自动获取正确的域名

5. **开始部署**
   - 点击 "Deploy"
   - 等待构建完成（通常需要2-5分钟）

6. **部署后配置**
   部署成功后：
   - 记录你的Vercel域名（如: `https://yixin-ai.vercel.app`）
   - 更新环境变量 `CLIENT_ORIGINS` 添加你的Vercel域名
   - 触发重新部署

### 方法2: 通过Vercel CLI部署

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **首次部署**
   ```bash
   vercel
   ```
   按照提示配置项目

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

5. **配置环境变量**
   ```bash
   vercel env add VITE_SB_URL
   vercel env add VITE_SB_ANON_KEY
   vercel env add SB_URL
   vercel env add SB_ANON_KEY
   vercel env add SB_SERVICE_ROLE_KEY
   vercel env add JWT_SECRET
   ```

## 项目配置说明

### vercel.json配置
项目已包含 `vercel.json` 配置文件，包含：

- **API路由**: `/api/*` 请求会被路由到 `api/index.ts`
- **SPA路由**: 其他所有请求重定向到 `index.html`（支持React Router）
- **Node.js运行时**: 使用 `@vercel/node@3.2.17`
- **最大执行时间**: 30秒

### 环境变量说明

#### 前端环境变量（VITE_前缀）
- `VITE_SB_URL`: Supabase项目URL
- `VITE_SB_ANON_KEY`: Supabase匿名密钥
- `VITE_API_URL`: （可选）API基础URL，不设置会自动使用当前域名/api

#### 后端环境变量
- `SB_URL`: Supabase项目URL（后端用）
- `SB_ANON_KEY`: Supabase匿名密钥（后端用）
- `SB_SERVICE_ROLE_KEY`: Supabase服务角色密钥（管理员权限）
- `JWT_SECRET`: JWT token签名密钥
- `CLIENT_ORIGINS`: 允许的前端域名（多个用逗号分隔）

#### 可选服务
- `BAILIAN_API_KEY`: 阿里百炼AI服务密钥
- `BAILIAN_ENDPOINT`: 百炼API端点
- `ALIBABA_VOICE_API_KEY`: 阿里语音服务密钥
- `ALIBABA_VOICE_API_URL`: 阿里语音API地址

## 验证部署

部署成功后，访问你的Vercel域名并测试：

1. **前端访问**: 打开域名应该看到主页
2. **API健康检查**: 访问 `https://你的域名.vercel.app/api/health`
3. **注册/登录功能**: 测试用户注册和登录
4. **会话创建**: 测试创建新的咨询会话

## 常见问题

### Q: 部署失败显示构建错误
**A**: 检查以下几点：
- 确保 `npm run build` 在本地能成功运行
- 检查是否有TypeScript类型错误
- 查看Vercel部署日志获取详细错误信息

### Q: API请求失败（404）
**A**: 检查：
- `vercel.json` 中的API路由配置是否正确
- 环境变量是否正确设置
- 查看Vercel函数日志（Functions标签）

### Q: CORS错误
**A**: 更新环境变量：
```bash
CLIENT_ORIGINS=https://你的vercel域名.vercel.app
```
然后重新部署

### Q: 前端刷新页面出现404
**A**: 这个问题已通过以下方式解决：
- `vercel.json` 中配置了SPA路由重定向（line 14-16）
- `dist/_redirects` 文件配置了回退规则
- `dist/404.html` 会自动重定向到主页

## 持续部署

Vercel会自动监听GitHub仓库：
- **主分支推送**: 自动部署到生产环境
- **其他分支推送**: 自动创建预览部署
- **Pull Request**: 自动创建预览链接

## 监控和日志

1. **访问统计**: Vercel Dashboard → Analytics
2. **函数日志**: Vercel Dashboard → Functions → 选择函数查看日志
3. **部署历史**: Vercel Dashboard → Deployments

## 性能优化建议

1. **代码分割**: 考虑使用动态import()减小初始包大小（目前index.js有602KB）
2. **图片优化**: 使用Vercel Image Optimization
3. **缓存策略**: 配置vercel.json的headers实现更好的缓存

## 需要帮助？

- Vercel文档: https://vercel.com/docs
- Vercel支持: https://vercel.com/support
- 项目Issues: 在GitHub仓库提交issue

---

**最后更新**: 2025-10-12
