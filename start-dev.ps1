<#
.SYNOPSIS
    启动会员积分系统开发环境
.DESCRIPTION
    此脚本用于在开发环境中启动会员积分系统的后端和前端服务
    默认端口：
        - 后端: 9876
        - 前端: 9877
#>

param(
    [string]$BackendPort = "9876",
    [string]$FrontendPort = "9877",
    [switch]$InstallDependencies
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  会员积分系统 - 开发环境启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

if ($InstallDependencies) {
    Write-Host "[1/3] 安装后端依赖..." -ForegroundColor Yellow
    Set-Location $BackendDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "后端依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "后端依赖安装完成" -ForegroundColor Green

    Write-Host ""
    Write-Host "[2/3] 安装前端依赖..." -ForegroundColor Yellow
    Set-Location $FrontendDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "前端依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "前端依赖安装完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "[启动服务]" -ForegroundColor Yellow
Write-Host "后端服务端口: $BackendPort" -ForegroundColor Yellow
Write-Host "前端服务端口: $FrontendPort" -ForegroundColor Yellow
Write-Host ""

Write-Host "启动后端服务..." -ForegroundColor Cyan
Write-Host "后端服务地址: http://localhost:$BackendPort" -ForegroundColor Cyan
Write-Host ""

$env:PORT = $BackendPort
$env:FRONTEND_PORT = $FrontendPort

Set-Location $BackendDir
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Start-Sleep -Seconds 3

Write-Host "启动前端服务..." -ForegroundColor Cyan
Write-Host "前端服务地址: http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host ""

Set-Location $FrontendDir
npm run dev

Write-Host "服务已启动" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  服务已启动！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "后端服务: http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "前端服务: http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "健康检查: http://localhost:$BackendPort/health" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
