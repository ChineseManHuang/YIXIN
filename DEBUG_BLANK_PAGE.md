# 网页空白问题调试指南

你的网站部署成功但显示空白页面。请按照以下步骤检查问题：

## 🔍 步骤1: 检查浏览器控制台

1. **打开浏览器开发者工具**:
   - Chrome/Edge: 按 `F12` 或 `Ctrl+Shift+I`
   - 点击 "Console"（控制台）标签

2. **查找错误信息**，常见的错误包括：
   - ❌ `Failed to load resource` - 资源加载失败
   - ❌ `CORS error` - 跨域错误
   - ❌ `Module not found` - 模块未找到
   - ❌ `Uncaught ReferenceError` - 引用错误

3. **截图或复制所有红色错误信息**

## 🔍 步骤2: 检查Network标签

1. 在开发者工具中点击 **"Network"（网络）** 标签
2. 刷新页面 (`F5`)
3. 查看是否有红色（失败）的请求
4. 特别关注：
   - `index.html` - 是否成功加载 (200 OK)
   - `index-*.js` - JavaScript文件是否成功加载
   - `index-*.css` - CSS文件是否成功加载

## 🔍 步骤3: 检查HTML源代码

1. 在页面上 **右键 → "查看网页源代码"**
2. 检查 `<script>` 标签的路径是否正确
3. 应该看到类似：
   ```html
   <script type="module" crossorigin src="/assets/index-ChBebeti.js"></script>
   ```

## 🔧 常见问题和解决方案

### 问题1: JavaScript文件404错误

**症状**: Console显示 `Failed to load resource: the server responded with a status of 404`

**原因**:
- 构建输出配置错误
- Vercel路由配置问题

**解决方案**: 检查 `vercel.json` 的 `outputDirectory` 配置

### 问题2: CORS错误

**症状**: Console显示 `CORS policy: No 'Access-Control-Allow-Origin' header`

**原因**: API请求被CORS策略阻止

**解决方案**:
1. 检查环境变量 `CLIENT_ORIGINS` 是否设置
2. 应该设置为: `https://yixin-opal.vercel.app`

### 问题3: 环境变量未设置

**症状**:
- 页面空白但无明显错误
- Console显示API请求失败

**检查**:
1. 登录Vercel Dashboard
2. 进入项目 Settings → Environment Variables
3. 确认以下变量已设置：
   - `VITE_SB_URL`
   - `VITE_SB_ANON_KEY`
   - `SB_URL`
   - `SB_ANON_KEY`
   - `SB_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `CLIENT_ORIGINS=https://yixin-opal.vercel.app`

**如果缺少环境变量**: 添加后需要重新部署！

### 问题4: 路由配置错误

**症状**: 访问根路径(/)正常，但刷新子路由出现404或空白

**检查**: `vercel.json` 应该包含：
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 问题5: 构建输出不完整

**症状**: Network标签显示某些文件404

**解决方案**:
1. 本地运行 `npm run build`
2. 检查 `dist/` 目录是否包含所有文件
3. 检查 `dist/assets/` 目录是否有 `.js` 和 `.css` 文件

## 📝 需要提供的信息

请将以下信息发给我，以便进一步诊断：

1. **浏览器Console的完整错误信息**（截图或文字）
2. **Network标签中失败的请求**（截图）
3. **环境变量是否已设置**（不要发送实际值，只需确认是否存在）
4. **页面HTML源代码**（前50行）

## 🚀 快速测试命令

如果可以，请在浏览器Console中运行：

```javascript
// 检查root元素是否存在
console.log('Root element:', document.getElementById('root'));

// 检查是否有React渲染错误
console.log('Body content:', document.body.innerHTML.substring(0, 500));

// 检查JavaScript是否加载
console.log('Scripts:', Array.from(document.scripts).map(s => s.src));
```

将输出结果发给我。

## 📞 下一步

根据你提供的错误信息，我可以：
- 修复配置问题
- 调整构建设置
- 更新环境变量
- 修复路由问题

请将上述调试信息发给我！
