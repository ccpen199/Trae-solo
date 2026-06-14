#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

load_env

echo "=== 停止项目服务 ($PROJECT_NAME) ==="
echo "项目目录: $PROJECT_DIR"
echo ""

frontend_pid=$(get_pid_by_port "$FRONTEND_PORT")
backend_pid=$(get_pid_by_port "$BACKEND_PORT")

STOPPED_FE=false
STOPPED_BE=false

if [ -n "$frontend_pid" ]; then
    if kill_our_process "$frontend_pid" "$FRONTEND_PORT" "前端"; then
        STOPPED_FE=true
    fi
else
    echo "ℹ️  前端: 没有运行中的进程"
fi

echo ""

if [ -n "$backend_pid" ]; then
    if kill_our_process "$backend_pid" "$BACKEND_PORT" "后端"; then
        STOPPED_BE=true
    fi
else
    echo "ℹ️  后端: 没有运行中的进程"
fi

echo ""
echo "=== 停止完成 ==="
if $STOPPED_FE || $STOPPED_BE; then
    echo "✅ 已停止服务"
else
    echo "ℹ️  没有需要停止的服务"
fi
