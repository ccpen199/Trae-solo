#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Load .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

PROJECT_NAME="${PROJECT_NAME:-may-89091}"
FRONTEND_PORT="${FRONTEND_PORT:-49091}"
BACKEND_PORT="${BACKEND_PORT:-59091}"

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

echo "========================================"
echo "  停止 $PROJECT_NAME"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "========================================"

# Function to safely kill a process if it belongs to this project
safe_kill() {
    local port=$1
    local name=$2
    
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1 || true)
    
    if [ -z "$pid" ]; then
        echo "[停止] $name 端口 $port 未在运行"
        return 0
    fi
    
    local cwd=$(get_pid_cwd "$pid")
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
    
    echo "[停止] 检查 $name 进程 PID=$pid"
    echo "  cwd: $cwd"
    echo "  cmd: $cmd"
    
    # Check if cwd starts with PROJECT_DIR, OR command contains PROJECT_DIR path
    if [[ "$cwd" == "$PROJECT_DIR"/* ]] || [[ "$cwd" == "$PROJECT_DIR" ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
        echo "[停止] 确认归属本项目，终止 PID=$pid"
        kill "$pid" 2>/dev/null || true
        sleep 1
        # Verify process is terminated
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "[停止] 进程仍在运行，强制终止"
            kill -9 "$pid" 2>/dev/null || true
        fi
        echo "[停止] ✅ $name 已停止"
        # Clear PID file
        if [ -f "$PROJECT_DIR/.${name}.pid" ]; then
            rm -f "$PROJECT_DIR/.${name}.pid"
        fi
    else
        echo "[警告] 进程不属于本项目，跳过终止"
        echo "  cwd=$cwd 不在 $PROJECT_DIR 范围内"
        echo "  请手动确认后处理"
    fi
}

# Also kill by saved PID files if port check didn't find them
kill_by_pidfile() {
    local pidfile="$1"
    local name="$2"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile" 2>/dev/null || true)
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            local cwd=$(get_pid_cwd "$pid")
            local cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
            if [[ "$cwd" == "$PROJECT_DIR"/* ]] || [[ "$cwd" == "$PROJECT_DIR" ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
                echo "[停止] 通过 PID 文件停止 $name PID=$pid"
                kill "$pid" 2>/dev/null || true
                sleep 1
                if ps -p "$pid" > /dev/null 2>&1; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
        fi
        rm -f "$pidfile"
    fi
}

# Stop frontend
safe_kill "$FRONTEND_PORT" "前端"
kill_by_pidfile "$PROJECT_DIR/.frontend.pid" "前端"

# Stop backend
safe_kill "$BACKEND_PORT" "后端"
kill_by_pidfile "$PROJECT_DIR/.backend.pid" "后端"

echo "========================================"
echo "  ✅ 停止命令执行完成"
echo "========================================"
