@echo off
chcp 65001 > nul
echo =========================================
echo 跨境电商店铺管理系统 - 启动脚本
echo =========================================

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

set VITE_BACKEND_PORT=5001

echo.
echo [1/4] 检查后端端口 5001...
netstat -ano | findstr :5001 | findstr LISTENING > nul
if %errorlevel% equ 0 (
    echo   端口 5001 已被占用，将自动分配可用端口
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
        echo   尝试端口 %%a...
    )
) else (
    echo   端口 5001 可用
)

echo.
echo [2/4] 检查前端端口 3001...
netstat -ano | findstr :3001 | findstr LISTENING > nul
if %errorlevel% equ 0 (
    echo   端口 3001 已被占用，将自动分配可用端口
) else (
    echo   端口 3001 可用
)

echo.
echo [3/4] 启动后端服务...
cd /d "%PROJECT_ROOT%backend"
start /b cmd /c "node server.js > backend.log 2>&1"
echo   后端已启动

echo.
echo [4/4] 启动前端服务...
cd /d "%PROJECT_ROOT%"
start /b cmd /c "npm run dev > frontend.log 2>&1"
echo   前端已启动

timeout /t 5 /nobreak > nul

echo.
echo =========================================
echo 系统启动中，请查看上方日志
echo =========================================
echo.
echo 按任意键打开浏览器...
pause > nul
start http://localhost:3001

echo.
echo 按 Ctrl+C 停止服务
echo =========================================

wait