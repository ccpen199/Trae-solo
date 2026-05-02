#!/bin/bash

echo "=================================="
echo "WMS 仓储管理系统启动脚本"
echo "=================================="

echo ""
echo "端口配置:"
echo "  后端 API:  http://localhost:8888"
echo "  前端页面:  http://localhost:9999"
echo ""

# 启动后端
echo "启动后端服务..."
cd backend
npm install --silent 2>/dev/null
npm run dev &
BACKEND_PID=$!

# 启动前端
echo "启动前端服务..."
cd ../frontend
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================="
echo "服务启动中..."
echo "后端 PID: $BACKEND_PID"
echo "前端 PID: $FRONTEND_PID"
echo "=================================="
echo ""
echo "请访问: http://localhost:9999"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait