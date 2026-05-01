#!/usr/bin/env pwsh

# 优惠券营销系统 - 启动脚本
# 适用于 Windows PowerShell 5.1 和 PowerShell 7+

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  优惠券营销系统 - 启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 检查必要工具
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

$missingTools = @()

if (-not (Test-Command "docker")) {
    $missingTools += "Docker Desktop"
}

if (-not (Test-Command "node")) {
    $missingTools += "Node.js"
}

if (-not (Test-Command "npm")) {
    $missingTools += "npm"
}

if ($missingTools.Count -gt 0) {
    Write-Host "错误：缺少以下必需工具：" -ForegroundColor Red
    foreach ($tool in $missingTools) {
        Write-Host "  - $tool" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "请先安装以上工具后重试" -ForegroundColor Red
    exit 1
}

# 检查 Docker 服务状态
Write-Host "[1/5] 检查 Docker 服务状态..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "Docker 服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "错误：Docker 服务未运行，请启动 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 检查端口
Write-Host ""
Write-Host "[2/5] 检查端口占用..." -ForegroundColor Yellow

$portsToCheck = @(25432, 26379, 28443, 28080)

foreach ($port in $portsToCheck) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "警告：端口 $port 已被占用" -ForegroundColor Yellow
        Write-Host "  系统将自动尝试寻找可用端口" -ForegroundColor Gray
    } else {
        Write-Host "端口 $port 可用" -ForegroundColor Green
    }
}

# 启动数据库服务
Write-Host ""
Write-Host "[3/5] 启动数据库服务 (PostgreSQL + Redis)..." -ForegroundColor Yellow

Write-Host "使用 Docker Compose 启动数据库容器..." -ForegroundColor Gray
docker-compose up -d

Write-Host "等待数据库初始化完成..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 检查容器状态
$containers = docker-compose ps --format json | ConvertFrom-Json
if ($containers -and $containers.State -eq "running") {
    Write-Host "数据库服务启动成功" -ForegroundColor Green
} else {
    Write-Host "警告：部分容器可能未完全启动，请稍后检查" -ForegroundColor Yellow
}

# 安装依赖
Write-Host ""
Write-Host "[4/5] 安装项目依赖..." -ForegroundColor Yellow

# 后端依赖
Write-Host "安装后端依赖 (server)..." -ForegroundColor Gray
Push-Location server
npm install
Pop-Location

# 前端依赖
Write-Host "安装前端依赖 (client)..." -ForegroundColor Gray
Push-Location client
npm install
Pop-Location

Write-Host "依赖安装完成" -ForegroundColor Green

# 启动服务
Write-Host ""
Write-Host "[5/5] 启动应用服务..." -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  服务启动信息" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "数据库服务：" -ForegroundColor White
Write-Host "  - PostgreSQL: localhost:25432" -ForegroundColor Gray
Write-Host "  - Redis:      localhost:26379" -ForegroundColor Gray
Write-Host ""
Write-Host "应用服务（需要手动启动）：" -ForegroundColor White
Write-Host "  - 后端 API:   端口 28443 (运行: cd server && npm run dev)" -ForegroundColor Gray
Write-Host "  - 前端 Web:   端口 28080 (运行: cd client && npm run dev)" -ForegroundColor Gray
Write-Host ""
Write-Host "默认账号：" -ForegroundColor White
Write-Host "  - Admin:    admin / Admin@123" -ForegroundColor Gray
Write-Host "  - Operator: operator / Operator@123" -ForegroundColor Gray
Write-Host "  - Merchant: merchant / Merchant@123" -ForegroundColor Gray
Write-Host "  - Finance:  finance / Finance@123" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "提示：" -ForegroundColor Yellow
Write-Host "  1. 请打开新的终端窗口，分别运行后端和前端服务" -ForegroundColor Gray
Write-Host "  2. 后端: cd server && npm run dev" -ForegroundColor Gray
Write-Host "  3. 前端: cd client && npm run dev" -ForegroundColor Gray
Write-Host "  4. 访问前端地址: http://localhost:28080" -ForegroundColor Gray
Write-Host ""

# 询问是否直接启动服务
$startNow = Read-Host "是否立即启动后端服务? (y/N)"
if ($startNow -eq 'y' -or $startNow -eq 'Y') {
    Write-Host "启动后端服务..." -ForegroundColor Yellow
    Push-Location server
    npm run dev
}
