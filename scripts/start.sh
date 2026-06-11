#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  source .env
else
  echo "❌ .env 文件不存在"
  exit 1
fi

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

./scripts/port-manager.sh check

echo "=== 清理当前项目旧进程 ==="
./scripts/port-manager.sh stop-all

echo ""
echo "=== 启动后端服务 ==="
if [ -f backend/server.js ]; then
  nohup "$NODE_BIN" "$PROJECT_DIR/backend/server.js" > "$PROJECT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
  echo "✅ 后端进程启动: PID=$BACKEND_PID"
elif [ -f backend/package.json ]; then
  cd backend
  nohup npm run dev > "$PROJECT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
  echo "✅ 后端进程启动: PID=$BACKEND_PID"
  cd "$PROJECT_DIR"
elif [ -f backend/app.py ]; then
  cd backend
  nohup python app.py > "$PROJECT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo "✅ 后端进程启动: PID=$BACKEND_PID"
  cd "$PROJECT_DIR"
else
  echo "⚠️  未检测到后端项目，跳过后端启动"
fi

sleep 2

echo ""
echo "=== 启动前端服务 ==="
if [ -f frontend/server.js ]; then
  nohup "$NODE_BIN" "$PROJECT_DIR/frontend/server.js" > "$PROJECT_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"
  echo "✅ 前端进程启动: PID=$FRONTEND_PID"
elif [ -f frontend/package.json ]; then
  cd frontend
  nohup npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"
  echo "✅ 前端进程启动: PID=$FRONTEND_PID"
  cd "$PROJECT_DIR"
else
  echo "⚠️  未检测到前端项目，跳过前端启动"
fi

echo ""
echo "⏳ 等待服务启动 (5秒)..."
sleep 5

echo ""
echo "=== 服务验收 ==="
./scripts/verify.sh
