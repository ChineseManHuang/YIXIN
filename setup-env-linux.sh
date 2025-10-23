#!/bin/bash

################################################################################
# 意心AI心理咨询平台 - Linux环境变量配置脚本
#
# 使用方法:
#   chmod +x setup-env-linux.sh
#   ./setup-env-linux.sh
################################################################################

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 生成随机JWT密钥
generate_jwt_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

print_info "========================================"
print_info "   环境变量配置向导"
print_info "========================================"
echo ""

# 检查是否已存在.env文件
if [ -f ".env" ]; then
    print_warning ".env 文件已存在"
    read -p "是否覆盖？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "保留现有配置，退出"
        exit 0
    fi
fi

# 创建.env文件
cat > .env << 'EOF'
# ===== 数据库配置 (Supabase) =====
SUPABASE_URL=https://ykltoevfciknumxaypxf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Mzc3ODYsImV4cCI6MjA3NTExMzc4Nn0._9TuINGYRqe-p0Lh5aBgXXnBYaykVq5bQ-IEn1-07SE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbHRvZXZmY2lrbnVteGF5cHhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUzNzc4NiwiZXhwIjoyMDc1MTEzNzg2fQ.AZHi1GftjfipZRZRU7zLA0yFSaxw0rUrOI2c9Oph1Cs

# ===== JWT密钥 =====
EOF

# 生成JWT密钥
JWT_SECRET=$(generate_jwt_secret)
echo "JWT_SECRET=$JWT_SECRET" >> .env

cat >> .env << 'EOF'

# ===== 阿里云百炼API配置 =====
BAILIAN_API_KEY=sk-973083c9be1d48e5a55010fa7d30fb9a
BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com

# ===== 服务器配置 =====
PORT=3000
NODE_ENV=production
EOF

print_success "✅ .env 文件创建成功！"
echo ""

print_info "配置内容预览:"
echo "----------------------------------------"
cat .env
echo "----------------------------------------"
echo ""

print_success "🎉 环境变量配置完成！"
print_info "现在可以运行: ./deploy-linux.sh"
