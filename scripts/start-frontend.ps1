Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  分销佣金系统 - 启动脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Write-Host "项目根目录: $projectRoot" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/4] 检查 Node.js 环境..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[2/4] 安装后端依赖..." -ForegroundColor Cyan
Set-Location $backendPath
if (Test-Path "node_modules") {
    Write-Host "后端依赖已存在，跳过安装" -ForegroundColor Yellow
} else {
    Write-Host "正在安装后端依赖..." -ForegroundColor Yellow
    npm install
}
Write-Host ""

Write-Host "[3/4] 安装前端依赖..." -ForegroundColor Cyan
Set-Location $frontendPath
if (Test-Path "node_modules") {
    Write-Host "前端依赖已存在，跳过安装" -ForegroundColor Yellow
} else {
    Write-Host "正在安装前端依赖..." -ForegroundColor Yellow
    npm install
}
Write-Host ""

Write-Host "[4/4] 启动前端开发服务器..." -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  前端服务即将启动" -ForegroundColor Green
Write-Host "  访问地址: http://localhost:9357" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "注意: 后端服务需要单独启动" -ForegroundColor Yellow
Write-Host "后端启动命令:" -ForegroundColor Yellow
Write-Host "  cd backend && npm run dev" -ForegroundColor Yellow
Write-Host ""

Set-Location $frontendPath
npm run dev
