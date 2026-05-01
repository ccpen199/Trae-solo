<#
.SYNOPSIS
    安装会员积分系统的所有依赖
.DESCRIPTION
    此脚本用于安装后端和前端的所有依赖包
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  会员积分系统 - 依赖安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host "[1/2] 安装后端依赖..." -ForegroundColor Yellow
Set-Location $BackendDir
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "后端依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "后端依赖安装完成" -ForegroundColor Green

Write-Host ""
Write-Host "[2/2] 安装前端依赖..." -ForegroundColor Yellow
Set-Location $FrontendDir
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "前端依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "前端依赖安装完成" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  依赖安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "  1. 启动开发环境: .\start-dev.ps1" -ForegroundColor White
Write-Host "  2. 或手动启动:" -ForegroundColor White
Write-Host "     - 后端: cd backend && npm run dev" -ForegroundColor White
Write-Host "     - 前端: cd frontend && npm run dev" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
