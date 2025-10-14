# ====================================================================
# 意心 AI 心理咨询平台 - 环境变量配置向导
# ====================================================================
#
# 用途: 交互式配置 .env 文件
# ====================================================================

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  意心 AI - 环境变量配置向导" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env"

# 如果已存在,询问是否覆盖
if (Test-Path $envFile) {
    Write-Host "⚠️  .env 文件已存在" -ForegroundColor Yellow
    $overwrite = Read-Host "是否覆盖? (y/n)"
    if ($overwrite -ne 'y') {
        Write-Host "退出配置向导" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "请输入以下配置信息:" -ForegroundColor Yellow
Write-Host "(按 Enter 使用默认值)" -ForegroundColor Gray
Write-Host ""

# 收集配置
$config = @{}

# 端口
Write-Host ">> 后端服务端口 [默认: 3000]:" -ForegroundColor Cyan -NoNewline
$port = Read-Host " "
$config['PORT'] = if ($port) { $port } else { "3000" }

# Supabase URL
Write-Host ">> Supabase 项目 URL:" -ForegroundColor Cyan -NoNewline
$config['SB_URL'] = Read-Host " "

# Supabase Anon Key
Write-Host ">> Supabase 匿名密钥 (ANON_KEY):" -ForegroundColor Cyan -NoNewline
$config['SB_ANON_KEY'] = Read-Host " "

# Supabase Service Role Key
Write-Host ">> Supabase 服务密钥 (SERVICE_ROLE_KEY):" -ForegroundColor Cyan -NoNewline
$config['SB_SERVICE_ROLE_KEY'] = Read-Host " "

# JWT Secret
Write-Host ">> JWT 密钥 [默认: 自动生成]:" -ForegroundColor Cyan -NoNewline
$jwtSecret = Read-Host " "
if (-not $jwtSecret) {
    # 生成随机密钥
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [System.Convert]::ToBase64String($bytes)
    Write-Host "   已生成随机密钥" -ForegroundColor Green
}
$config['JWT_SECRET'] = $jwtSecret

# Client Origins
Write-Host ">> 允许的前端域名 [默认: https://yinxintest99.edgeone.app]:" -ForegroundColor Cyan -NoNewline
$origins = Read-Host " "
$config['CLIENT_ORIGINS'] = if ($origins) { $origins } else { "https://yinxintest99.edgeone.app" }

# 阿里云百炼 API (可选)
Write-Host ""
Write-Host ">> 阿里云百炼 API 密钥 (可选,按 Enter 跳过):" -ForegroundColor Cyan -NoNewline
$config['BAILIAN_API_KEY'] = Read-Host " "

Write-Host ">> 阿里云百炼 API 端点 [默认: https://dashscope.aliyuncs.com]:" -ForegroundColor Cyan -NoNewline
$bailianEndpoint = Read-Host " "
$config['BAILIAN_ENDPOINT'] = if ($bailianEndpoint) { $bailianEndpoint } else { "https://dashscope.aliyuncs.com" }

# 生成 .env 内容
$envContent = @"
# ====================================================================
# 意心 AI 心理咨询平台 - 生产环境配置
# 生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ====================================================================

# 环境设置
NODE_ENV=production
PORT=$($config['PORT'])

# Supabase 配置
SB_URL=$($config['SB_URL'])
SB_ANON_KEY=$($config['SB_ANON_KEY'])
SB_SERVICE_ROLE_KEY=$($config['SB_SERVICE_ROLE_KEY'])

# 前端同步配置 (确保与前端一致)
VITE_SB_URL=$($config['SB_URL'])
VITE_SB_ANON_KEY=$($config['SB_ANON_KEY'])

# JWT 密钥
JWT_SECRET=$($config['JWT_SECRET'])

# CORS 允许的前端域名
CLIENT_ORIGINS=$($config['CLIENT_ORIGINS'])

# 阿里云百炼 API
BAILIAN_API_KEY=$($config['BAILIAN_API_KEY'])
BAILIAN_ENDPOINT=$($config['BAILIAN_ENDPOINT'])

# 阿里云语音 API (可选)
ALIBABA_VOICE_API_KEY=
ALIBABA_VOICE_API_URL=

# 部署钩子 URL (可选)
BACKEND_DEPLOY_HOOK_URL=
FRONTEND_DEPLOY_HOOK_URL=
"@

# 写入文件
Set-Content -Path $envFile -Value $envContent

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  ✅ 配置完成!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host ".env 文件已创建: $((Get-Location).Path)\$envFile" -ForegroundColor White
Write-Host ""
Write-Host "下一步: 运行部署脚本" -ForegroundColor Yellow
Write-Host "  .\deploy-windows.ps1" -ForegroundColor Cyan
Write-Host ""
