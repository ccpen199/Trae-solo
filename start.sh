#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=========================================="
echo "消防接处警系统启动脚本"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

check_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    if [[ "$cwd" == "$PROJECT_DIR"/* ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
      echo "端口 $port 被当前项目进程占用 (PID: $pid)，正在终止..."
      kill "$pid" 2>/dev/null || true
      sleep 2
    else
      echo "警告: 端口 $port 被非当前项目进程占用 (PID: $pid, cwd: $cwd)"
      echo "正在尝试备用端口..."
      return 1
    fi
  fi
  return 0
}

find_available_port() {
  local base=$1
  local tail4=$2
  for slot in 0 1 2 3 4 5; do
    local port=$(( base + slot * 1000 + tail4 ))
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -z "$pid" ]; then
      echo "$port"
      return 0
    fi
  done
  echo "0"
  return 1
}

TAIL4=3443

echo "检查端口占用..."

FRONTEND_AVAILABLE=$(find_available_port 40000 $TAIL4)
BACKEND_AVAILABLE=$(find_available_port 50000 $TAIL4)

if [ "$FRONTEND_AVAILABLE" == "0" ] || [ "$BACKEND_AVAILABLE" == "0" ]; then
  echo "错误: 所有备用端口槽位均被占用，请手动释放端口后重试"
  echo "建议检查端口: 43443, 44443, 45443, 46443, 47443, 48443, 53443, 54443, 55443, 56443, 57443, 58443"
  exit 1
fi

if [ "$FRONTEND_AVAILABLE" != "$FRONTEND_PORT" ] || [ "$BACKEND_AVAILABLE" != "$BACKEND_PORT" ]; then
  echo "更新 .env 端口配置: FRONTEND=$FRONTEND_AVAILABLE, BACKEND=$BACKEND_AVAILABLE"
  sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_AVAILABLE/" .env
  sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_AVAILABLE/" .env
  sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$BACKEND_AVAILABLE/api|" .env
  sed -i '' "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://127.0.0.1:$BACKEND_AVAILABLE/api|" .env
  source .env
fi

check_port $FRONTEND_PORT || true
check_port $BACKEND_PORT || true

echo ""
echo "启动后端服务..."
cd "$PROJECT_DIR/backend"
nohup node server.js > "$PROJECT_DIR/backend.log" 2>&1 < /dev/null &
BACKEND_PID=$!
echo "后端服务已启动，PID: $BACKEND_PID"

echo "启动前端服务..."
cd "$PROJECT_DIR/frontend"
nohup ./node_modules/.bin/vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort --clearScreen false > "$PROJECT_DIR/frontend.log" 2>&1 < /dev/null &
FRONTEND_PID=$!
echo "前端服务已启动，PID: $FRONTEND_PID"

echo ""
echo "等待服务启动 (5秒)..."
sleep 5

echo ""
echo "=========================================="
echo "服务状态检查"
echo "=========================================="

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo ""
echo "前端进程:"
if [ -n "$frontend_pid" ]; then
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "进程不存在"
else
  echo "前端端口无监听，检查 frontend.log"
fi

echo ""
echo "后端进程:"
if [ -n "$backend_pid" ]; then
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "进程不存在"
else
  echo "后端端口无监听，检查 backend.log"
fi

echo ""
echo "HTTP 检查:"
echo -n "前端首页: "
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -n1 || echo "连接失败"

echo -n "后端健康: "
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || echo "连接失败"

echo ""
echo "=========================================="
echo "启动完成！"
echo "前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "后端API:  http://127.0.0.1:$BACKEND_PORT/api"
echo "=========================================="
echo ""
echo "查看日志:"
echo "  前端: tail -f $PROJECT_DIR/frontend.log"
echo "  后端: tail -f $PROJECT_DIR/backend.log"
echo ""
echo "停止服务: ./stop.sh"
