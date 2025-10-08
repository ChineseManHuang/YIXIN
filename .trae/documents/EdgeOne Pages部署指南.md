# EdgeOne Pages 部署指南

## 项目概述

本项目是一个AI咨询师应用，采用React + TypeScript + Vite前端架构，集成Supabase作为后端服务。EdgeOne Pages是腾讯云推出的全栈开发与部署平台，支持静态网站托管和边缘Serverless功能。

## 重要说明

⚠️ **EdgeOne Pages是静态网站托管平台**，不支持传统的Node.js后端服务器。本项目的后端功能需要通过以下方式实现：

1. **Supabase服务**：数据库、认证、实时功能
2. **边缘函数**：处理复杂业务逻辑（如AI对话、语音处理）
3. **第三方API**：直接从前端调用（需要CORS支持）

## 部署前准备

### 1. 项目构建验证

项目已通过构建测试：
- ✅ 构建命令：`npm run build`
- ✅ 输出目录：`dist/`
- ✅ 构建产物：HTML、CSS、JS文件

### 2. 环境变量配置

已创建 `.env.production` 文件，包含EdgeOne Pages所需的环境变量：

```env
# Supabase Configuration (必需)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key

# Frontend Runtime Config
VITE_API_URL=https://your-project.supabase.co/rest/v1
VITE_SOCKET_URL=wss://your-project.supabase.co/realtime/v1
```

## EdgeOne Pages 部署步骤

### 第一步：准备Git仓库

1. **初始化Git仓库**（如果尚未初始化）：
   ```bash
   git init
   git add .
   git commit -m "Initial commit for EdgeOne Pages deployment"
   ```

2. **推送到远程仓库**：
   - GitHub：推荐，EdgeOne Pages原生支持
   - GitLab：也支持
   - 其他Git托管服务

### 第二步：访问EdgeOne Pages控制台

1. 访问 [EdgeOne Pages控制台](https://pages.edgeone.ai/)
2. 使用腾讯云账号登录
3. 点击"创建项目"

### 第三步：连接Git仓库

1. **选择Git提供商**：GitHub/GitLab
2. **授权访问**：允许EdgeOne Pages访问你的仓库
3. **选择仓库**：选择包含本项目的仓库
4. **选择分支**：通常选择 `main` 或 `master` 分支

### 第四步：配置构建设置

在EdgeOne Pages控制台中配置以下构建参数：

```yaml
# 构建配置
构建命令: npm run build
输出目录: dist
Node.js版本: 18.x 或更高
包管理器: npm
```

### 第五步：配置环境变量

在EdgeOne Pages控制台的"环境变量"部分添加：

1. **SUPABASE_URL**：你的Supabase项目URL
2. **SUPABASE_ANON_KEY**：Supabase匿名密钥
3. **VITE_API_URL**：设置为Supabase REST API地址
4. **VITE_SOCKET_URL**：设置为Supabase Realtime WebSocket地址

### 第六步：部署项目

1. 点击"部署"按钮
2. EdgeOne Pages将自动：
   - 克隆你的仓库
   - 安装依赖（`npm install`）
   - 执行构建（`npm run build`）
   - 部署到全球边缘节点

### 第七步：配置自定义域名（可选）

1. 在EdgeOne Pages控制台中添加自定义域名
2. 配置DNS记录指向EdgeOne Pages提供的CNAME
3. 启用HTTPS（自动配置SSL证书）

## 功能适配说明

### 已适配功能
- ✅ 用户注册/登录（通过Supabase Auth）
- ✅ 聊天界面和消息存储（通过Supabase Database）
- ✅ 实时消息（通过Supabase Realtime）
- ✅ 文件上传（通过Supabase Storage）

### 需要边缘函数的功能
以下功能需要在EdgeOne Pages中创建边缘函数：

1. **AI对话处理**：
   - 调用百炼API
   - 处理AI响应
   - 消息格式转换

2. **语音处理**：
   - 语音转文字
   - 文字转语音
   - 音频文件处理

### 边缘函数示例

在EdgeOne Pages中创建边缘函数处理AI对话：

```javascript
// /api/chat.js
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { message, userId } = await request.json();
  
  // 调用百炼API
  const response = await fetch(process.env.BAILIAN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BAILIAN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [{ role: 'user', content: message }]
    })
  });

  const aiResponse = await response.json();
  
  return new Response(JSON.stringify({
    reply: aiResponse.choices[0].message.content
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 监控和维护

### 部署监控
- EdgeOne Pages提供实时部署日志
- 可以查看构建状态和错误信息
- 支持回滚到之前的版本

### 性能优化
EdgeOne Pages自动提供：
- 全球CDN加速
- 自动压缩和优化
- 边缘缓存
- HTTP/2和HTTP/3支持

### 自动部署
- 每次推送到指定分支时自动触发部署
- 支持预览部署（Pull Request）
- 可以配置部署钩子

## 故障排除

### 常见问题

1. **构建失败**：
   - 检查Node.js版本兼容性
   - 确认所有依赖都在package.json中
   - 查看构建日志中的错误信息

2. **环境变量问题**：
   - 确保所有VITE_前缀的变量都已配置
   - 检查Supabase配置是否正确
   - 验证API密钥的有效性

3. **CORS错误**：
   - 确保Supabase项目允许你的域名
   - 检查API调用的URL是否正确
   - 验证认证头是否正确设置

4. **实时功能不工作**：
   - 检查WebSocket连接配置
   - 确认Supabase Realtime已启用
   - 验证数据库表的RLS策略

## 成本说明

EdgeOne Pages提供免费额度：<mcreference link="https://www.zyglq.cn/posts/qcloud-eo-pages-guide.html" index="1">1</mcreference> <mcreference link="https://cloud.tencent.com/developer/article/2509013" index="2">2</mcreference>
- 免费静态网站托管
- 全球CDN加速
- 自动HTTPS证书
- 基础边缘函数调用

超出免费额度后按使用量计费，适合个人项目和中小型应用。

## 总结

EdgeOne Pages为本AI咨询师项目提供了理想的部署平台，结合Supabase后端服务，可以实现：
- 快速全球部署
- 自动扩缩容
- 高可用性
- 成本效益

通过边缘函数扩展，可以处理复杂的AI对话和语音处理需求，为用户提供流畅的体验。