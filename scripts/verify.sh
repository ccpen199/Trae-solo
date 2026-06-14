#!/bin/bash
set -e

PROJECT_DIR="$(pwd)"
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49090}
BACKEND_PORT=${BACKEND_PORT:-59090}

echo "=== 项目验证脚本 ==="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "=== 进程检查 ==="
if [ -n "$frontend_pid" ]; then
  echo "前端 PID: $frontend_pid"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
  frontend_stat=$(ps -o stat= -p "$frontend_pid" | xargs)
  echo "前端状态: $frontend_stat"
  if [[ "$frontend_stat" == T* ]]; then
    echo "❌ 错误: 前端进程处于停止态 (T)"
    exit 1
  elif [[ "$frontend_stat" == Z* ]]; then
    echo "❌ 错误: 前端进程处于僵尸态 (Z)"
    exit 1
  fi
else
  echo "❌ 错误: 前端端口 $FRONTEND_PORT 无监听"
  exit 1
fi

echo ""
if [ -n "$backend_pid" ]; then
  echo "后端 PID: $backend_pid"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
  backend_stat=$(ps -o stat= -p "$backend_pid" | xargs)
  echo "后端状态: $backend_stat"
  if [[ "$backend_stat" == T* ]]; then
    echo "❌ 错误: 后端进程处于停止态 (T)"
    exit 1
  elif [[ "$backend_stat" == Z* ]]; then
    echo "❌ 错误: 后端进程处于僵尸态 (Z)"
    exit 1
  fi
else
  echo "❌ 错误: 后端端口 $BACKEND_PORT 无监听"
  exit 1
fi

echo ""
echo "=== HTTP 检查 ==="
echo "检查前端首页..."
frontend_http=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
echo "前端 HTTP 状态: $frontend_http"
if [ "$frontend_http" != "200" ]; then
  echo "❌ 错误: 前端首页返回 $frontend_http"
  exit 1
fi

echo "检查后端健康接口..."
backend_http=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
echo "后端 HTTP 状态: $backend_http"
if [ "$backend_http" != "200" ] && [ "$backend_http" != "201" ] && [ "$backend_http" != "301" ] && [ "$backend_http" != "302" ]; then
  echo "❌ 错误: 后端健康接口返回 $backend_http"
  exit 1
fi

echo ""
echo "✅ 所有检查通过！"
echo "前端: http://127.0.0.1:$FRONTEND_PORT"
echo "后端: http://127.0.0.1:$BACKEND_PORT/api/health"
