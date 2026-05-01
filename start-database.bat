@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   短信营销与通知平台
echo   启动数据库和中间件服务
echo ========================================
echo.

echo 检查 Docker...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Docker，请先安装 Docker Desktop
    exit /b 1
)

echo 检查 Docker Compose...
where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo [信息] 使用 docker compose 命令
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)

echo.
echo [1/3] 启动 MySQL...
echo [MySQL] 主机: localhost
echo [MySQL] 端口: 3306
echo [MySQL] 用户名: root / sms_admin
echo [MySQL] 密码: SmsRoot@2024 / SmsAdmin@2024
echo [MySQL] 数据库: sms_platform
echo.

echo [2/3] 启动 Redis...
echo [Redis] 主机: localhost
echo [Redis] 端口: 6379
echo [Redis] 密码: (无)
echo.

echo [3/3] 启动服务...
%COMPOSE_CMD% up -d

echo.
echo 等待服务启动...
timeout /t 10 /nobreak >nul

echo.
echo 检查服务状态...
%COMPOSE_CMD% ps

echo.
echo ========================================
echo   数据库和中间件已启动！
echo ========================================
echo.
echo 服务信息：
echo.
echo MySQL:
echo   主机: localhost
echo   端口: 3306
echo   root密码: SmsRoot@2024
echo   用户名: sms_admin
echo   密码: SmsAdmin@2024
echo   数据库: sms_platform
echo.
echo Redis:
echo   主机: localhost
echo   端口: 6379
echo   密码: (无)
echo.
echo 接下来请运行 build.bat 构建项目，然后启动各个服务
echo.
pause
