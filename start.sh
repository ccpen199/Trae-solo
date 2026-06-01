#!/bin/bash
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"
source .env

echo "🚀 启动酒吧库存管理系统..."
echo "📍 前端端口: $FRONTEND_PORT"
echo "📍 后端端口: $BACKEND_PORT"

echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup node src/server.js > "$PROJECT_DIR/backend.log" 2>&1 </dev/null &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

echo ""
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
sleep 3
nohup npx vite --host 127.0.0.1 > "$PROJECT_DIR/frontend.log" 2>&1 </dev/null &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

echo ""
echo "⏳ 等待服务启动..."
sleep 8

echo ""
echo "✅ 服务启动完成!"
echo "🌐 前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "🔧 后端API:  http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "📝 日志文件:"
echo "   前端: $PROJECT_DIR/frontend.log"
echo "   后端: $PROJECT_DIR/backend.log"
