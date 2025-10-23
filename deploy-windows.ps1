# ====================================================================
# 意心 AI 心理咨询平台 - Windows Server 部署脚本
# ====================================================================
#
# 用途: 在阿里云 Windows Server 上部署 Node.js 后端
# 目标路径: F:\www\yixin
# 端口: 3000 (可在 .env 中修改)
#
# 使用方法:
# 1. 以管理员身份运行 PowerShell
# 2. 执行: .\deploy-windows.ps1
# ====================================================================

# 设置错误处理
$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  意心 AI 心理咨询平台 - Windows 部署脚本" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# 配置变量
# ====================================================================
$PROJECT_DIR = "F:\www\yixin"
$REPO_URL = "https://github.com/ChineseManHuang/YIXIN.git"
$PORT = 3000
$SERVICE_NAME = "YixinBackend"

# ====================================================================
# 步骤 1: 检查管理员权限
# ====================================================================
Write-Host "[1/10] 检查管理员权限..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ 错误: 请以管理员身份运行此脚本" -ForegroundColor Red
    Write-Host "   右键点击 PowerShell -> 以管理员身份运行" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ 管理员权限检查通过" -ForegroundColor Green
Write-Host ""

# ====================================================================
# 步骤 2: 检查 Node.js
# ====================================================================
Write-Host "[2/10] 检查 Node.js 安装..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green

    # 检查版本是否 >= 20
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 20) {
        Write-Host "⚠️  警告: Node.js 版本过低 (需要 >= 20), 当前: $nodeVersion" -ForegroundColor Yellow
        Write-Host "   请访问 https://nodejs.org 下载最新版本" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js 未安装!" -ForegroundColor Red
    Write-Host "   请访问 https://nodejs.org 下载并安装 Node.js 20+" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ====================================================================
# 步骤 3: 检查 Git
# ====================================================================
Write-Host "[3/10] 检查 Git 安装..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装!" -ForegroundColor Red
    Write-Host "   请访问 https://git-scm.com/download/win 下载并安装 Git" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ====================================================================
# 步骤 4: 创建/更新项目目录
# ====================================================================
Write-Host "[4/10] 准备项目目录..." -ForegroundColor Yellow
if (Test-Path $PROJECT_DIR) {
    Write-Host "⚠️  项目目录已存在: $PROJECT_DIR" -ForegroundColor Yellow
    $response = Read-Host "是否删除并重新克隆? (y/n)"
    if ($response -eq 'y') {
        Write-Host "正在删除旧目录..." -ForegroundColor Yellow
        Remove-Item -Path $PROJECT_DIR -Recurse -Force
        Write-Host "✅ 旧目录已删除" -ForegroundColor Green
    } else {
        Write-Host "⚠️  跳过克隆,使用现有目录" -ForegroundColor Yellow
        Set-Location $PROJECT_DIR
        Write-Host "正在拉取最新代码..." -ForegroundColor Yellow
        git pull origin main
        Write-Host "✅ 代码已更新" -ForegroundColor Green
    }
} else {
    Write-Host "正在创建目录: $PROJECT_DIR" -ForegroundColor Yellow
    $parentDir = Split-Path $PROJECT_DIR -Parent
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    Write-Host "✅ 目录已创建" -ForegroundColor Green
}
Write-Host ""

# ====================================================================
# 步骤 5: 克隆代码仓库 (如果需要)
# ====================================================================
if (-not (Test-Path $PROJECT_DIR)) {
    Write-Host "[5/10] 克隆代码仓库..." -ForegroundColor Yellow
    Write-Host "仓库地址: $REPO_URL" -ForegroundColor Cyan
    git clone $REPO_URL $PROJECT_DIR
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 克隆失败!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 代码克隆成功" -ForegroundColor Green
} else {
    Write-Host "[5/10] 跳过克隆 (已存在)" -ForegroundColor Yellow
}
Write-Host ""

# 切换到项目目录
Set-Location $PROJECT_DIR

# ====================================================================
# 步骤 6: 安装依赖
# ====================================================================
Write-Host "[6/10] 安装项目依赖..." -ForegroundColor Yellow
Write-Host "这可能需要几分钟..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依赖安装成功" -ForegroundColor Green
Write-Host ""

# ====================================================================
# 步骤 7: 配置环境变量
# ====================================================================
Write-Host "[7/10] 配置环境变量..." -ForegroundColor Yellow
$envFile = Join-Path $PROJECT_DIR ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  .env 文件不存在,创建模板..." -ForegroundColor Yellow

    $envContent = @"
# 生产环境配置
NODE_ENV=production
PORT=3000

# Supabase 配置 (必需)
SB_URL=你的Supabase项目URL
SB_ANON_KEY=你的Supabase匿名密钥
SB_SERVICE_ROLE_KEY=你的Supabase服务密钥

# JWT 密钥 (必需)
JWT_SECRET=请生成一个安全的随机字符串

# CORS 允许的前端域名 (必需,多个以逗号分隔)
CLIENT_ORIGINS=https://yinxintest99.edgeone.app,https://yixinaipsy.com,https://www.yixinaipsy.com

# 阿里云百炼 API (可选)
BAILIAN_API_KEY=
BAILIAN_ENDPOINT=https://dashscope.aliyuncs.com

# 阿里云语音 API (可选)
ALIBABA_VOICE_API_KEY=
ALIBABA_VOICE_API_URL=
"@

    Set-Content -Path $envFile -Value $envContent
    Write-Host "✅ .env 模板已创建" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  请立即编辑 .env 文件,填入正确的配置!" -ForegroundColor Red
    Write-Host "   文件路径: $envFile" -ForegroundColor Yellow
    Write-Host ""

    $continueResponse = Read-Host "配置完成后按 Enter 继续,或输入 'n' 退出"
    if ($continueResponse -eq 'n') {
        Write-Host "部署已暂停,请配置 .env 后重新运行脚本" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✅ .env 文件已存在" -ForegroundColor Green
}
Write-Host ""

# ====================================================================
# 步骤 8: 安装 PM2 (Windows 版本)
# ====================================================================
Write-Host "[8/10] 安装 PM2 进程管理器..." -ForegroundColor Yellow
try {
    $pm2Version = pm2 --version
    Write-Host "✅ PM2 已安装: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "正在安装 PM2..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ PM2 安装失败!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ PM2 安装成功" -ForegroundColor Green
}
Write-Host ""

# ====================================================================
# 步骤 9: 配置防火墙规则
# ====================================================================
Write-Host "[9/10] 配置 Windows 防火墙..." -ForegroundColor Yellow
$ruleName = "YixinBackend-Port$PORT"

# 检查规则是否已存在
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "⚠️  防火墙规则已存在,跳过创建" -ForegroundColor Yellow
} else {
    Write-Host "正在创建防火墙规则: 允许端口 $PORT" -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName $ruleName `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort $PORT `
                        -Action Allow `
                        -Profile Any `
                        -Description "意心 AI 心理咨询平台后端服务" | Out-Null
    Write-Host "✅ 防火墙规则已创建" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  重要提示:" -ForegroundColor Yellow
Write-Host "   请确保在阿里云控制台的安全组中也开放了端口 $PORT" -ForegroundColor Yellow
Write-Host "   路径: 控制台 -> 轻量应用服务器 -> 实例详情 -> 防火墙 -> 添加规则" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# 步骤 10: 启动后端服务
# ====================================================================
Write-Host "[10/10] 启动后端服务..." -ForegroundColor Yellow

# 停止旧的进程 (如果存在)
pm2 stop $SERVICE_NAME -ErrorAction SilentlyContinue
pm2 delete $SERVICE_NAME -ErrorAction SilentlyContinue

# 启动新进程
Write-Host "正在启动服务..." -ForegroundColor Yellow
pm2 start npm --name $SERVICE_NAME -- run start
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 服务启动失败!" -ForegroundColor Red
    exit 1
}

# 保存 PM2 配置
pm2 save

# 设置开机自启动
Write-Host "配置开机自启动..." -ForegroundColor Yellow
pm2-startup install

Write-Host "✅ 后端服务已启动" -ForegroundColor Green
Write-Host ""

# ====================================================================
# 部署完成
# ====================================================================
Write-Host "================================================" -ForegroundColor Green
Write-Host "  🎉 部署完成!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "服务信息:" -ForegroundColor Cyan
Write-Host "  - 项目目录: $PROJECT_DIR" -ForegroundColor White
Write-Host "  - 服务名称: $SERVICE_NAME" -ForegroundColor White
Write-Host "  - 监听端口: $PORT" -ForegroundColor White
Write-Host "  - API地址: http://8.148.73.181:$PORT/api" -ForegroundColor White
Write-Host "  - 健康检查: http://8.148.73.181:$PORT/api/health" -ForegroundColor White
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Cyan
Write-Host "  查看服务状态:  pm2 status" -ForegroundColor White
Write-Host "  查看日志:      pm2 logs $SERVICE_NAME" -ForegroundColor White
Write-Host "  重启服务:      pm2 restart $SERVICE_NAME" -ForegroundColor White
Write-Host "  停止服务:      pm2 stop $SERVICE_NAME" -ForegroundColor White
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 测试健康检查: curl http://localhost:$PORT/api/health" -ForegroundColor White
Write-Host "  2. 在阿里云控制台开放端口 $PORT" -ForegroundColor White
Write-Host "  3. 配置前端使用新的 API 地址" -ForegroundColor White
Write-Host ""
Write-Host "按任意键查看服务状态..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 显示服务状态
pm2 status
