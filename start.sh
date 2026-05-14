#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo "餐饮App - 扫码点餐平台"
echo "启动时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

echo "[1/4] 清理旧进程..."
pkill -9 -f "node server.js" 2>/dev/null
pkill -9 -f "vite --host 0.0.0.0 --port 19882" 2>/dev/null
sleep 1

echo "[2/4] 启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup node server.js > backend_nohup.log 2>&1 &
sleep 2

if pgrep -f "node server.js" > /dev/null; then
    echo "✅ 后端启动成功"
    echo "   日志: $PROJECT_DIR/backend/backend_nohup.log"
else
    echo "❌ 后端启动失败"
    exit 1
fi

echo "[3/4] 启动前端服务..."
cd "$PROJECT_DIR/frontend"
nohup npx vite --host 0.0.0.0 --port 19882 > frontend_nohup.log 2>&1 &
sleep 3

if pgrep -f "vite --host 0.0.0.0 --port 19882" > /dev/null; then
    echo "✅ 前端启动成功"
    echo "   日志: $PROJECT_DIR/frontend/frontend_nohup.log"
else
    echo "❌ 前端启动失败"
    exit 1
fi

echo "[4/4] 验证服务..."
sleep 2

BACKEND_OK=0
FRONTEND_OK=0

if curl -s http://localhost:19881/api/restaurants/1 > /dev/null 2>&1; then
    BACKEND_OK=1
    echo "✅ 后端API响应正常"
else
    echo "❌ 后端API无响应"
fi

if curl -s http://localhost:19882/ > /dev/null 2>&1; then
    FRONTEND_OK=1
    echo "✅ 前端页面响应正常"
else
    echo "❌ 前端页面无响应"
fi

echo ""
echo "========================================"
if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
    echo "✅ 服务启动完成！"
    echo ""
    echo "前端地址: http://localhost:19882"
    echo "后端地址: http://localhost:19881"
    echo ""
    echo "默认餐厅ID: 1"
    echo "========================================"
    echo ""
    echo "停止服务: ./stop.sh"
    echo ""
    exit 0
else
    echo "❌ 部分服务启动失败"
    echo "========================================"
    exit 1
fi
