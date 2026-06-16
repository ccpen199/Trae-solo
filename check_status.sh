#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PORT=49220
BACKEND_PORT=59220

echo "=== 前端端口 $FRONTEND_PORT ==="
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$frontend_pid" ]; then
  echo "PID: $frontend_pid"
  cwd=$(ps -o cwd= -p "$frontend_pid" | xargs 2>/dev/null || echo "")
  cmd=$(ps -o command= -p "$frontend_pid" 2>/dev/null || echo "")
  echo "CWD: $cwd"
  echo "CMD: $cmd"
  echo "$cwd" | grep -q "may-89220" && echo "归属: 本项目" || echo "归属: 其他项目"
  echo "HTTP 响应:"
  curl -sI --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ | head -3
else
  echo "无进程监听"
fi

echo ""
echo "=== 后端端口 $BACKEND_PORT ==="
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -n "$backend_pid" ]; then
  echo "PID: $backend_pid"
  cwd=$(ps -o cwd= -p "$backend_pid" | xargs 2>/dev/null || echo "")
  cmd=$(ps -o command= -p "$backend_pid" 2>/dev/null || echo "")
  echo "CWD: $cwd"
  echo "CMD: $cmd"
  echo "$cwd" | grep -q "may-89220" && echo "归属: 本项目" || echo "归属: 其他项目"
  echo "API 测试:"
  result=$(curl -s --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/posts/feed?latitude=39.9042&longitude=116.4074&limit=3" 2>&1)
  if echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); print('帖子数:', len(d.get('posts',[])))" 2>/dev/null; then
    echo "API 正常"
  else
    echo "响应: $(echo "$result" | head -c 200)"
  fi
else
  echo "无进程监听"
fi
