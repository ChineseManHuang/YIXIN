# 部署指南 - 阿里云 + EdgeOne 架构

**最后更新:** 2025年1月13日

---

## 部署架构

```
用户 (中国大陆)
    ↓
EdgeOne CDN (腾讯云) - 前端静态资源
    ↓
阿里云轻量服务器 - Node.js 后端 API
    ↓
Supabase (PostgreSQL) + 百炼 API
```

---

## 阶段1: 后端部署到阿里云轻量服务器

### 1.1 服务器信息

**请填写你的服务器信息:**
- [ ] **服务器IP:** `___________________`
- [ ] **SSH端口:** `22` (默认)
- [ ] **操作系统:** Ubuntu / CentOS / Alibaba Cloud Linux
- [ ] **配置:** 2核2G / 2核4G / 其他
- [ ] **带宽:** 3M / 5M / 其他

### 1.2 SSH 连接测试

```bash
# 从本地连接到服务器
ssh root@你的服务器IP

# 如果使用密钥
ssh -i /path/to/your/key.pem root@你的服务器IP
```

### 1.3 安装 Node.js 18+

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# 或
sudo yum update -y  # CentOS/Alibaba Cloud Linux

# 安装 Node.js 18.x (推荐使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs  # Ubuntu/Debian
# 或
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # CentOS

# 验证安装
node -v  # 应该显示 v18.x.x
npm -v   # 应该显示 9.x.x 或更高
```

### 1.4 安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v

# 配置 PM2 开机自启
pm2 startup
# 按照提示执行生成的命令
```

### 1.5 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/Alibaba Cloud Linux
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
curl http://localhost  # 应该看到 Nginx 欢迎页面
```

### 1.6 配置防火墙和安全组

#### 阿里云控制台配置
1. 登录阿里云控制台
2. 进入轻量应用服务器管理页面
3. 点击"防火墙"
4. 添加规则:
   - **HTTP**: 端口 80, 协议 TCP, 来源 0.0.0.0/0
   - **HTTPS**: 端口 443, 协议 TCP, 来源 0.0.0.0/0
   - **SSH**: 端口 22, 协议 TCP, 来源 你的IP (安全起见)

#### 服务器防火墙配置 (Ubuntu UFW)
```bash
# 如果使用 UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 阶段2: 部署后端代码

### 2.1 配置 Git

```bash
# 安装 Git (如果未安装)
sudo apt install -y git  # Ubuntu/Debian
# 或
sudo yum install -y git  # CentOS

# 配置 Git (可选)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2.2 克隆代码仓库

```bash
# 创建应用目录
mkdir -p /var/www
cd /var/www

# 克隆仓库
git clone https://github.com/ChineseManHuang/YIXIN.git
cd YIXIN

# 或使用 SSH (如果配置了密钥)
# git clone git@github.com:ChineseManHuang/YIXIN.git
```

### 2.3 安装依赖

```bash
# 安装项目依赖
npm install

# 如果遇到权限问题
sudo npm install --unsafe-perm
```

### 2.4 配置环境变量

```bash
# 创建 .env 文件
nano .env
# 或
vi .env
```

**在 .env 中填入以下内容:**

```bash
# Supabase 配置
SUPABASE_URL=你的Supabase URL
SUPABASE_ANON_KEY=你的Supabase Anon Key
SUPABASE_SERVICE_KEY=你的Supabase Service Key

# JWT 密钥
JWT_SECRET=你的JWT密钥

# 百炼 API 配置
BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com
BAILIAN_API_KEY=你的百炼API密钥

# 服务器端口
PORT=3000

# Node 环境
NODE_ENV=production
```

**保存并退出:**
- nano: `Ctrl + X`, 然后 `Y`, 然后 `Enter`
- vi: 按 `Esc`, 输入 `:wq`, 按 `Enter`

### 2.5 构建 TypeScript 代码

```bash
# 构建项目
npm run build

# 检查构建产物
ls -la dist/  # 前端构建产物
ls -la server/  # 后端 TypeScript 编译后的 JS
```

### 2.6 使用 PM2 启动服务

```bash
# 启动后端服务
cd /var/www/YIXIN
pm2 start server/index.js --name yixin-api

# 查看服务状态
pm2 status

# 查看日志
pm2 logs yixin-api

# 保存 PM2 配置
pm2 save

# 测试服务
curl http://localhost:3000/api/health  # 应该返回 200 OK
```

---

## 阶段3: 配置 Nginx 反向代理

### 3.1 创建 Nginx 配置文件

```bash
# 创建网站配置
sudo nano /etc/nginx/sites-available/yixin

# 或在 CentOS 上
sudo nano /etc/nginx/conf.d/yixin.conf
```

**基础配置 (暂时不含 HTTPS):**

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    # 日志
    access_log /var/log/nginx/yixin_access.log;
    error_log /var/log/nginx/yixin_error.log;

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 根路径 (临时返回 API 信息)
    location / {
        return 200 'YIXIN API Server is running\n';
        add_header Content-Type text/plain;
    }
}
```

### 3.2 启用配置

```bash
# Ubuntu/Debian - 创建软链接
sudo ln -s /etc/nginx/sites-available/yixin /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

### 3.3 测试 API 访问

```bash
# 从服务器本地测试
curl http://localhost/api/health

# 从外部测试 (替换为你的服务器IP)
curl http://你的服务器IP/api/health
```

---

## 阶段4: 配置 HTTPS (Let's Encrypt)

### 4.1 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS
sudo yum install -y certbot python3-certbot-nginx
```

### 4.2 申请 SSL 证书

**前提条件:**
- [ ] 域名已解析到服务器 IP
- [ ] 防火墙已开放 80 和 443 端口

```bash
# 自动配置 HTTPS
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com

# 按照提示操作:
# 1. 输入邮箱
# 2. 同意服务条款 (A)
# 3. 选择是否重定向 HTTP 到 HTTPS (推荐选 2)
```

### 4.3 配置自动续期

```bash
# Certbot 会自动配置 cron 任务，测试续期
sudo certbot renew --dry-run

# 查看证书信息
sudo certbot certificates
```

### 4.4 验证 HTTPS

```bash
# 测试 HTTPS 访问
curl https://你的域名.com/api/health

# 检查证书
openssl s_client -connect 你的域名.com:443 -servername 你的域名.com
```

---

## 阶段5: 配置 CORS

### 5.1 更新后端 CORS 配置

在服务器上编辑代码:

```bash
cd /var/www/YIXIN
nano server/index.ts
```

找到 CORS 配置并更新:

```typescript
app.use(cors({
  origin: [
    'https://你的EdgeOne域名.com',  // 生产环境
    'http://localhost:5173'          // 本地开发
  ],
  credentials: true
}))
```

### 5.2 重新构建并重启

```bash
# 重新构建
npm run build

# 重启 PM2 服务
pm2 restart yixin-api

# 查看日志
pm2 logs yixin-api --lines 50
```

---

## 阶段6: 前端部署到 EdgeOne

### 6.1 注册 EdgeOne

1. 访问腾讯云 EdgeOne 控制台
2. 创建站点
3. 添加域名

### 6.2 修改前端 API 地址

```bash
# 在本地项目中修改
cd F:\YIXIN_PROJECT

# 编辑 src/lib/api.ts
nano src/lib/api.ts
```

修改 API base URL:

```typescript
const API_BASE_URL = import.meta.env.PROD
  ? 'https://你的域名.com/api'  // 生产环境 - 阿里云后端
  : 'http://localhost:3001/api'  // 开发环境
```

### 6.3 构建前端

```bash
# 本地构建
npm run build

# 检查构建产物
ls -la dist/
```

### 6.4 上传到 EdgeOne

**方式1: EdgeOne 控制台上传**
1. 登录 EdgeOne 控制台
2. 选择站点 -> 内容管理
3. 上传 dist 目录中的所有文件

**方式2: 使用 EdgeOne CLI (如果支持)**
```bash
# 具体命令依 EdgeOne 文档而定
edgeone deploy dist/
```

### 6.5 配置 SPA 路由

在 EdgeOne 控制台配置回退规则:
- 所有路由 `/*` 回退到 `/index.html`

---

## 验证和测试清单

### 后端验证
- [ ] `curl https://你的域名.com/api/health` 返回 200
- [ ] 登录功能正常
- [ ] 创建会话功能正常
- [ ] 发送消息功能正常
- [ ] 语音功能正常
- [ ] Supabase 连接正常
- [ ] 百炼 API 调用正常

### 前端验证
- [ ] 首页加载正常
- [ ] 路由跳转正常 (刷新不 404)
- [ ] 登录功能正常
- [ ] Dashboard 显示正常
- [ ] 创建会话正常
- [ ] 文字对话正常
- [ ] 语音对话正常
- [ ] 跨域请求成功

### 性能验证
- [ ] 前端首次加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 语音功能延迟可接受

---

## 监控和维护

### PM2 常用命令

```bash
# 查看所有进程
pm2 list

# 查看详细信息
pm2 show yixin-api

# 查看日志
pm2 logs yixin-api
pm2 logs yixin-api --lines 100

# 重启服务
pm2 restart yixin-api

# 停止服务
pm2 stop yixin-api

# 删除服务
pm2 delete yixin-api

# 查看监控
pm2 monit
```

### 日志位置

- **PM2 日志:** `~/.pm2/logs/`
- **Nginx 访问日志:** `/var/log/nginx/yixin_access.log`
- **Nginx 错误日志:** `/var/log/nginx/yixin_error.log`

### 更新代码

```bash
# SSH 到服务器
cd /var/www/YIXIN

# 拉取最新代码
git pull origin main

# 安装新依赖 (如果有)
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart yixin-api
```

---

## 故障排查

### 问题1: API 无法访问
```bash
# 检查 Node.js 服务
pm2 status
pm2 logs yixin-api

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 检查 Nginx
sudo systemctl status nginx
sudo nginx -t
```

### 问题2: CORS 错误
- 检查后端 CORS 配置
- 检查前端 API 地址是否正确
- 查看浏览器控制台错误信息

### 问题3: SSL 证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 回滚方案

如果部署失败需要回滚:

```bash
# 回滚到上一个版本
cd /var/www/YIXIN
git log --oneline  # 查看提交历史
git reset --hard <commit-hash>  # 回滚到指定版本
npm install
npm run build
pm2 restart yixin-api
```

---

## 下一步优化

部署完成后可以考虑:
- [ ] 配置 Redis 缓存
- [ ] 配置 Nginx Gzip 压缩
- [ ] 配置 CDN 缓存策略
- [ ] 设置监控告警
- [ ] 配置自动备份
- [ ] 迁移数据库到阿里云 RDS (可选)
