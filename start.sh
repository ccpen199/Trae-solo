#!/bin/bash

echo "========================================"
echo "  智能视频监控与告警协同平台"
echo "========================================"
echo ""

PROJECT_DIR="$( cd "$( dirname "$0" )" && pwd )"

echo "[1/4] 安装后端依赖..."
cd "$PROJECT_DIR/server"
if [ ! -d "node_modules" ]; then
  npm install --registry=https://registry.npmmirror.com
  if [ $? -ne 0 ]; then
    echo "后端依赖安装失败，正在尝试官方源..."
    npm install
  fi
else
  echo "后端依赖已存在，跳过安装"
fi

echo ""
echo "[2/4] 安装前端依赖..."
cd "$PROJECT_DIR/client"
if [ ! -d "node_modules" ]; then
  npm install --registry=https://registry.npmmirror.com
  if [ $? -ne 0 ]; then
    echo "前端依赖安装失败，正在尝试官方源..."
    npm install
  fi
else
  echo "前端依赖已存在，跳过安装"
fi

echo ""
echo "[3/4] 启动后端服务 (端口 3001/3002)..."
cd "$PROJECT_DIR/server"
mkdir -p data uploads uploads/records uploads/snapshots
node src/app.js &
SERVER_PID=$!
echo "后端服务 PID: $SERVER_PID"

sleep 3

echo ""
echo "[4/4] 启动前端服务 (端口 5173)..."
cd "$PROJECT_DIR/client"
npm run dev &
CLIENT_PID=$!
echo "前端服务 PID: $CLIENT_PID"

echo ""
echo "========================================"
echo "✅ 服务启动完成！"
echo "   前端地址: http://localhost:5173"
echo "   后端API:  http://localhost:3001/api"
echo "   WebSocket: ws://localhost:3002"
echo ""
echo "   默认账号: admin / admin123456"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "echo '正在停止服务...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM

wait
