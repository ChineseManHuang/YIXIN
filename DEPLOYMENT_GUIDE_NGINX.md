# YIXIN前端部署指南 - Nginx方案

## 📋 部署概览

**部署架构:** Nginx + Node.js（同一服务器）
**服务器:** 阿里云轻量应用服务器 8.148.73.181
**域名:** yixinaipsy.com
**预计时间:** 30-45分钟

---

## ✅ 准备工作

### 本地文件检查

1. **前端构建文件** - 确认 `F:\YIXIN_PROJECT\dist\` 文件夹存在
2. **部署脚本** - `F:\YIXIN_PROJECT\deploy-frontend.sh`
3. **Nginx配置** - `F:\YIXIN_PROJECT\nginx-yixin.conf`

### 服务器信息

- **公网IP:** 8.148.73.181
- **用户名:** admin
- **部署目录:** /home/admin/yixin
- **连接方式:** 阿里云Workbench 或 SSH

---

## 🚀 部署步骤

### 第1步: 连接到服务器

**方式1: 阿里云Workbench（推荐）**
```
1. 访问: https://swas.console.aliyun.com/
2. 找到您的实例（8.148.73.181）
3. 点击"远程连接" → "Workbench"
4. 等待连接成功
```

**方式2: SSH客户端**
```bash
ssh admin@8.148.73.181
```

---

### 第2步: 上传并执行部署脚本

#### 2.1 上传部署脚本

**使用Workbench上传:**
```bash
# 在本地打开PowerShell或CMD，执行：
scp F:\YIXIN_PROJECT\deploy-frontend.sh admin@8.148.73.181:/home/admin/
```

**或者在Workbench中直接创建文件:**
```bash
# 连接到服务器后，执行：
cd /home/admin
vi deploy-frontend.sh
# 按 i 进入编辑模式
# 粘贴 deploy-frontend.sh 的内容
# 按 ESC，输入 :wq 保存退出
```

#### 2.2 执行部署脚本

```bash
# 添加执行权限
chmod +x deploy-frontend.sh

# 执行脚本
./deploy-frontend.sh
```

**脚本会自动完成:**
- ✅ 安装Nginx
- ✅ 创建前端目录
- ✅ 配置Nginx
- ✅ 测试配置
- ✅ 启动服务

---

### 第3步: 上传前端文件

#### 方式1: 使用SCP（推荐）

**在本地Windows PowerShell中执行:**

```powershell
# 进入项目目录
cd F:\YIXIN_PROJECT

# 上传整个dist文件夹
scp -r dist/* admin@8.148.73.181:/home/admin/yixin/frontend/
```

**等待上传完成，可能需要1-3分钟。**

#### 方式2: 使用WinSCP图形界面

1. 下载并安装 WinSCP: https://winscp.net/
2. 新建连接:
   - 主机: 8.148.73.181
   - 用户名: admin
   - 密码: （您的服务器密码）
3. 连接成功后:
   - 左侧: 本地 `F:\YIXIN_PROJECT\dist\`
   - 右侧: 服务器 `/home/admin/yixin/frontend/`
4. 选中dist文件夹中的所有文件，拖拽到右侧
5. 等待上传完成

#### 方式3: 使用阿里云Workbench上传（小文件）

```bash
# 在服务器上，创建临时目录
cd /home/admin
mkdir temp_upload

# 使用Workbench的文件上传功能
# 上传单个文件到 temp_upload

# 然后移动到正确位置
mv temp_upload/* /home/admin/yixin/frontend/
```

---

### 第4步: 验证文件上传

在服务器上执行:

```bash
# 检查文件是否存在
ls -lh /home/admin/yixin/frontend/

# 应该看到类似：
# index.html
# assets/
#   ├── index-xxxxx.js
#   ├── index-xxxxx.css
#   └── ...
```

---

### 第5步: 配置防火墙（阿里云控制台）

1. 访问: https://swas.console.aliyun.com/
2. 点击您的实例
3. 左侧菜单 → "安全" → "防火墙"
4. 确保已添加以下规则:

| 端口范围 | 协议 | 策略 | 说明 |
|---------|------|------|------|
| 80 | TCP | 允许 | HTTP |
| 443 | TCP | 允许 | HTTPS |
| 3000 | TCP | 允许 | 后端API |

**如果没有，点击"添加规则"添加。**

---

### 第6步: 配置DNS解析

1. 登录阿里云DNS控制台: https://dns.console.aliyun.com/
2. 找到域名 `yixinaipsy.com`
3. 点击"解析设置"
4. 添加/修改以下记录:

**主域名 (@):**
```
记录类型: A
主机记录: @
解析线路: 默认
记录值: 8.148.73.181
TTL: 10分钟
```

**www子域名:**
```
记录类型: A
主机记录: www
解析线路: 默认
记录值: 8.148.73.181
TTL: 10分钟
```

5. 点击"确定"保存

**DNS生效时间: 5-15分钟**

---

### 第7步: 测试访问

#### 7.1 等待DNS生效

```bash
# 在本地CMD或PowerShell中执行
nslookup yixinaipsy.com

# 应该看到:
# Address: 8.148.73.181
```

#### 7.2 访问网站

浏览器访问:
```
http://yixinaipsy.com
或
http://8.148.73.181
```

**期望结果:**
- ✅ 看到YIXIN登录/注册页面
- ✅ 页面样式正常显示
- ✅ 可以正常导航到各个页面

#### 7.3 测试API连接

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 尝试登录或注册
4. 检查 `/api/auth/login` 等请求是否成功

---

## 🔧 常见问题排查

### 问题1: 无法访问网站（404）

**检查:**
```bash
# 1. 确认Nginx运行
sudo systemctl status nginx

# 2. 检查文件是否存在
ls -l /home/admin/yixin/frontend/index.html

# 3. 查看Nginx错误日志
sudo tail -20 /var/log/nginx/yixin_error.log
```

**解决:**
```bash
# 重启Nginx
sudo systemctl restart nginx
```

---

### 问题2: API请求失败（502 Bad Gateway）

**检查后端服务:**
```bash
# 检查后端服务状态
pm2 status

# 应该看到 YixinBackend: online
```

**检查端口:**
```bash
# 测试后端API
curl http://localhost:3000/api/health

# 应该返回: {"success":true,"message":"ok"}
```

---

### 问题3: 页面样式不显示

**检查静态资源路径:**
```bash
# 查看assets目录
ls -l /home/admin/yixin/frontend/assets/

# 检查Nginx访问日志
sudo tail -20 /var/log/nginx/yixin_access.log
```

**解决:**
```bash
# 确保文件权限正确
sudo chown -R admin:admin /home/admin/yixin/frontend
sudo chmod -R 755 /home/admin/yixin/frontend
```

---

### 问题4: 刷新页面404

**原因:** SPA路由问题

**检查Nginx配置:**
```bash
# 查看配置
cat /etc/nginx/conf.d/yixin.conf | grep try_files

# 应该包含: try_files $uri $uri/ /index.html;
```

---

## 🎯 后续优化（可选）

### 配置HTTPS

1. 安装Certbot:
```bash
sudo yum install -y certbot python3-certbot-nginx
```

2. 自动申请SSL证书:
```bash
sudo certbot --nginx -d yixinaipsy.com -d www.yixinaipsy.com
```

3. 自动续期:
```bash
sudo certbot renew --dry-run
```

---

## 📝 常用命令

```bash
# 查看Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx

# 重载Nginx配置（无需停机）
sudo nginx -s reload

# 测试Nginx配置
sudo nginx -t

# 查看访问日志
sudo tail -f /var/log/nginx/yixin_access.log

# 查看错误日志
sudo tail -f /var/log/nginx/yixin_error.log

# 查看后端服务
pm2 status
pm2 logs YixinBackend

# 测试后端API
curl http://localhost:3000/api/health
```

---

## ✅ 部署完成检查清单

- [ ] Nginx安装并运行
- [ ] 前端文件已上传到 `/home/admin/yixin/frontend/`
- [ ] Nginx配置文件创建并测试通过
- [ ] 防火墙已开放80、443端口
- [ ] DNS解析已配置并生效
- [ ] 可以通过域名访问网站
- [ ] 前端页面样式正常
- [ ] API请求成功
- [ ] 路由跳转正常
- [ ] （可选）HTTPS配置完成

---

## 🎉 成功标志

当您可以:
1. ✅ 访问 `http://yixinaipsy.com` 看到登录页
2. ✅ 成功注册/登录
3. ✅ 创建会话并与AI对话
4. ✅ 语音功能正常工作

**恭喜！部署成功！** 🎊

---

## 📞 遇到问题？

如果遇到任何问题，请:
1. 查看上述"常见问题排查"章节
2. 检查服务器日志
3. 将错误信息提供给我

---

**创建时间:** 2025-10-26
**更新时间:** 2025-10-26
**部署方案:** Nginx直接部署
**预计完成:** 30-45分钟
