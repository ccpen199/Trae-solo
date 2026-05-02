#!/bin/bash

echo "========================================="
echo "跨境电商店铺管理系统 - 启动脚本"
echo "========================================="

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

export VITE_BACKEND_PORT=5001

check_port() {
  local port=$1
  if lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

find_available_port() {
  local start_port=$1
  local port=$start_port
  while [ $port -lt $((start_port + 100)) ]; do
    if ! check_port $port; then
      echo $port
      return 0
    fi
    echo "  端口 $port 已被占用，尝试 $((port + 1))..." >&2
    port=$((port + 1))
  done
  echo "无法在 $start_port-$((start_port + 100)) 范围内找到可用端口" >&2
  return 1
}

echo ""
echo "[1/4] 检查后端端口 5001..."
if check_port 5001; then
  echo "  端口 5001 已被占用，寻找可用端口..."
  BACKEND_PORT=$(find_available_port 5001)
  export VITE_BACKEND_PORT=$BACKEND_PORT
  echo "  ✓ 后端将使用端口: $BACKEND_PORT"
else
  echo "  ✓ 端口 5001 可用"
  BACKEND_PORT=5001
fi

echo ""
echo "[2/4] 检查前端端口 3001..."
if check_port 3001; then
  echo "  端口 3001 已被占用，寻找可用端口..."
  FRONTEND_PORT=$(find_available_port 3001)
  export VITE_FRONTEND_PORT=$FRONTEND_PORT
  echo "  ✓ 前端将使用端口: $FRONTEND_PORT"
else
  echo "  ✓ 端口 3001 可用"
  FRONTEND_PORT=3001
fi

echo ""
echo "[3/4] 启动后端服务..."
cd "$PROJECT_ROOT/backend"
export VITE_FRONTEND_PORT=$FRONTEND_PORT
node server.js &
BACKEND_PID=$!
echo "  后端进程ID: $BACKEND_PID"
sleep 3

echo ""
echo "[4/4] 启动前端服务..."
cd "$PROJECT_ROOT"
export VITE_FRONTEND_PORT=$FRONTEND_PORT
npm run dev &
FRONTEND_PID=$!
echo "  前端进程ID: $FRONTEND_PID"

sleep 5

echo ""
echo "========================================="
echo "✅ 系统启动完成！"
echo "========================================="
echo ""
echo "📍 访问地址:"
echo "   前端: http://localhost:$FRONTEND_PORT"
echo "   后端: http://localhost:$BACKEND_PORT"
echo ""
echo "🔐 测试账号:"
echo "   - operation / password123 (运营)"
echo "   - purchase / password123 (采购)"
echo "   - warehouse / password123 (仓库)"
echo "   - customer_service / password123 (客服)"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================================="

cleanup() {
  echo ""
  echo "正在停止服务..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo "已停止所有服务"
  exit 0
}

trap cleanup SIGINT SIGTERM

wait