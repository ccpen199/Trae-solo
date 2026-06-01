#!/bin/bash

# 劳动仲裁案件管理系统 - 启动脚本

FRONTEND_PORT=48817
BACKEND_PORT=58817

echo "=================================="
echo "劳动仲裁案件管理系统 - 启动中"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo "=================================="

# 启动后端
echo "启动后端服务..."
cd backend
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 2

# 启动前端
echo "启动前端服务..."
cd ../frontend
npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"

# 等待服务启动
sleep 5

echo ""
echo "=================================="
echo "启动完成！"
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端API:  http://127.0.0.1:$BACKEND_PORT/api"
echo "=================================="
echo ""
echo "后端日志: tail -f backend/backend.log"
echo "前端日志: tail -f frontend/frontend.log"
