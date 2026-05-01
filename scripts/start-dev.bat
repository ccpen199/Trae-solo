@echo off
echo ========================================
echo   QA Community System - Development
echo ========================================
echo.

echo [INFO] Checking for .env file...
if not exist "server\.env" (
    echo [INFO] Creating .env file from .env.example...
    copy ".env.example" "server\.env"
)

echo.
echo [INFO] Installing root dependencies...
call npm install

echo.
echo [INFO] Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo [INFO] Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo [INFO] Starting services...
echo.
echo   Available commands:
echo   - npm run dev: Start both server and client
echo   - npm run dev:server: Start only API server
echo   - npm run dev:client: Start only frontend
echo.
echo   Ports:
echo   - API Server: http://localhost:8765
echo   - Frontend:   http://localhost:8766
echo.
echo   Default Accounts:
echo   - Admin:    admin / Admin123!
echo   - Editor:   editor / Editor123!
echo   - Expert:   expert_js / Expert123!
echo   - Expert:   expert_python / Expert123!
echo   - Answerer: answerer_1 / Answer123!
echo   - User:     questioner_1 / Question123!
echo.
echo ========================================
echo.

set /p START="Start services now? (Y/N): "
if /I "%START%"=="Y" (
    echo.
    echo [INFO] Starting services...
    call npm run dev
)
