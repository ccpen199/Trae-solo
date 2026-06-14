#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
FRONTEND_LOG="$PROJECT_DIR/frontend.log"
BACKEND_LOG="$PROJECT_DIR/backend.log"
ORDER_NAME="$(basename "$PROJECT_DIR")"
FRONTEND_SESSION="${ORDER_NAME}-frontend"
BACKEND_SESSION="${ORDER_NAME}-backend"

echo "========================================"
echo " 建筑业劳务供需智能撮合平台 - 启动脚本"
echo "========================================"
echo ""

cd "$PROJECT_DIR"

echo "[1/5] 初始化端口配置..."
bash "$PROJECT_DIR/scripts/port-manager.sh" init
echo ""

set -a
source "$ENV_FILE"
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

start_detached() {
  local session=$1
  local cwd=$2
  local runner=$3

  if command -v tmux >/dev/null 2>&1; then
    tmux kill-session -t "$session" 2>/dev/null || true
    tmux new-session -d -s "$session" -c "$cwd" "bash \"$runner\""
  else
    (
      cd "$cwd"
      nohup bash "$runner" >/dev/null 2>&1 &
    )
  fi
}

echo "[2/5] 清理旧日志..."
> "$FRONTEND_LOG"
> "$BACKEND_LOG"
echo "  ✓ 日志已清空"
echo ""

echo "[3/5] 启动后端服务 (端口: $BACKEND_PORT)..."
start_detached "$BACKEND_SESSION" "$PROJECT_DIR/backend" "$PROJECT_DIR/scripts/run-backend.sh"
BACKEND_PID=""
echo "  ✓ 后端后台会话已启动 ($BACKEND_SESSION)"
echo "  ✓ 后端日志: $BACKEND_LOG"
echo ""

echo "[4/5] 启动前端服务 (端口: $FRONTEND_PORT)..."
start_detached "$FRONTEND_SESSION" "$PROJECT_DIR/frontend" "$PROJECT_DIR/scripts/run-frontend.sh"
FRONTEND_PID=""
echo "  ✓ 前端后台会话已启动 ($FRONTEND_SESSION)"
echo "  ✓ 前端日志: $FRONTEND_LOG"
echo ""

echo "[5/5] 等待服务启动并验证..."
wait_for_port() {
  local port=$1
  local label=$2
  local i
  for i in $(seq 1 40); do
    if lsof -nP -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
      echo "  ✓ $label 端口 $port 已监听"
      return 0
    fi
    sleep 1
  done
  echo "  ✗ $label 端口 $port 等待超时"
  return 1
}

wait_for_port "$BACKEND_PORT" "后端" || true
wait_for_port "$FRONTEND_PORT" "前端" || true
echo ""

verify_service() {
  local name=$1
  local port=$2
  local url=$3
  local pid=$4
  
  echo "  验证 $name (端口: $port, PID: $pid)..."
  
  if ! lsof -nP -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
    echo "    ✗ 端口 $port 无监听"
    return 1
  fi
  echo "    ✓ 端口监听正常"
  
  local stat=""
  if [ -n "$pid" ]; then
    stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs)
  fi
  if [ -z "$stat" ] || [ "$stat" = "T" ] || [ "$stat" = "Z" ]; then
    echo "    ✗ 进程状态异常 (stat: $stat)"
    return 1
  fi
  echo "    ✓ 进程状态正常 (stat: $stat)"
  
  local response=$(curl -I --max-time 5 --silent --output /dev/null --write-out "%{http_code}" "$url")
  if [ "$response" != "200" ] && [ "$response" != "304" ] && [ "$response" != "301" ] && [ "$response" != "302" ]; then
    echo "    ✗ HTTP 响应异常 (code: $response)"
    return 1
  fi
  echo "    ✓ HTTP 响应正常 (code: $response)"
  
  return 0
}

ALL_OK=true

echo ""
echo "  验证后端服务..."
backend_listen_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if ! verify_service "后端" "$BACKEND_PORT" "http://127.0.0.1:$BACKEND_PORT/api/health" "$backend_listen_pid"; then
  ALL_OK=false
  echo "    后端日志尾部:"
  tail -20 "$BACKEND_LOG" | sed 's/^/      /'
fi

echo ""
echo "  验证前端服务..."
frontend_listen_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if ! verify_service "前端" "$FRONTEND_PORT" "http://127.0.0.1:$FRONTEND_PORT/" "$frontend_listen_pid"; then
  ALL_OK=false
  echo "    前端日志尾部:"
  tail -20 "$FRONTEND_LOG" | sed 's/^/      /'
fi

echo ""
echo "========================================"
if [ "$ALL_OK" = true ]; then
  echo "  ✓ 所有服务启动成功！"
  echo ""
  echo "  访问地址:"
  echo "    前端: http://127.0.0.1:$FRONTEND_PORT/"
  echo "    后端API: http://127.0.0.1:$BACKEND_PORT/api"
  echo "    健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
  echo ""
  echo "  进程信息:"
  echo "    前端 PID: ${frontend_listen_pid:-$FRONTEND_PID}"
  echo "    后端 PID: ${backend_listen_pid:-$BACKEND_PID}"
  echo ""
  echo "  日志文件:"
  echo "    前端: tail -f $FRONTEND_LOG"
  echo "    后端: tail -f $BACKEND_LOG"
  echo ""
  echo "  停止服务: bash scripts/stop.sh"
  echo "========================================"
  
  echo "$frontend_listen_pid" > "$PROJECT_DIR/.frontend.pid"
  echo "$backend_listen_pid" > "$PROJECT_DIR/.backend.pid"
  exit 0
else
  echo "  ✗ 服务启动失败，请检查日志"
  echo "========================================"
  exit 1
fi
