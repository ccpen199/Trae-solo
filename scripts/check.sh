#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43448}
BACKEND_PORT=${BACKEND_PORT:-53448}

echo "========================================="
echo "项目服务状态检查"
echo "========================================="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

if [ -n "$frontend_pid" ]; then
  echo "前端进程 PID: $frontend_pid"
  frontend_cwd=$(lsof -a -p "$frontend_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "进程不存在"
  echo "cwd: $frontend_cwd"

  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  if [[ "$frontend_stat" == *T* ]] || [[ "$frontend_stat" == *Z* ]]; then
    echo "警告: 前端进程状态异常 - $frontend_stat"
  fi

  echo "前端 HTTP 状态:"
  curl -sS -o /dev/null -w "HTTP %{http_code}\n" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/"
else
  echo "警告: 前端服务未启动或端口未监听"
fi

echo ""

if [ -n "$backend_pid" ]; then
  echo "后端进程 PID: $backend_pid"
  backend_cwd=$(lsof -a -p "$backend_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "进程不存在"
  echo "cwd: $backend_cwd"

  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  if [[ "$backend_stat" == *T* ]] || [[ "$backend_stat" == *Z* ]]; then
    echo "警告: 后端进程状态异常 - $backend_stat"
  fi

  echo "后端健康检查:"
  curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1
  echo ""
else
  echo "警告: 后端服务未启动或端口未监听"
fi

echo ""
echo "========================================="
