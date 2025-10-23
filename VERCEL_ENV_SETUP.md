# Vercel环境变量配置指南

## 🚨 必需的环境变量

你的项目**必须**在Vercel中设置以下环境变量，否则部署会失败：

### 1. 在Vercel控制台添加环境变量

访问: https://vercel.com/glitters-projects-af2b4632/yixin/settings/environment-variables

### 2. 添加以下变量（全部必需）

#### Supabase配置
```
SB_URL=你的Supabase项目URL
示例: https://xxxxxxxxxxxxx.supabase.co
```

```
SB_ANON_KEY=你的Supabase匿名密钥
示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```
SB_SERVICE_ROLE_KEY=你的Supabase服务角色密钥
示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 前端Supabase配置
```
VITE_SB_URL=你的Supabase项目URL（与SB_URL相同）
```

```
VITE_SB_ANON_KEY=你的Supabase匿名密钥（与SB_ANON_KEY相同）
```

#### JWT密钥
```
JWT_SECRET=生成一个随机字符串（至少32字符）
示例: your-super-secret-jwt-key-min-32-chars-long-random-string
```

**如何生成JWT_SECRET**:
```bash
# 在终端运行（Linux/Mac/Git Bash）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用在线生成器
# https://www.random.org/strings/
```

#### CORS配置
```
CLIENT_ORIGINS=你的Vercel域名
示例: https://yixin.vercel.app
```

**注意**:
- 首次部署时，先设置为临时值: `https://placeholder.vercel.app`
- 部署成功后，用实际的Vercel域名更新此变量
- 如果有多个域名，用逗号分隔: `https://yixin.vercel.app,https://custom-domain.com`

### 3. 可选的环境变量

如果你使用了阿里百炼或语音服务，添加以下变量：

```
BAILIAN_API_KEY=你的百炼API密钥
BAILIAN_ENDPOINT=你的百炼API端点
ALIBABA_VOICE_API_KEY=你的阿里语音API密钥
ALIBABA_VOICE_API_URL=你的阿里语音API地址
```

## 📝 在Vercel控制台设置步骤

1. **登录Vercel**: https://vercel.com
2. **进入项目**: 选择 `yixin` 项目
3. **打开设置**: 点击 "Settings" 标签
4. **环境变量**: 点击左侧 "Environment Variables"
5. **添加变量**:
   - 输入变量名（如 `SB_URL`）
   - 输入变量值
   - 选择环境: `Production`, `Preview`, `Development` (全选)
   - 点击 "Save"
6. **重复**: 为所有必需变量重复步骤5
7. **重新部署**: 设置完成后，点击 "Deployments" → 找到最新部署 → 点击 "..." → "Redeploy"

## 🔍 如何获取Supabase密钥

1. **访问Supabase项目**: https://supabase.com/dashboard/project/_/settings/api
2. **获取以下信息**:
   - **Project URL** → 复制到 `SB_URL` 和 `VITE_SB_URL`
   - **anon public** → 复制到 `SB_ANON_KEY` 和 `VITE_SB_ANON_KEY`
   - **service_role** → 复制到 `SB_SERVICE_ROLE_KEY` ⚠️ **保密！不要暴露**

## ⚠️ 常见错误

### 错误1: "Environment variable SB_URL is required"
**原因**: 未设置必需的环境变量
**解决**: 按照上面的步骤添加所有必需变量

### 错误2: "CLIENT_ORIGINS must be configured in production"
**原因**: `CLIENT_ORIGINS` 未设置或为空
**解决**: 设置为你的Vercel域名（如: `https://yixin.vercel.app`）

### 错误3: "Missing required production environment variables"
**原因**: 某些必需变量为空或未设置
**解决**: 检查所有必需变量是否正确填写且非空

## ✅ 验证设置

设置完成后：

1. **触发重新部署**
2. **查看构建日志**: 确认没有环境变量错误
3. **测试API**: 访问 `https://你的域名.vercel.app/api/health` 应该返回:
   ```json
   {"success":true,"message":"ok"}
   ```

## 🔐 安全提示

- ⚠️ **永远不要**将 `SB_SERVICE_ROLE_KEY` 提交到Git
- ⚠️ **永远不要**将 `JWT_SECRET` 公开
- ✅ 只在Vercel控制台设置敏感环境变量
- ✅ 使用 `.env.example` 作为模板，不要包含真实值

---

**需要帮助?**
- Vercel环境变量文档: https://vercel.com/docs/projects/environment-variables
- Supabase文档: https://supabase.com/docs
