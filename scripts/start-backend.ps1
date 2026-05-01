Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  分销佣金系统 - 后端启动脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"

Write-Host "后端目录: $backendPath" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/3] 检查 Node.js 环境..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[2/3] 安装依赖..." -ForegroundColor Cyan
Set-Location $backendPath
if (Test-Path "node_modules") {
    Write-Host "依赖已存在，跳过安装" -ForegroundColor Yellow
} else {
    Write-Host "正在安装依赖..." -ForegroundColor Yellow
    npm install
    Write-Host "生成 Prisma 客户端..." -ForegroundColor Yellow
    npm run prisma:generate
}
Write-Host ""

Write-Host "[3/3] 启动后端开发服务器..." -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  后端服务即将启动" -ForegroundColor Green
Write-Host "  API 地址: http://localhost:8472/api/v1" -ForegroundColor Green
Write-Host "  健康检查: http://localhost:8472/api/v1/health" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "注意: 请确保 PostgreSQL 和 Redis 已启动" -ForegroundColor Yellow
Write-Host "数据库配置:" -ForegroundColor Yellow
Write-Host "  Host: localhost:5432" -ForegroundColor Yellow
Write-Host "  Database: dist_commission" -ForegroundColor Yellow
Write-Host "  User: dist_admin" -ForegroundColor Yellow
Write-Host ""

Set-Location $backendPath
npm run dev
