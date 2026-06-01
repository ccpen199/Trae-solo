#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
node src/server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端PID: $BACKEND_PID"

sleep 3

echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
node_modules/.bin/vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端PID: $FRONTEND_PID"

sleep 8

echo ""
echo "=== 服务状态 ==="
echo "后端端口 $BACKEND_PORT 监听:"
lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN
echo ""
echo "前端端口 $FRONTEND_PORT 监听:"
lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN

echo ""
echo "=== 访问地址 ==="
echo "前端: http://127.0.0.1:$FRONTEND_PORT/"
echo "后端API: http://127.0.0.1:$BACKEND_PORT/api"
echo "后端健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
