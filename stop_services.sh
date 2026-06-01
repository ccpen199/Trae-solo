#!/bin/bash
cd "$(dirname "$0")"

echo "正在停止服务..."

if [ -f .backend.pid ]; then
  BACKEND_PID=$(cat .backend.pid)
  if kill -0 $BACKEND_PID 2>/dev/null; then
    kill $BACKEND_PID 2>/dev/null
    echo "后端服务已停止 (PID: $BACKEND_PID)"
  fi
  rm -f .backend.pid
fi

if [ -f .frontend.pid ]; then
  FRONTEND_PID=$(cat .frontend.pid)
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    kill $FRONTEND_PID 2>/dev/null
    echo "前端服务已停止 (PID: $FRONTEND_PID)"
  fi
  rm -f .frontend.pid
fi

kill $(lsof -ti tcp:43378 2>/dev/null) 2>/dev/null
kill $(lsof -ti tcp:53378 2>/dev/null) 2>/dev/null

echo "服务已全部停止"
