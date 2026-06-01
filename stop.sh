#!/bin/bash

cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43361}
BACKEND_PORT=${BACKEND_PORT:-53361}

check_port() {
  local port=$1
  lsof -ti tcp:$port 2>/dev/null | head -1
}

is_project_pid() {
  local pid=$1
  local cwd=$(ps -p $pid -o cwd= 2>/dev/null | xargs 2>/dev/null)
  local cmd=$(ps -p $pid -o command= 2>/dev/null)
  if [[ "$cwd" == *"$PROJECT_DIR"* ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
    return 0
  fi
  return 1
}

echo "========================================"
echo "  停止 AI采购谈判助手 服务"
echo "========================================"
echo ""

echo "检查前端服务 (端口: $FRONTEND_PORT)..."
FRONTEND_PID=$(check_port $FRONTEND_PORT)
if [ -n "$FRONTEND_PID" ] && is_project_pid $FRONTEND_PID; then
  echo "终止前端进程 PID: $FRONTEND_PID"
  kill $FRONTEND_PID 2>/dev/null
  sleep 1
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "强制终止前端进程"
    kill -9 $FRONTEND_PID 2>/dev/null
  fi
  echo "前端服务已停止"
else
  echo "前端服务未运行"
fi

echo ""
echo "检查后端服务 (端口: $BACKEND_PORT)..."
BACKEND_PID=$(check_port $BACKEND_PORT)
if [ -n "$BACKEND_PID" ] && is_project_pid $BACKEND_PID; then
  echo "终止后端进程 PID: $BACKEND_PID"
  kill $BACKEND_PID 2>/dev/null
  sleep 1
  if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "强制终止后端进程"
    kill -9 $BACKEND_PID 2>/dev/null
  fi
  echo "后端服务已停止"
else
  echo "后端服务未运行"
fi

echo ""
echo "========================================"
echo "  服务停止完成"
echo "========================================"
