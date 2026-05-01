Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  分销佣金系统 - 一键启动" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"

Write-Host "项目目录: $frontendPath" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/3] 检查依赖是否已安装..." -ForegroundColor Cyan
Set-Location $frontendPath
if (-not (Test-Path "node_modules")) {
    Write-Host "安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "依赖安装失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "依赖已安装" -ForegroundColor Green
}
Write-Host ""

Write-Host "[2/3] 检查 @element-plus/icons-vue..." -ForegroundColor Cyan
$iconsModule = Join-Path $frontendPath "node_modules\@element-plus\icons-vue"
if (-not (Test-Path $iconsModule)) {
    Write-Host "安装图标依赖..." -ForegroundColor Yellow
    npm install @element-plus/icons-vue@^2.3.1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "图标依赖安装失败！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "图标依赖已安装" -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/3] 启动前端开发服务器..." -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  前端服务即将启动" -ForegroundColor Green
Write-Host "  访问地址: http://localhost:9357" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

npm run dev
