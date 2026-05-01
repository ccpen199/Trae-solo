Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  分销佣金系统 - 完整启动指南" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "快速启动步骤:" -ForegroundColor Yellow
Write-Host ""
Write-Host "方式一: 使用 Docker (推荐)" -ForegroundColor Green
Write-Host "  1. 启动数据库和缓存:" -ForegroundColor White
Write-Host "     docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. 启动后端 (新终端):" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Cyan
Write-Host "     npm install" -ForegroundColor Cyan
Write-Host "     npm run prisma:generate" -ForegroundColor Cyan
Write-Host "     npm run prisma:push" -ForegroundColor Cyan
Write-Host "     npm run prisma:seed  (可选: 导入测试数据)" -ForegroundColor Cyan
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. 启动前端 (新终端):" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Cyan
Write-Host "     npm install" -ForegroundColor Cyan
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "方式二: 使用 PowerShell 脚本" -ForegroundColor Green
Write-Host "  1. 启动后端:" -ForegroundColor White
Write-Host "     .\scripts\start-backend.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. 启动前端:" -ForegroundColor White
Write-Host "     .\scripts\start-frontend.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  访问地址" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "前端界面:  http://localhost:9357" -ForegroundColor Green
Write-Host "后端 API:  http://localhost:8472/api/v1" -ForegroundColor Green
Write-Host "健康检查:  http://localhost:8472/api/v1/health" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  测试账号" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "管理员:   13800138000 / 123456" -ForegroundColor Yellow
Write-Host "财务:     13800138001 / 123456" -ForegroundColor Yellow
Write-Host "运营:     13800138002 / 123456" -ForegroundColor Yellow
Write-Host "分销员A:  13900139001 / 123456" -ForegroundColor Yellow
Write-Host "分销员B:  13900139002 / 123456" -ForegroundColor Yellow
Write-Host "普通用户: 13700137001 / 123456" -ForegroundColor Yellow
Write-Host ""
