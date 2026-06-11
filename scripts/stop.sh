#!/bin/bash
set -e

cd "$(dirname "$0")/.."
source .env

PROJECT_DIR="$(pwd)"

kill_process() {
    local PORT=$1
    local NAME=$2
    local PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$PID" ]; then
        local CWD=$(ps -o cwd= -p "$PID" 2>/dev/null | xargs)
        local CMD=$(ps -o command= -p "$PID" 2>/dev/null)
        case "$CWD" in
            "$PROJECT_DIR"/*)
                echo "停止$NAME服务 (PID: $PID, 端口: $PORT)"
                kill "$PID"
                ;;
            *)
                echo "跳过$NAME端口 $PORT 不属于当前项目，不终止 (PID: $PID, CWD: $CWD)"
                ;;
        esac
    else
        echo "$NAME端口 $PORT 未运行"
    fi
}

echo "=== 停止服务 ==="
kill_process $FRONTEND_PORT "前端"
kill_process $BACKEND_PORT "后端"
echo ""
echo "服务已停止"
