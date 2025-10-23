# Vercel环境变量检查清单

## 🚨 API崩溃的根本原因

你的API返回500错误是因为**环境变量缺失或配置错误**。

根据代码 `server/config/env.ts:46-48, 118-120`，以下环境变量在生产环境是**强制要求**的：

## ✅ 必需的环境变量清单

访问: https://vercel.com/glitters-projects-af2b4632/yixin/settings/environment-variables

**确认以下变量都已设置且非空**：

### 1. Supabase配置 (必需)
```
SB_URL=https://你的项目id.supabase.co
SB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SB_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. JWT密钥 (必需)
```
JWT_SECRET=至少32字符的随机字符串
```

示例生成命令:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. CORS配置 (必需 - 最容易遗漏!)
```
CLIENT_ORIGINS=https://yixin-opal.vercel.app
```

**⚠️ 注意**:
- 必须是完整URL，包含 `https://`
- 不要有尾部斜杠
- 如果有多个域名，用逗号分隔（无空格）

### 4. 前端环境变量 (推荐)
```
VITE_SB_URL=https://你的项目id.supabase.co
VITE_SB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔍 如何验证环境变量

### 方法1: 在Vercel控制台检查

1. 访问: https://vercel.com/glitters-projects-af2b4632/yixin/settings/environment-variables
2. 确认每个变量：
   - ✅ 有值（不是空的）
   - ✅ 应用到 Production 环境
   - ✅ 没有拼写错误

### 方法2: 检查部署日志

1. 访问: https://vercel.com/glitters-projects-af2b4632/yixin/deployments
2. 点击最新的部署
3. 查看 "Building" 日志
4. 搜索错误信息：
   - `Environment variable SB_URL is required`
   - `CLIENT_ORIGINS must be configured`
   - `Missing required production environment variables`

## 🔧 常见错误和解决方案

### 错误1: "Environment variable SB_URL is required"

**问题**: Supabase URL未设置

**解决**:
1. 访问 https://supabase.com/dashboard/project/_/settings/api
2. 复制 "Project URL"
3. 在Vercel中设置 `SB_URL`

### 错误2: "CLIENT_ORIGINS must be configured in production environment"

**问题**: 未设置允许的前端域名

**解决**:
```
CLIENT_ORIGINS=https://yixin-opal.vercel.app
```

### 错误3: "FUNCTION_INVOCATION_FAILED"

**问题**: 函数初始化时崩溃（通常是环境变量问题）

**解决**:
1. 检查所有必需变量都已设置
2. 确认值没有拼写错误
3. 确认应用到 Production 环境
4. 重新部署

## 📋 完整配置示例

```env
# Supabase (必需)
SB_URL=https://abcdefghijk.supabase.co
SB_ANON_KEY=eyJhbGc...很长的字符串
SB_SERVICE_ROLE_KEY=eyJhbGc...很长的字符串

# JWT (必需)
JWT_SECRET=a8f3e2b9c4d7f1e6a5b8c3d2f9e1a7b4c6d5e8f2a9b3c7d1e4f8a2b6c9d3e7f1

# CORS (必需)
CLIENT_ORIGINS=https://yixin-opal.vercel.app

# 前端 (推荐)
VITE_SB_URL=https://abcdefghijk.supabase.co
VITE_SB_ANON_KEY=eyJhbGc...很长的字符串
```

## ⚡ 设置完成后的步骤

1. **保存所有环境变量**
2. **触发重新部署**:
   - 方法A: 在 Deployments 页面点击最新部署的 "..." → "Redeploy"
   - 方法B: 推送新commit到GitHub

3. **等待部署完成** (约1-2分钟)

4. **测试API**:
   - 访问: https://yixin-opal.vercel.app/api/health
   - 应该返回: `{"success":true,"message":"ok"}`

5. **测试前端**:
   - 访问: https://yixin-opal.vercel.app/
   - 页面应该正常显示

## 🆘 如果仍然失败

请提供以下信息：

1. **环境变量截图**（隐藏实际值，只显示变量名和是否已设置）
2. **Vercel部署日志**中的错误信息
3. **浏览器Console**中的错误

---

**重要提示**: 设置或更改环境变量后，**必须重新部署**才能生效！
