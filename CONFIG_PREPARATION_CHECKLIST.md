# 配置信息准备清单

> 📋 **使用说明**：把获取到的信息填写在这个文件中，部署时直接复制粘贴即可

---

## ✅ 必需配置项

### 1️⃣ Supabase 数据库配置

**获取步骤：**
1. 打开浏览器，访问：https://supabase.com/dashboard
2. 登录你的 Supabase 账号
3. 点击你的项目（应该已经创建好了）
4. 点击左侧菜单 **Settings** (设置图标)
5. 点击 **API** 标签
6. 找到并复制以下三项：

```
✅ Project URL（项目 URL）
https://ykltoevfciknumxaypxf.supabase.co

✅ Project API keys - anon public（匿名公钥）
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mzc3ODYsImV4cCI6MjA3NTExMzc4Nn0._9TuINGYRqe-p0Lh5aBgXXnBYaykVq5bQ-IEn1-07SE
（这是一串很长的字符串，通常以 eyJ 开头）

✅ Project API keys - service_role（服务角色密钥）⚠️ 保密！
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUzNzc4NiwiZXhwIjoyMDc1MTEzNzg2fQ.AZHi1GftjfipZRZRU7zLA0yFSaxw0rUrOI2c9Oph1Cs
（这也是一串很长的字符串，比 anon 更长，千万不要泄露！）
```

**重要提示：**
- ⚠️ **service_role 密钥是机密信息**，不要分享给任何人
- ⚠️ 不要把这个密钥提交到 GitHub 等公开仓库
- ✅ anon 密钥可以在前端使用（相对安全）
- ✅ service_role 只能在后端使用（有完全访问权限）

---

### 2️⃣ 阿里云服务器信息

**已知信息：**
```
✅ 服务器 IP 地址
8.148.73.181

✅ 管理员用户名
Administrator

✅ 管理员密码（如果忘记，需要在阿里云控制台重置）
Qq2826807
```

**重置密码步骤（如果需要）：**
1. 访问：https://ecs.console.aliyun.com
2. 找到实例 ID: `c74a184d4d7e410681062a2517ed98de`
3. 点击 **更多** → **密码/密钥** → **重置实例密码**
4. 设置新密码（建议：字母+数字+特殊字符，至少8位）
5. 重启实例使密码生效

---

## 🎯 可选配置项（推荐配置）

### 3️⃣ 阿里云百炼 API 配置

**用途：** AI 文字和语音咨询功能（核心功能，强烈建议配置）

**获取步骤：**
1. 访问：https://dashscope.console.aliyun.com
2. 登录你的阿里云账号
3. 点击 **API-KEY 管理**
4. 如果没有 API Key，点击 **创建新的 API-KEY**
5. 复制 API Key

```
✅ API Key（API 密钥）
sk-973083c9be1d48e5a55010fa7d30fb9a

✅ API Endpoint（API 端点）
https://dashscope.aliyuncs.com
（这个是固定的，不需要改）
```

**如果暂时没有百炼 API：**
- ⚠️ AI 功能将使用模拟响应（仅用于测试）
- ⚠️ 不会有真实的 AI 对话能力
- ✅ 其他功能（登录、会话管理等）仍然正常

---

## 🔐 JWT 密钥（自动生成）

**说明：** 用于用户登录的 JWT Token 签名

```
✅ JWT Secret（自动生成，无需手动填写）
在运行 setup-env.ps1 时会自动生成一个安全的随机密钥
```

---

## 📊 配置信息汇总模板

**准备好后，把信息填写在下面：**

```env
# === 必需配置 ===

# Supabase 数据库
SUPABASE_URL=https://ykltoevfciknumxaypxf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mzc3ODYsImV4cCI6MjA3NTExMzc4Nn0._9TuINGYRqe-p0Lh5aBgXXnBYaykVq5bQ-IEn1-07SE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUzNzc4NiwiZXhwIjoyMDc1MTEzNzg2fQ.AZHi1GftjfipZRZRU7zLA0yFSaxw0rUrOI2c9Oph1Cs

# JWT 密钥（setup-env.ps1 会自动生成）
JWT_SECRET=（自动生成）

# === 可选配置 ===

# 阿里云百炼 API（推荐配置）
BAILIAN_API_KEY=sk-973083c9be1d48e5a55010fa7d30fb9a
BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com
```

---

## ✅ 准备完成自检

在开始部署前，请确认：

- [ ] **Supabase Project URL** 已复制（以 https:// 开头，以 .supabase.co 结尾）
- [ ] **Supabase Anon Key** 已复制（很长的字符串，以 eyJ 开头）
- [ ] **Supabase Service Role Key** 已复制（更长的字符串，以 eyJ 开头）
- [ ] **阿里云服务器管理员密码** 已确认或重置
- [ ] **百炼 API Key** 已复制（可选，但强烈推荐）
- [ ] 所有信息已保存在安全的地方（如密码管理器或加密文档）

---

## 🚀 准备好后该做什么？

1. **保存这个文件**（填写好的配置信息）
2. **回到 Claude Code 对话**
3. **说："我准备好配置信息了，可以开始部署"**

我会立即开始指导你进行部署！

---

## ⚠️ 安全提示

**重要：**
- 🔒 不要把这个文件提交到 Git
- 🔒 不要把配置信息发送到任何公开的地方
- 🔒 `service_role` 密钥特别重要，泄露后任何人都可以完全访问你的数据库
- 🔒 如果怀疑密钥泄露，立即在 Supabase 控制台重置密钥

---

## 💬 如有疑问

**遇到问题？** 随时告诉我：

- "我找不到 Supabase 的 API 密钥"
- "我忘记了服务器密码，怎么重置？"
- "百炼 API 的控制台在哪里？"
- "我还没有创建 Supabase 项目，怎么办？"

我会给你详细的图文指导！
