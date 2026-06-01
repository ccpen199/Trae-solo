#!/bin/bash

echo "农村土地经营权流转平台 - 项目启动脚本"
echo "============================================="

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

check_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -i:"$port" >/dev/null 2>&1
    return $?
  elif command -v netstat >/dev/null 2>&1; then
    netstat -an | grep LISTEN | grep ".$port " >/dev/null 2>&1
    return $?
  else
    return 1
  fi
}

get_project_pids() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -i:"$port" -t 2>/dev/null | while read pid; do
      if [ -d "/proc/$pid" ]; then
        local cwd=$(readlink -f "/proc/$pid/cwd" 2>/dev/null || echo "")
        local cmd=$(ps -p "$pid" -o args= 2>/dev/null || echo "")
        if [[ "$cwd" == *"$PROJECT_ROOT"* ]] || [[ "$cmd" == *"$PROJECT_ROOT"* ]]; then
          echo "$pid"
        fi
      fi
    done
  fi
}

kill_project_process() {
  local pid=$1
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "终止项目进程 PID: $pid"
    kill "$pid" 2>/dev/null
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null
    fi
  fi
}

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

SERVER_PORT=${SERVER_PORT:-3000}
VITE_PORT=${VITE_PORT:-5173}

echo ""
echo "检查端口占用..."

if check_port "$SERVER_PORT"; then
  echo "端口 $SERVER_PORT 被占用，检查是否为当前项目进程..."
  pids=$(get_project_pids "$SERVER_PORT")
  if [ -n "$pids" ]; then
    for pid in $pids; do
      kill_project_process "$pid"
    done
    echo "已释放端口 $SERVER_PORT"
  else
    echo "警告: 端口 $SERVER_PORT 被非项目进程占用，请手动处理或修改 .env 中的 SERVER_PORT"
    exit 1
  fi
fi

if check_port "$VITE_PORT"; then
  echo "端口 $VITE_PORT 被占用，检查是否为当前项目进程..."
  pids=$(get_project_pids "$VITE_PORT")
  if [ -n "$pids" ]; then
    for pid in $pids; do
      kill_project_process "$pid"
    done
    echo "已释放端口 $VITE_PORT"
  else
    echo "警告: 端口 $VITE_PORT 被非项目进程占用，请手动处理或修改 .env 中的 VITE_PORT"
    exit 1
  fi
fi

echo ""
echo "安装后端依赖..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "node_modules" ]; then
  npm install
fi

echo ""
echo "初始化数据库..."
npm run init-db

echo ""
echo "安装前端依赖..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi

echo ""
echo "============================================="
echo "启动后端服务..."
cd "$PROJECT_ROOT/backend"
npm start &
BACKEND_PID=$!

echo "后端服务启动中，PID: $BACKEND_PID"
sleep 3

echo ""
echo "启动前端服务..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo "前端服务启动中，PID: $FRONTEND_PID"

echo ""
echo "============================================="
echo "农村土地经营权流转平台启动完成！"
echo "后端地址: http://localhost:$SERVER_PORT"
echo "前端地址: http://localhost:$VITE_PORT"
echo "============================================="

cleanup() {
  echo ""
  echo "正在停止服务..."
  kill_project_process "$BACKEND_PID"
  kill_project_process "$FRONTEND_PID"
  echo "服务已停止"
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
