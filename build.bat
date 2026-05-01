@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   短信营销与通知平台 - 启动脚本
echo ========================================
echo.

echo [1/4] 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm
    exit /b 1
)

echo [OK] Node.js 环境已就绪
echo.

echo [2/4] 安装依赖...
if not exist "node_modules" (
    echo 正在安装根目录依赖...
    npm install
)

if not exist "shared\node_modules" (
    echo 正在安装 shared 模块依赖...
    cd shared
    npm install
    cd ..
)

echo 正在构建 shared 模块...
cd shared
npm run build
if %errorlevel% neq 0 (
    echo [错误] shared 模块构建失败
    exit /b 1
)
cd ..

echo [OK] 依赖安装完成
echo.

echo [3/4] 构建后端服务...
for %%s in (gateway-service template-service sms-sender-service routing-engine frequency-engine receipt-engine compliance-engine audit-service finance-service) do (
    if exist "services\%%s\src" (
        echo 正在构建 %%s...
        cd services\%%s
        if not exist "node_modules" (
            npm install
        )
        npm run build
        if %errorlevel% neq 0 (
            echo [警告] %%s 构建失败，但继续执行...
        )
        cd ..\..
    )
)

echo [OK] 后端服务构建完成
echo.

echo [4/4] 构建前端...
cd web-portal
if not exist "node_modules" (
    echo 正在安装前端依赖...
    npm install
)
echo 正在构建前端...
npm run build
if %errorlevel% neq 0 (
    echo [警告] 前端构建失败
)
cd ..

echo.
echo ========================================
echo   构建完成！
echo ========================================
echo.
echo 使用说明：
echo 1. 确保 MySQL 和 Redis 已启动，或运行: docker-compose up -d
echo 2. 启动所有服务: npm run start:all
echo 3. 或单独启动:
echo    - 网关服务: npm run start:gateway
echo    - 模板服务: npm run start:template
echo    - 短信发送服务: npm run start:sender
echo    - 路由引擎: npm run start:routing
echo    - 频控引擎: npm run start:frequency
echo    - 回执解析引擎: npm run start:receipt
echo    - 合规过滤引擎: npm run start:compliance
echo    - 审计服务: npm run start:audit
echo    - 财务服务: npm run start:finance
echo    - 前端: npm run start:web
echo.
echo 数据库信息：
echo   - 主机: localhost
echo   - 端口: 3306
echo   - 用户名: sms_admin
echo   - 密码: SmsAdmin@2024
echo   - 数据库: sms_platform
echo.
echo Redis 信息：
echo   - 主机: localhost
echo   - 端口: 6379
echo   - 密码: (无)
echo.
echo 测试账号：
echo   - 运营人员: operator / password123
echo   - 开发者: developer / password123
echo   - 财务人员: finance / password123
echo   - 管理员: admin / password123
echo.
pause
