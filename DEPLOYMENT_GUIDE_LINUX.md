# 意心AI心理咨询平台 - Linux服务器部署指南

> 🎯 **阿里云轻量应用服务器（Linux）部署教程**

---

## 📋 目录

1. [服务器信息确认](#服务器信息确认)
2. [连接到服务器](#连接到服务器)
3. [上传部署脚本](#上传部署脚本)
4. [执行自动部署](#执行自动部署)
5. [开放端口](#开放端口)
6. [测试服务](#测试服务)
7. [配置前端](#配置前端)
8. [常见问题](#常见问题)

---

## 服务器信息确认

### 你的服务器信息

```
✅ 公网IP: 8.148.73.181
✅ 私网IP: 172.18.60.75
✅ 用户名: admin
✅ 端口: 22
✅ 连接方式: SSH
✅ 操作系统: Linux
```

---

## 连接到服务器

### 方式一：Workbench 一键连接（推荐）⭐

**这是最简单的方式，无需安装任何软件！**

#### 步骤：

1. **打开浏览器**，访问阿里云控制台：
   ```
   https://swas.console.aliyun.com/
   ```

2. **找到你的服务器**
   - 在服务器列表中找到实例 ID: `c74a184d4d7e410681062a2517ed98de`
   - 或者通过 IP: `8.148.73.181` 查找

3. **点击"远程连接"按钮**
   - 在服务器卡片上找到"远程连接"按钮
   - 点击后会弹出连接选项对话框

4. **选择 Workbench 一键连接**
   - 在弹出的对话框中，找到"Workbench 一键连接"区域
   - 点击"立即登录"按钮

5. **等待连接**
   - 系统会自动在浏览器中打开一个终端窗口
   - 显示黑色背景的命令行界面，表示已成功连接

**成功连接后，你会看到类似这样的提示：**
```
Welcome to Alibaba Cloud Linux!
[admin@xxxxxx ~]$
```

---

### 方式二：使用本地终端（适合熟悉命令行的用户）

**Windows 用户：**

1. 安装 [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
2. 打开 PuTTY
3. Host Name: `admin@8.148.73.181`
4. Port: `22`
5. 点击 Open
6. 输入密码或选择私钥文件

**Mac/Linux 用户：**

```bash
# 打开终端，执行：
ssh admin@8.148.73.181
```

---

## 上传部署脚本

### 方法一：通过 Git（推荐）

连接到服务器后，直接克隆项目：

```bash
# 创建项目目录
mkdir -p ~/yixin
cd ~/yixin

# 克隆项目
git clone https://github.com/ChineseManHuang/YIXIN.git .

# 查看文件
ls -la
```

你应该能看到 `deploy-linux.sh` 和 `setup-env-linux.sh` 两个文件。

---

### 方法二：手动创建（如果Git不可用）

如果服务器没有 Git，可以手动创建文件：

```bash
# 创建目录
mkdir -p ~/yixin
cd ~/yixin

# 创建 setup-env-linux.sh
cat > setup-env-linux.sh << 'EOF'
[复制 setup-env-linux.sh 的完整内容]
EOF

# 创建 deploy-linux.sh
cat > deploy-linux.sh << 'EOF'
[复制 deploy-linux.sh 的完整内容]
EOF

# 赋予执行权限
chmod +x setup-env-linux.sh deploy-linux.sh
```

---

## 执行自动部署

### 第一步：配置环境变量

```bash
cd ~/yixin
./setup-env-linux.sh
```

**输出示例：**
```
[INFO] ========================================
[INFO]    环境变量配置向导
[INFO] ========================================

[SUCCESS] ✅ .env 文件创建成功！

[INFO] 配置内容预览:
----------------------------------------
SUPABASE_URL=https://ykltoevfciknumxaypxf.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
...
----------------------------------------

[SUCCESS] 🎉 环境变量配置完成！
[INFO] 现在可以运行: ./deploy-linux.sh
```

---

### 第二步：运行部署脚本

```bash
./deploy-linux.sh
```

**这个脚本会自动完成以下步骤：**

1. ✅ 检测操作系统
2. ✅ 更新包管理器
3. ✅ 安装基础工具（curl, wget, git）
4. ✅ 安装 Node.js 20.x LTS
5. ✅ 配置 npm 淘宝镜像
6. ✅ 安装 PM2 进程管理器
7. ✅ 克隆项目代码
8. ✅ 安装项目依赖
9. ✅ 构建项目
10. ✅ 配置防火墙
11. ✅ 启动后端服务
12. ✅ 测试服务

**预计时间：10-15分钟**

---

### 部署过程示例输出：

```
==========================================
意心AI心理咨询平台 - Linux自动部署脚本
==========================================

[INFO] 检测到操作系统: ubuntu 22.04
[INFO] 更新包管理器...
[SUCCESS] 包管理器更新完成
[INFO] 安装基础工具 (curl, wget, git)...
[SUCCESS] 基础工具安装完成
[INFO] 安装 Node.js 20.x LTS...
[SUCCESS] Node.js 安装成功: v20.11.0
[SUCCESS] npm 版本: 10.2.4
[INFO] 配置npm淘宝镜像（加速下载）...
[SUCCESS] npm镜像配置完成
[INFO] 安装 PM2 进程管理器...
[SUCCESS] PM2 安装成功
[INFO] 克隆项目代码...
[SUCCESS] 项目代码获取完成
[INFO] 安装项目依赖（可能需要5-10分钟）...
[SUCCESS] 依赖安装完成
[INFO] 构建项目...
[SUCCESS] 项目构建完成
[INFO] 启动后端服务...
[SUCCESS] 后端服务启动成功

┌─────────────────┬────┬─────────┬──────┬───────┐
│ Name            │ id │ mode    │ pid  │ status│
├─────────────────┼────┼─────────┼──────┼───────┤
│ YixinBackend    │ 0  │ fork    │ 1234 │ online│
└─────────────────┴────┴─────────┴──────┴───────┘

[INFO] 测试健康检查接口...
[SUCCESS] ✅ 服务运行正常！

==========================================
🎉 部署完成！
==========================================

服务器信息:
  - 公网IP: 8.148.73.181
  - 后端端口: 3000
  - 项目目录: /home/admin/yixin

常用命令:
  查看状态:   pm2 status
  查看日志:   pm2 logs YixinBackend
  重启服务:   pm2 restart YixinBackend
  停止服务:   pm2 stop YixinBackend

下一步:
  1. 在阿里云控制台开放端口 3000
  2. 测试公网访问: http://8.148.73.181:3000/api/health
  3. 配置前端连接后端
```

---

## 开放端口

### 在阿里云控制台开放端口 3000

1. **登录阿里云控制台**
   ```
   https://swas.console.aliyun.com/
   ```

2. **找到你的服务器实例**
   - 实例 ID: `c74a184d4d7e410681062a2517ed98de`

3. **点击"防火墙"选项卡**

4. **点击"添加规则"按钮**

5. **填写规则信息：**
   ```
   应用类型: 自定义
   协议: TCP
   端口范围: 3000
   策略: 允许
   优先级: 1
   备注: 意心后端API
   ```

6. **点击"确定"**

7. **等待 1-2 分钟生效**

---

## 测试服务

### 1. 在服务器上测试（内网）

```bash
curl http://localhost:3000/api/health
```

**期望输出：**
```json
{"success":true,"message":"ok"}
```

---

### 2. 在本地浏览器测试（公网）

打开浏览器，访问：
```
http://8.148.73.181:3000/api/health
```

**如果看到以下内容，说明部署成功：**
```json
{"success":true,"message":"ok"}
```

---

### 3. 查看服务状态

```bash
# 查看PM2进程状态
pm2 status

# 查看实时日志
pm2 logs YixinBackend

# 查看最近日志
pm2 logs YixinBackend --lines 50
```

---

## 配置前端

### 在本地电脑上操作

1. **打开项目目录**
   ```
   F:\YIXIN_PROJECT\
   ```

2. **创建 `.env.production` 文件**

   创建文件：`F:\YIXIN_PROJECT\.env.production`

   内容如下：
   ```env
   VITE_API_URL=http://8.148.73.181:3000/api
   VITE_SUPABASE_URL=https://ykltoevfciknumxaypxf.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mzc3ODYsImV4cCI6MjA3NTExMzc4Nn0._9TuINGYRqe-p0Lh5aBgXXnBYaykVq5bQ-IEn1-07SE
   ```

3. **提交到 Git**
   ```bash
   git add .env.production
   git commit -m "feat: Configure production backend URL"
   git push origin main
   ```

4. **等待 EdgeOne 自动构建**
   - EdgeOne 会自动检测到代码更新
   - 自动构建并部署（需要 3-5 分钟）

5. **测试前端**
   - 访问：https://yinxintest99.edgeone.app
   - 尝试注册、登录、创建会话

---

## 常见问题

### Q1: 脚本执行提示"Permission denied"

**原因：** 脚本没有执行权限

**解决：**
```bash
chmod +x setup-env-linux.sh deploy-linux.sh
```

---

### Q2: npm install 很慢或失败

**原因：** 网络问题或镜像未配置

**解决：**
```bash
# 手动配置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 重试安装
npm install
```

---

### Q3: PM2 启动后服务无法访问

**排查步骤：**

1. 查看服务状态
   ```bash
   pm2 status
   ```

2. 查看错误日志
   ```bash
   pm2 logs YixinBackend --err
   ```

3. 检查端口是否被占用
   ```bash
   netstat -tuln | grep 3000
   ```

4. 检查防火墙规则
   ```bash
   sudo ufw status
   ```

---

### Q4: 公网无法访问，但本地可以

**原因：** 阿里云安全组规则未开放

**解决：**
1. 登录阿里云控制台
2. 找到轻量应用服务器实例
3. 点击"防火墙"选项卡
4. 添加规则开放端口 3000

---

### Q5: 部署后如何更新代码？

```bash
# 连接到服务器
cd ~/yixin

# 拉取最新代码
git pull origin main

# 重新安装依赖（如果package.json有变化）
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart YixinBackend

# 查看日志
pm2 logs YixinBackend
```

---

### Q6: 如何重置部署？

```bash
# 停止并删除服务
pm2 stop YixinBackend
pm2 delete YixinBackend

# 删除项目目录
rm -rf ~/yixin

# 重新开始部署
# （从"上传部署脚本"步骤开始）
```

---

## 常用维护命令

### PM2 命令

```bash
# 查看所有进程
pm2 list

# 查看特定进程状态
pm2 show YixinBackend

# 重启服务
pm2 restart YixinBackend

# 停止服务
pm2 stop YixinBackend

# 删除服务
pm2 delete YixinBackend

# 查看实时日志
pm2 logs YixinBackend

# 查看错误日志
pm2 logs YixinBackend --err

# 清空日志
pm2 flush

# 监控资源使用
pm2 monit
```

---

### 系统监控命令

```bash
# 查看CPU和内存使用
top

# 查看磁盘使用
df -h

# 查看端口监听
netstat -tuln | grep 3000

# 查看进程
ps aux | grep node
```

---

## 性能测试

部署完成后，运行延迟测试：

```bash
cd ~/yixin
npm run test:latency
```

---

## 获取帮助

**遇到问题？**

1. 查看服务日志：`pm2 logs YixinBackend`
2. 检查服务状态：`pm2 status`
3. 查看系统日志：`journalctl -u pm2-admin`
4. 联系支持：提供错误日志和服务器信息

---

## 部署架构图

```
用户浏览器
    ↓
[EdgeOne CDN - 前端]
https://yinxintest99.edgeone.app
    ↓ (API 请求)
[阿里云轻量服务器 - 后端]
IP: 8.148.73.181:3000
运行: PM2 + Node.js
    ↓
[Supabase - 数据库]
用户数据、会话、消息
    ↓
[阿里云百炼 - AI服务]
qwen-turbo, qwen3-omni
```

---

**🎉 祝部署顺利！**
