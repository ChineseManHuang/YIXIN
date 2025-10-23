#!/bin/bash

################################################################################
# 意心AI心理咨询平台 - Linux服务器自动部署脚本
#
# 适用于: 阿里云轻量应用服务器 (Ubuntu/Debian/CentOS/Alibaba Cloud Linux)
# 功能: 自动安装环境、部署项目、配置PM2
#
# 使用方法:
#   chmod +x deploy-linux.sh
#   ./deploy-linux.sh
################################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}$1${NC}"
    echo "=========================================="
    echo ""
}

# 检测Linux发行版
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "无法检测操作系统类型"
        exit 1
    fi

    print_info "检测到操作系统: $OS $VER"
}

# 更新包管理器
update_package_manager() {
    print_info "更新包管理器..."

    case $OS in
        ubuntu|debian)
            sudo apt-get update -y
            ;;
        centos|rhel|almalinux)
            sudo yum update -y
            ;;
        *)
            print_warning "未知的操作系统，跳过包管理器更新"
            ;;
    esac

    print_success "包管理器更新完成"
}

# 安装基础工具
install_basic_tools() {
    print_info "安装基础工具 (curl, wget, git)..."

    case $OS in
        ubuntu|debian)
            sudo apt-get install -y curl wget git
            ;;
        centos|rhel|almalinux)
            sudo yum install -y curl wget git
            ;;
    esac

    print_success "基础工具安装完成"
}

# 检查Node.js是否已安装
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_info "检测到已安装 Node.js $NODE_VERSION"

        # 检查版本是否>=18
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ $MAJOR_VERSION -ge 18 ]; then
            print_success "Node.js 版本满足要求 (>=18)"
            return 0
        else
            print_warning "Node.js 版本过低 (需要 >=18)，将重新安装"
            return 1
        fi
    else
        print_info "未检测到 Node.js，将进行安装"
        return 1
    fi
}

# 安装Node.js 20.x (LTS)
install_nodejs() {
    print_info "安装 Node.js 20.x LTS..."

    # 使用NodeSource仓库安装
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

    case $OS in
        ubuntu|debian)
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|almalinux)
            sudo yum install -y nodejs
            ;;
    esac

    # 验证安装
    if command -v node &> /dev/null; then
        print_success "Node.js 安装成功: $(node -v)"
        print_success "npm 版本: $(npm -v)"
    else
        print_error "Node.js 安装失败"
        exit 1
    fi
}

# 配置npm国内镜像
configure_npm_mirror() {
    print_info "配置npm淘宝镜像（加速下载）..."
    npm config set registry https://registry.npmmirror.com
    print_success "npm镜像配置完成"
}

# 安装PM2
install_pm2() {
    print_info "安装 PM2 进程管理器..."

    if command -v pm2 &> /dev/null; then
        print_info "PM2 已安装: $(pm2 -v)"
    else
        sudo npm install -g pm2
        print_success "PM2 安装成功"
    fi

    # 配置PM2开机自启
    print_info "配置 PM2 开机自启动..."
    pm2 startup | tail -n 1 | sudo bash || true
    print_success "PM2 开机自启配置完成"
}

# 创建项目目录
create_project_dir() {
    print_info "创建项目目录..."

    PROJECT_DIR="/home/admin/yixin"

    if [ -d "$PROJECT_DIR" ]; then
        print_warning "项目目录已存在: $PROJECT_DIR"
        read -p "是否删除并重新创建？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf $PROJECT_DIR
            print_info "已删除旧目录"
        else
            print_info "保留现有目录"
        fi
    fi

    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR

    print_success "项目目录创建完成: $PROJECT_DIR"
}

# 克隆项目代码
clone_project() {
    print_info "克隆项目代码..."

    REPO_URL="https://github.com/ChineseManHuang/YIXIN.git"

    if [ -d ".git" ]; then
        print_info "检测到已有Git仓库，执行拉取..."
        git pull origin main
    else
        print_info "克隆仓库: $REPO_URL"
        git clone $REPO_URL .
    fi

    print_success "项目代码获取完成"
}

# 检查环境变量文件
check_env_file() {
    print_info "检查环境变量配置..."

    if [ ! -f ".env" ]; then
        print_warning "未找到 .env 文件"
        print_info "请运行以下命令配置环境变量:"
        print_info "  nano .env"
        print_info ""
        print_info "需要配置的变量:"
        print_info "  SUPABASE_URL=https://ykltoevfciknumxaypxf.supabase.co"
        print_info "  SUPABASE_ANON_KEY=你的anon key"
        print_info "  SUPABASE_SERVICE_KEY=你的service key"
        print_info "  JWT_SECRET=随机生成的密钥"
        print_info "  BAILIAN_API_KEY=sk-973083c9be1d48e5a55010fa7d30fb9a"
        print_info "  BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com"
        print_info ""

        read -p "按回车键继续配置环境变量..."
        return 1
    else
        print_success "环境变量文件已存在"
        return 0
    fi
}

# 安装项目依赖
install_dependencies() {
    print_info "安装项目依赖（可能需要5-10分钟）..."

    npm install

    print_success "依赖安装完成"
}

# 构建项目
build_project() {
    print_info "构建项目..."

    npm run build

    print_success "项目构建完成"
}

# 配置防火墙
configure_firewall() {
    print_info "配置防火墙规则..."

    # 检查是否使用ufw
    if command -v ufw &> /dev/null; then
        sudo ufw allow 3000/tcp
        print_success "已开放端口 3000 (ufw)"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --reload
        print_success "已开放端口 3000 (firewall-cmd)"
    else
        print_warning "未检测到防火墙管理工具"
        print_warning "请手动在阿里云控制台开放端口 3000"
    fi
}

# 启动服务
start_service() {
    print_info "启动后端服务..."

    # 停止旧进程（如果存在）
    pm2 stop YixinBackend 2>/dev/null || true
    pm2 delete YixinBackend 2>/dev/null || true

    # 启动新进程
    pm2 start npm --name "YixinBackend" -- run server:prod

    # 保存PM2配置
    pm2 save

    print_success "后端服务启动成功"

    # 显示服务状态
    echo ""
    pm2 status
    echo ""
}

# 测试服务
test_service() {
    print_info "等待服务启动..."
    sleep 5

    print_info "测试健康检查接口..."

    if curl -f http://localhost:3000/api/health &> /dev/null; then
        print_success "✅ 服务运行正常！"
        echo ""
        echo "本地测试: http://localhost:3000/api/health"
        echo "公网访问: http://8.148.73.181:3000/api/health"
    else
        print_error "❌ 服务测试失败，请检查日志:"
        print_info "  pm2 logs YixinBackend"
    fi
}

# 显示完成信息
show_completion_info() {
    print_header "🎉 部署完成！"

    echo "服务器信息:"
    echo "  - 公网IP: 8.148.73.181"
    echo "  - 后端端口: 3000"
    echo "  - 项目目录: /home/admin/yixin"
    echo ""

    echo "常用命令:"
    echo "  查看状态:   pm2 status"
    echo "  查看日志:   pm2 logs YixinBackend"
    echo "  重启服务:   pm2 restart YixinBackend"
    echo "  停止服务:   pm2 stop YixinBackend"
    echo ""

    echo "下一步:"
    echo "  1. 在阿里云控制台开放端口 3000"
    echo "  2. 测试公网访问: http://8.148.73.181:3000/api/health"
    echo "  3. 配置前端连接后端"
    echo ""

    print_success "部署脚本执行完成！"
}

################################################################################
# 主流程
################################################################################

main() {
    print_header "意心AI心理咨询平台 - Linux自动部署脚本"

    # 1. 环境检测
    detect_os

    # 2. 更新系统
    update_package_manager

    # 3. 安装基础工具
    install_basic_tools

    # 4. 检查并安装Node.js
    if ! check_nodejs; then
        install_nodejs
    fi

    # 5. 配置npm镜像
    configure_npm_mirror

    # 6. 安装PM2
    install_pm2

    # 7. 创建项目目录
    create_project_dir

    # 8. 克隆项目代码
    clone_project

    # 9. 检查环境变量
    if ! check_env_file; then
        print_warning "请先配置 .env 文件，然后重新运行此脚本"
        exit 0
    fi

    # 10. 安装依赖
    install_dependencies

    # 11. 构建项目
    build_project

    # 12. 配置防火墙
    configure_firewall

    # 13. 启动服务
    start_service

    # 14. 测试服务
    test_service

    # 15. 显示完成信息
    show_completion_info
}

# 执行主流程
main
