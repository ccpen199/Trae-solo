@echo off
echo ========================================
echo   邮件营销系统 - 启动脚本
echo ========================================
echo.

echo [1/4] 检查依赖...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo [信息] 检测到 Docker，可以使用 docker-compose 部署
) else (
    echo [警告] 未检测到 Docker，将使用本地开发模式
)

echo.
echo [2/4] 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    exit /b 1
)
cd ..

echo.
echo [3/4] 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    exit /b 1
)
cd ..

echo.
echo [4/4] 生成 Prisma 客户端...
cd backend
call npx prisma generate
cd ..

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 端口分配:
echo   - 后端 API:  47291
echo   - 前端 Web:  47292
echo   - Redis:     47293
echo   - PostgreSQL:47294
echo   - Mock邮件:  47295
echo   - 预览后端:  47296
echo   - 预览前端:  47297
echo   - 测试后端:  47298
echo   - 测试前端:  47299
echo.
echo 使用方式:
echo   1. 开发模式 (前后端同时启动):
echo      npm run dev
echo.
echo   2. 仅启动后端:
echo      cd backend && npm run dev
echo.
echo   3. 仅启动前端:
echo      cd frontend && npm run dev
echo.
echo   4. Docker 部署:
echo      docker-compose up -d
echo.
echo 默认管理员账户:
echo   - 邮箱: admin@example.com
echo   - 密码: Admin@2024
echo.
pause
