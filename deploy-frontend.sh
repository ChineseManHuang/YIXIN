#!/bin/bash
# YIXIN前端部署脚本
# 在阿里云轻量应用服务器上执行

set -e  # 遇到错误立即退出

echo "========================================="
echo "  YIXIN AI心理咨询平台 - 前端部署"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤1: 检查并安装Nginx
echo -e "${YELLOW}[步骤1/6]${NC} 检查Nginx安装状态..."
if ! command -v nginx &> /dev/null; then
    echo "Nginx未安装，开始安装..."
    sudo yum install -y nginx
    echo -e "${GREEN}✓${NC} Nginx安装完成"
else
    echo -e "${GREEN}✓${NC} Nginx已安装: $(nginx -v 2>&1)"
fi
echo ""

# 步骤2: 创建前端目录
echo -e "${YELLOW}[步骤2/6]${NC} 创建前端文件目录..."
sudo mkdir -p /home/admin/yixin/frontend
sudo chown -R admin:admin /home/admin/yixin/frontend
echo -e "${GREEN}✓${NC} 目录创建完成: /home/admin/yixin/frontend"
echo ""

# 步骤3: 备份旧的Nginx配置（如果存在）
echo -e "${YELLOW}[步骤3/6]${NC} 配置Nginx..."
if [ -f /etc/nginx/conf.d/yixin.conf ]; then
    echo "备份旧配置..."
    sudo cp /etc/nginx/conf.d/yixin.conf /etc/nginx/conf.d/yixin.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# 创建Nginx配置
sudo tee /etc/nginx/conf.d/yixin.conf > /dev/null << 'EOF'
# YIXIN AI心理咨询平台 - Nginx配置

server {
    listen 80;
    server_name yixinaipsy.com www.yixinaipsy.com;

    # 日志配置
    access_log /var/log/nginx/yixin_access.log;
    error_log /var/log/nginx/yixin_error.log;

    # 前端静态文件
    location / {
        root /home/admin/yixin/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理
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

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
EOF

echo -e "${GREEN}✓${NC} Nginx配置文件创建完成"
echo ""

# 步骤4: 测试Nginx配置
echo -e "${YELLOW}[步骤4/6]${NC} 测试Nginx配置..."
if sudo nginx -t; then
    echo -e "${GREEN}✓${NC} Nginx配置测试通过"
else
    echo -e "${RED}✗${NC} Nginx配置测试失败，请检查配置文件"
    exit 1
fi
echo ""

# 步骤5: 配置防火墙
echo -e "${YELLOW}[步骤5/6]${NC} 配置防火墙..."
echo "请确保阿里云控制台防火墙已开放 80 和 443 端口"
echo "控制台地址: https://swas.console.aliyun.com/"
echo ""

# 步骤6: 启动Nginx
echo -e "${YELLOW}[步骤6/6]${NC} 启动Nginx服务..."
sudo systemctl enable nginx
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓${NC} Nginx服务启动成功"
else
    echo -e "${RED}✗${NC} Nginx服务启动失败"
    sudo systemctl status nginx
    exit 1
fi
echo ""

# 显示状态
echo "========================================="
echo -e "${GREEN}部署脚本执行完成！${NC}"
echo "========================================="
echo ""
echo "下一步操作："
echo "1. 上传前端文件到: /home/admin/yixin/frontend"
echo "2. 配置DNS解析指向: 8.148.73.181"
echo "3. 访问测试: http://yixinaipsy.com"
echo ""
echo "服务状态检查命令："
echo "  - 查看Nginx状态: sudo systemctl status nginx"
echo "  - 查看访问日志: sudo tail -f /var/log/nginx/yixin_access.log"
echo "  - 查看错误日志: sudo tail -f /var/log/nginx/yixin_error.log"
echo "  - 重载配置: sudo nginx -s reload"
echo ""
