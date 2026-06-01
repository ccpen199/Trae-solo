#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  AI 数据异常解释 Agent - 服务启动"
echo "========================================"

echo ""
echo "[1/2] 检查端口占用..."
FRONTEND_PORT=43378
BACKEND_PORT=53378

if lsof -ti tcp:$FRONTEND_PORT > /dev/null 2>&1; then
  echo "  - 前端端口 $FRONTEND_PORT 已占用，正在清理..."
  kill -9 $(lsof -ti tcp:$FRONTEND_PORT) 2>/dev/null
  sleep 1
fi

if lsof -ti tcp:$BACKEND_PORT > /dev/null 2>&1; then
  echo "  - 后端端口 $BACKEND_PORT 已占用，正在清理..."
  kill -9 $(lsof -ti tcp:$BACKEND_PORT) 2>/dev/null
  sleep 1
fi

echo ""
echo "[2/2] 启动服务..."

echo ""
echo "启动后端服务 (端口: $BACKEND_PORT)..."
cd backend
node src/server.js > server.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "启动前端服务 (端口: $FRONTEND_PORT)..."
cd frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  服务启动完成！"
echo "========================================"
echo ""
echo "后端 PID: $BACKEND_PID"
echo "前端 PID: $FRONTEND_PID"
echo ""
echo "访问地址:"
echo "  - 前端: http://127.0.0.1:$FRONTEND_PORT"
echo "  - 后端: http://127.0.0.1:$BACKEND_PORT"
echo ""
echo "停止服务: ./stop_services.sh"
echo ""

echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid
