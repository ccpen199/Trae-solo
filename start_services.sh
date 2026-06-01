#!/bin/bash
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=48918
BACKEND_PORT=58918

echo "=== 启动临床用药路径管理系统 ==="
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

# 清理旧进程
cleanup_port() {
  local port=$1
  local pids=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null)
  for pid in $pids; do
    local cwd=$(lsof -p $pid -d cwd 2>/dev/null | tail -1 | awk '{print $NF}')
    if [[ "$cwd" == *"may-68918"* ]] || [[ -z "$cwd" ]]; then
      echo "清理端口 $port 进程: PID $pid"
      kill -9 $pid 2>/dev/null
    fi
  done
}

echo "清理旧进程..."
cleanup_port $FRONTEND_PORT
cleanup_port $BACKEND_PORT
sleep 2

# 启动后端
echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
(node server.js > "$PROJECT_DIR/backend.log" 2>&1 &)
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

sleep 5

# 验证后端
echo ""
echo "验证后端服务..."
if lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ 后端服务启动成功"
  curl -sS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1 && echo "✅ 后端健康检查通过"
else
  echo "❌ 后端服务启动失败"
fi

# 启动前端
echo ""
echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
(node node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &)
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

sleep 15

# 验证前端
echo ""
echo "验证前端服务..."
if lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✅ 前端服务启动成功"
else
  echo "❌ 前端服务启动失败"
fi

echo ""
echo "=== 系统启动完成 ==="
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT/"
echo "后端 API: http://127.0.0.1:$BACKEND_PORT/api"
echo ""
echo "日志文件:"
echo "  - 后端: $PROJECT_DIR/backend.log"
echo "  - 前端: $PROJECT_DIR/frontend.log"
