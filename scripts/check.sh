#!/bin/bash
cd "$(dirname "$0")/.."
source .env

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$(grep '^FRONTEND_PORT=' .env | cut -d'=' -f2)
BACKEND_PORT=$(grep '^BACKEND_PORT=' .env | cut -d'=' -f2)

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "=== 项目状态检查 ==="
echo "项目目录: $PROJECT_DIR"
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

if [ -n "$frontend_pid" ]; then
    echo "前端 PID: $frontend_pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
    FRONTEND_STAT=$(ps -o stat= -p "$frontend_pid"
    echo "前端状态: $FRONTEND_STAT"
else
    echo "前端未运行"
fi

echo ""

if [ -n "$backend_pid" ]; then
    echo "后端 PID: $backend_pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
    BACKEND_STAT=$(ps -o stat= -p "$backend_pid"
    echo "后端状态: $BACKEND_STAT"
else
    echo "后端未运行"
fi

echo ""
echo "=== HTTP 检查 ==="
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
echo ""
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health
echo ""
