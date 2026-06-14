#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Load .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Function to get process cwd on macOS (ps doesn't support cwd=)
get_pid_cwd() {
    local pid="$1"
    if [ -z "$pid" ]; then
        echo ""
        return
    fi
    # Use lsof to get cwd on macOS
    local cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1)
    echo "$cwd"
}

FRONTEND_PORT="${FRONTEND_PORT:-49091}"
BACKEND_PORT="${BACKEND_PORT:-59091}"

echo "========================================"
echo "  健康检查"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "========================================"

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1 || true)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1 || true)

ALL_OK=true

echo ""
echo "========== 前端状态 =========="
if [ -n "$frontend_pid" ]; then
    echo "✅ 端口监听: 端口 $FRONTEND_PORT 正在监听，PID=$frontend_pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  (无法获取进程信息)"
    frontend_cwd=$(get_pid_cwd "$frontend_pid")
    echo "  工作目录: $frontend_cwd"
    frontend_status=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | tr -d ' ' || echo "UNKNOWN")
    if [[ "$frontend_status" == T* ]]; then
        echo "❌ 进程状态: 停止态 ($frontend_status)"
        ALL_OK=false
    elif [[ "$frontend_status" == Z* ]]; then
        echo "❌ 进程状态: 僵尸态 ($frontend_status)"
        ALL_OK=false
    else
        echo "✅ 进程状态: $frontend_status"
    fi
    frontend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
    if [ "$frontend_http" = "200" ]; then
        echo "✅ HTTP 响应: 200 OK"
        curl -s --max-time 5 -I "http://127.0.0.1:$FRONTEND_PORT/" | head -5
    else
        echo "❌ HTTP 响应: $frontend_http"
        ALL_OK=false
    fi
else
    echo "❌ 端口监听: 端口 $FRONTEND_PORT 未在监听"
    ALL_OK=false
fi

echo ""
echo "========== 后端状态 =========="
if [ -n "$backend_pid" ]; then
    echo "✅ 端口监听: 端口 $BACKEND_PORT 正在监听，PID=$backend_pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  (无法获取进程信息)"
    backend_cwd=$(get_pid_cwd "$backend_pid")
    echo "  工作目录: $backend_cwd"
    backend_status=$(ps -o stat= -p "$backend_pid" 2>/dev/null | tr -d ' ' || echo "UNKNOWN")
    if [[ "$backend_status" == T* ]]; then
        echo "❌ 进程状态: 停止态 ($backend_status)"
        ALL_OK=false
    elif [[ "$backend_status" == Z* ]]; then
        echo "❌ 进程状态: 僵尸态 ($backend_status)"
        ALL_OK=false
    else
        echo "✅ 进程状态: $backend_status"
    fi
    backend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
    if [ "$backend_http" = "200" ] || [ "$backend_http" = "201" ] || [ "$backend_http" = "301" ] || [ "$backend_http" = "302" ]; then
        echo "✅ HTTP 响应: $backend_http"
        curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1 | head -5
    else
        echo "❌ HTTP 响应: $backend_http"
        ALL_OK=false
    fi
else
    echo "❌ 端口监听: 端口 $BACKEND_PORT 未在监听"
    ALL_OK=false
fi

echo ""
echo "========================================"
if [ "$ALL_OK" = true ]; then
    echo "  ✅ 所有检查通过，服务运行正常"
    echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
    echo "  后端: http://127.0.0.1:$BACKEND_PORT/api/health"
else
    echo "  ❌ 部分检查失败，请检查日志文件"
    echo "  frontend.log | backend.log"
fi
echo "========================================"
