# 意心AI心理咨询平台 - Windows服务器部署完全指南

> 🎯 **给代码小白的完整教程**
> 本指南假设你完全不懂服务器，会一步步教你如何部署

---

## 📚 目录

1. [什么是服务器？](#什么是服务器)
2. [准备工作](#准备工作)
3. [第一步：连接到服务器](#第一步连接到服务器)
4. [第二步：下载项目代码](#第二步下载项目代码)
5. [第三步：配置环境变量](#第三步配置环境变量)
6. [第四步：运行部署脚本](#第四步运行部署脚本)
7. [第五步：开放端口](#第五步开放端口)
8. [第六步：测试后端](#第六步测试后端)
9. [第七步：配置前端](#第七步配置前端)
10. [常见问题](#常见问题)

---

## 什么是服务器？

**服务器就是一台放在机房里的电脑**，它24小时不关机，专门用来运行网站或应用。

- 你的项目分为两部分：
  - **前端**：用户看到的网页界面（已经部署在EdgeOne）
  - **后端**：处理数据和AI对话的程序（需要部署到这台服务器）

- 你买的阿里云服务器：
  - IP地址：`8.148.73.181`（就像服务器的门牌号）
  - 操作系统：Windows 11（和你自己电脑一样）
  - 位置：F盘会放你的项目代码

---

## 准备工作

### 需要准备的信息（非常重要！）

在开始之前，请准备好以下信息（建议写在记事本里）：

#### 1. Supabase数据库信息

登录你的 [Supabase控制台](https://supabase.com/dashboard)：

1. 点击你的项目
2. 点击左侧"Settings"（设置）
3. 点击"API"
4. 复制以下三个值：

```
✅ Project URL（项目URL）: https://xxxxx.supabase.co
✅ anon public（匿名密钥）: eyJxxx... (很长的一串)
✅ service_role（服务密钥）: eyJxxx... (很长的另一串)
```

⚠️ **service_role是机密！不要分享给任何人！**

#### 2. 阿里云百炼API密钥（如果你配置了AI功能）

登录 [阿里云控制台](https://dashscope.console.aliyun.com/)：

1. 点击"API-KEY管理"
2. 复制你的API Key：`sk-xxxxx`

#### 3. 服务器登录信息

- IP地址：`8.148.73.181`
- 管理员密码：在阿里云控制台查看（如果忘记了可以重置）

---

## 第一步：连接到服务器

### 1.1 打开远程桌面连接

**Windows电脑：**

1. 按键盘上的 `Win + R` 键（Win键就是有Windows图标的那个）
2. 在弹出的框里输入：`mstsc`
3. 按回车键

**Mac电脑：**

1. 在App Store搜索并下载"Microsoft Remote Desktop"
2. 打开应用

### 1.2 输入连接信息

在远程桌面连接窗口：

1. **计算机**栏输入：`8.148.73.181`
2. 点击"连接"按钮
3. 输入用户名：`Administrator`
4. 输入密码：（你在阿里云设置的管理员密码）
5. 如果提示证书警告，点击"是"继续

### 1.3 成功连接

连接成功后，你会看到一个Windows桌面，这就是你的服务器！

⚠️ **注意区分**：
- 这个窗口里的Windows是服务器
- 外面的Windows是你自己的电脑

---

## 第二步：下载项目代码

### 2.1 打开PowerShell（管理员模式）

在**服务器的Windows桌面**上：

1. 右键点击屏幕左下角的"开始"按钮
2. 在弹出菜单中选择"终端(管理员)"或"Windows PowerShell(管理员)"
3. 如果弹出"是否允许此应用更改设备"，点击"是"

你会看到一个蓝色或黑色的窗口，这就是PowerShell！

### 2.2 创建项目文件夹

在PowerShell窗口中，**逐行**复制粘贴以下命令（每行后按回车）：

```powershell
# 创建www文件夹
New-Item -ItemType Directory -Path "F:\www" -Force
```

👉 **如何复制粘贴到PowerShell：**
- 复制：选中上面的命令，按 `Ctrl + C`
- 粘贴：在PowerShell窗口里**右键点击**，命令会自动粘贴
- 执行：按回车键

### 2.3 进入项目文件夹

```powershell
# 进入www文件夹
cd F:\www
```

### 2.4 下载代码

```powershell
# 从GitHub下载项目代码
git clone https://github.com/ChineseManHuang/YIXIN.git yixin
```

⏱️ 这一步可能需要1-2分钟，等待出现"done"字样

### 2.5 进入项目目录

```powershell
# 进入项目文件夹
cd yixin
```

现在你的项目代码在：`F:\www\yixin`

---

## 第三步：配置环境变量

### 3.1 运行配置向导

在PowerShell中输入：

```powershell
# 运行配置脚本
.\setup-env.ps1
```

### 3.2 回答问题

脚本会问你一些问题，请根据提示输入：

#### 问题1：后端服务端口
```
>> 后端服务端口 [默认: 3000]:
```
👉 **直接按回车**（使用默认值3000）

#### 问题2：Supabase项目URL
```
>> Supabase 项目 URL:
```
👉 粘贴你准备的Supabase URL，例如：`https://xxxxx.supabase.co`

#### 问题3：Supabase匿名密钥
```
>> Supabase 匿名密钥 (ANON_KEY):
```
👉 粘贴你的anon密钥（以`eyJ`开头的长字符串）

#### 问题4：Supabase服务密钥
```
>> Supabase 服务密钥 (SERVICE_ROLE_KEY):
```
👉 粘贴你的service_role密钥（另一个以`eyJ`开头的长字符串）

#### 问题5：JWT密钥
```
>> JWT 密钥 [默认: 自动生成]:
```
👉 **直接按回车**（脚本会自动生成安全的密钥）

#### 问题6：前端域名
```
>> 允许的前端域名 [默认: https://yinxintest99.edgeone.app,https://yixinaipsy.com,https://www.yixinaipsy.com]:
```
👉 **建议保留默认值**（同时允许测试域和正式域名，如需额外域名可自行追加）

#### 问题7：百炼API密钥
```
>> 阿里云百炼 API 密钥 (可选,按 Enter 跳过):
```
👉 如果你有，粘贴进去（`sk-`开头）；如果没有，直接按回车

#### 问题8：百炼API端点
```
>> 阿里云百炼 API 端点 [默认: https://dashscope.aliyuncs.com]:
```
👉 **直接按回车**

### 3.3 完成配置

看到"✅ 配置完成!"表示成功！

---

## 第四步：运行部署脚本

### 4.1 启动部署

在PowerShell中输入：

```powershell
# 运行自动部署脚本
.\deploy-windows.ps1
```

### 4.2 等待自动安装

脚本会自动完成以下步骤（需要5-10分钟）：

- ✅ 检查Node.js和Git
- ✅ 安装项目依赖（会下载很多文件，耐心等待）
- ✅ 安装PM2进程管理器
- ✅ 配置防火墙
- ✅ 启动后端服务

### 4.3 查看结果

部署成功后，你会看到：

```
================================================
  🎉 部署完成!
================================================

服务信息:
  - 项目目录: F:\www\yixin
  - 服务名称: YixinBackend
  - 监听端口: 3000
  - API地址: http://8.148.73.181:3000/api
  - 健康检查: http://8.148.73.181:3000/api/health
```

### 4.4 如果遇到错误

**情况1：提示"无法识别setup-env.ps1"**

原因：PowerShell执行策略限制

解决方法：
```powershell
# 临时允许运行脚本
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
然后重新运行 `.\setup-env.ps1`

**情况2：npm install 失败**

原因：网络问题或依赖冲突

解决方法：
```powershell
# 切换npm镜像源到国内
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

---

## 第五步：开放端口

⚠️ **非常重要的一步！** 必须开放端口，否则外网无法访问

### 5.1 登录阿里云控制台

1. 打开浏览器，访问：https://ecs.console.aliyun.com/
2. 登录你的阿里云账号
3. 点击左侧菜单"实例与镜像" → "实例"

### 5.2 找到你的服务器

在实例列表中找到：
- 实例ID：`c74a184d4d7e410681062a2517ed98de`
- 公网IP：`8.148.73.181`

### 5.3 配置防火墙

1. 点击该实例的"管理"
2. 在左侧菜单找到"安全组"
3. 点击"配置规则"
4. 点击"手动添加"按钮
5. 填写以下信息：

```
端口范围：3000/3000
授权对象：0.0.0.0/0
描述：意心后端API
```

6. 点击"保存"

**等待1-2分钟让规则生效**

---

## 第六步：测试后端

### 6.1 在服务器上测试

在服务器的PowerShell中输入：

```powershell
# 测试本地访问
curl http://localhost:3000/api/health
```

✅ 如果看到 `{"success":true,"message":"ok"}`，说明后端正常运行！

### 6.2 在你的电脑上测试

在**你自己电脑**的浏览器中访问：

```
http://8.148.73.181:3000/api/health
```

✅ 如果也看到 `{"success":true,"message":"ok"}`，说明外网访问成功！

❌ 如果无法访问：
1. 等待2分钟（防火墙规则可能未生效）
2. 检查阿里云安全组规则是否正确添加
3. 在服务器PowerShell中运行：`pm2 logs YixinBackend` 查看日志

---

## 第七步：配置前端

现在后端已经在服务器上运行了，需要让前端连接到新的后端地址。

### 7.1 创建前端环境变量配置

**操作地点：你自己的电脑**

在项目根目录创建或修改 `.env.production` 文件：

**文件内容：**
```env
# 生产环境配置 - 指向阿里云后端
VITE_API_URL=http://8.148.73.181:3000/api
VITE_SOCKET_URL=http://8.148.73.181:3000

# Supabase配置（与服务器一致）
VITE_SB_URL=你的Supabase项目URL
VITE_SB_ANON_KEY=你的Supabase匿名密钥
```

### 7.2 提交代码到GitHub

在你电脑的命令行（PowerShell或CMD）中：

```bash
# 进入项目目录
cd F:\YIXIN_PROJECT

# 添加文件
git add .env.production

# 提交
git commit -m "feat: Configure production backend URL for Alibaba Cloud"

# 推送到GitHub
git push origin main
```

### 7.3 等待EdgeOne自动部署

1. 推送代码后，EdgeOne会自动检测到更新
2. 等待3-5分钟让EdgeOne重新构建前端
3. 访问你的网站（正式域名）：https://yixinaipsy.com
   - 若需验证测试环境，仍可访问：https://yinxintest99.edgeone.app

### 7.4 测试完整功能

1. 打开网站
2. 尝试注册/登录
3. 创建新的咨询会话
4. 发送消息测试AI回复

✅ 如果一切正常，恭喜你部署成功！

---

## 常见问题

### Q1: 服务器重启后，后端服务会自动启动吗？

✅ 是的！部署脚本已经配置了开机自启动。

验证方法：
```powershell
pm2 startup
pm2 save
```

### Q2: 如何查看后端运行日志？

```powershell
# 实时查看日志
pm2 logs YixinBackend

# 查看最近50行日志
pm2 logs YixinBackend --lines 50

# 只看错误日志
pm2 logs YixinBackend --err
```

### Q3: 如何更新代码？

当你修改了代码并推送到GitHub后：

**在服务器PowerShell中执行：**
```powershell
cd F:\www\yixin
git pull origin main
npm install
pm2 restart YixinBackend
```

### Q4: 如何停止后端服务？

```powershell
# 停止服务
pm2 stop YixinBackend

# 重新启动
pm2 start YixinBackend

# 重启服务
pm2 restart YixinBackend
```

### Q5: 忘记了.env里的配置怎么办？

```powershell
# 查看配置文件
Get-Content F:\www\yixin\.env

# 或用记事本打开编辑
notepad F:\www\yixin\.env
```

修改后记得重启服务：
```powershell
pm2 restart YixinBackend
```

### Q6: 端口3000被占用怎么办？

查看是什么程序占用了端口：
```powershell
netstat -ano | findstr :3000
```

如果想换个端口（例如8080）：
1. 修改 `.env` 文件中的 `PORT=8080`
2. 在阿里云安全组中开放8080端口
3. 重启服务：`pm2 restart YixinBackend`

### Q7: 提示"pm2 command not found"

```powershell
# 全局安装pm2
npm install -g pm2
npm install -g pm2-windows-startup

# 配置开机启动
pm2-startup install
```

### Q8: 前端连接后端失败

**检查清单：**

1. ✅ 后端是否正在运行？
   ```powershell
   pm2 status
   ```

2. ✅ 防火墙端口是否开放？
   - Windows防火墙：`Get-NetFirewallRule -DisplayName "YixinBackend*"`
   - 阿里云安全组：在控制台检查

3. ✅ CORS配置是否正确？
   - 查看服务器 `.env` 中的 `CLIENT_ORIGINS`
   - 应该包含：`https://yixinaipsy.com`、`https://www.yixinaipsy.com`，如需保留测试环境，还要有 `https://yinxintest99.edgeone.app`

4. ✅ 前端配置是否正确？
   - 检查 `.env.production` 中的 `VITE_API_URL`
   - 正式环境推荐设置为：`https://api.yixinaipsy.com/api`

### Q9: 数据库连接失败

错误信息通常是：`Error: Failed to fetch` 或 `Invalid JWT`

**解决方法：**

1. 检查Supabase配置：
   ```powershell
   # 查看.env文件
   Get-Content F:\www\yixin\.env | Select-String "SB_"
   ```

2. 确认三个值都填写正确：
   - `SB_URL`
   - `SB_ANON_KEY`
   - `SB_SERVICE_ROLE_KEY`

3. 重启服务：
   ```powershell
   pm2 restart YixinBackend
   ```

---

## 🎉 恭喜你完成部署！

现在你的架构是：

```
用户浏览器
    ↓
EdgeOne CDN (前端)
https://yixinaipsy.com
    ↓
阿里云服务器 (后端)
https://api.yixinaipsy.com
    ↓
Supabase (数据库)
    ↓
阿里云百炼 (AI)
```

## 📞 需要帮助？

如果遇到任何问题：

1. **查看日志**：`pm2 logs YixinBackend`
2. **检查服务状态**：`pm2 status`
3. **重启服务**：`pm2 restart YixinBackend`

如果还是解决不了，把错误信息截图告诉我！

---

**🎊 祝你的意心AI心理咨询平台运行顺利！**
