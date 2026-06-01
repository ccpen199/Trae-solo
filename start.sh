#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "AI 竞品分析 Agent 启动脚本"
echo "========================================"

check_port() {
  lsof -ti tcp:$1 2>/dev/null
}

echo ""
echo "检查端口占用..."
FRONTEND_PORT=$(grep FRONTEND_PORT "$PROJECT_DIR/.env" | cut -d'=' -f2)
BACKEND_PORT=$(grep BACKEND_PORT "$PROJECT_DIR/.env" | cut -d'=' -f2)

echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"

echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
  echo "安装后端依赖..."
  npm install
fi
nohup npm start > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"

sleep 3

echo ""
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "安装前端依赖..."
  npm install
fi
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"

sleep 5

echo ""
echo "========================================"
echo "服务启动完成！"
echo "========================================"
echo "后端地址: http://127.0.0.1:$BACKEND_PORT"
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "========================================"
echo ""
echo "停止服务请执行:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  或使用: lsof -ti tcp:$BACKEND_PORT -ti tcp:$FRONTEND_PORT | xargs kill"
echo ""
