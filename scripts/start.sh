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
TAIL4=9091
HOST="${HOST:-127.0.0.1}"
NODE_BIN="${NODE_BIN:-$(which node)}"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"
BACKEND_SESSION="pinai_${PROJECT_NAME}_backend"
FRONTEND_SESSION="pinai_${PROJECT_NAME}_frontend"

# Function to get process cwd on macOS (ps doesn't support cwd=)
get_pid_cwd() {
    local pid="$1"
    if [ -z "$pid" ]; then
        echo ""
        return
    fi
    # Use lsof to get cwd on macOS
    local cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1)
    echo "$cwd"
}

# Function to check port and update .env if needed
check_port_and_update_env() {
    local slot=0
    local frontend_port=""
    local backend_port=""

    while [ $slot -lt 6 ]; do
        frontend_port=$((40000 + slot * 1000 + TAIL4))
        backend_port=$((50000 + slot * 1000 + TAIL4))
        
        echo "[启动] 检查槽位 $slot: 前端 $frontend_port, 后端 $backend_port"
        
        local frontend_pid=$(lsof -nP -iTCP:$frontend_port -sTCP:LISTEN -t | head -n1 || true)
        local backend_pid=$(lsof -nP -iTCP:$backend_port -sTCP:LISTEN -t | head -n1 || true)
        local frontend_blocked=0
        local backend_blocked=0
        
        if [ -n "$frontend_pid" ]; then
            local frontend_cwd=$(get_pid_cwd "$frontend_pid")
            local frontend_cmd=$(ps -o command= -p "$frontend_pid" 2>/dev/null || echo "")
            if [[ "$frontend_cwd" != "$PROJECT_DIR"/* ]] && [[ "$frontend_cwd" != "$PROJECT_DIR" ]] && [[ "$frontend_cmd" != *"$PROJECT_DIR"* ]]; then
                frontend_blocked=1
            fi
        fi
        if [ -n "$backend_pid" ]; then
            local backend_cwd=$(get_pid_cwd "$backend_pid")
            local backend_cmd=$(ps -o command= -p "$backend_pid" 2>/dev/null || echo "")
            if [[ "$backend_cwd" != "$PROJECT_DIR"/* ]] && [[ "$backend_cwd" != "$PROJECT_DIR" ]] && [[ "$backend_cmd" != *"$PROJECT_DIR"* ]]; then
                backend_blocked=1
            fi
        fi

        if [ "$frontend_blocked" -eq 0 ] && [ "$backend_blocked" -eq 0 ]; then
            echo "[启动] 槽位 $slot 可用: 前端 $frontend_port, 后端 $backend_port"
            echo "[启动] 更新 .env 端口配置..."
            sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" .env
            sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" .env
            sed -i.bak "s/^APP_PORT=.*/APP_PORT=$frontend_port/" .env
            sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" .env
            sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" .env
            sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" .env
            sed -i.bak "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://127.0.0.1:$backend_port/api|" .env
            sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" .env
            rm -f .env.bak
            export $(cat .env | grep -v '^#' | xargs)
            return 0
        else
            echo "[启动] 槽位 $slot 端口已占用"
            if [ -n "$frontend_pid" ]; then
                local cwd=$(get_pid_cwd "$frontend_pid")
                local cmd=$(ps -o command= -p "$frontend_pid" 2>/dev/null || echo "")
                echo "  前端端口 $frontend_port 被 PID=$frontend_pid 占用: cwd=$cwd cmd=$cmd"
            fi
            if [ -n "$backend_pid" ]; then
                local cwd=$(get_pid_cwd "$backend_pid")
                local cmd=$(ps -o command= -p "$backend_pid" 2>/dev/null || echo "")
                echo "  后端端口 $backend_port 被 PID=$backend_pid 占用: cwd=$cwd cmd=$cmd"
            fi
        fi
        slot=$((slot + 1))
    done
    
    echo "[错误] 所有 6 个槽位均被占用，无法启动项目"
    echo "请手动清理占用进程或修改端口配置"
    exit 1
}

# Check ports before starting
check_port_and_update_env

echo "========================================"
echo "  启动 $PROJECT_NAME"
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo "  前端地址: http://127.0.0.1:$FRONTEND_PORT"
echo "  后端地址: http://127.0.0.1:$BACKEND_PORT"
echo "========================================"

# Create data directory
mkdir -p data

# Kill any existing processes for THIS project first
safe_kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1 || true)
    if [ -n "$pid" ]; then
        local cwd=$(get_pid_cwd "$pid")
        local cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
        # Check if cwd or command belongs to this project
        if [[ "$cwd" == "$PROJECT_DIR"/* ]] || [[ "$cwd" == "$PROJECT_DIR" ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
            echo "[启动] 停止旧的 $name 进程 PID=$pid"
            kill "$pid" 2>/dev/null || true
            sleep 1
        fi
    fi
}

safe_kill_port "$FRONTEND_PORT" "前端"
safe_kill_port "$BACKEND_PORT" "后端"

# Common environment
COMMON_ENV="PROJECT_DIR=$PROJECT_DIR PROJECT_NAME=$PROJECT_NAME HOST=$HOST FRONTEND_PORT=$FRONTEND_PORT BACKEND_PORT=$BACKEND_PORT DB_PATH=data/app.sqlite DATABASE_PATH=./data/app.sqlite CORS_ORIGIN=http://127.0.0.1:$FRONTEND_PORT NODE_ENV=development"

start_background() {
    local session="$1"
    local cwd="$2"
    local command="$3"

    if [ -x "$TMUX_BIN" ]; then
        "$TMUX_BIN" kill-session -t "$session" >/dev/null 2>&1 || true
        "$TMUX_BIN" new-session -d -s "$session" -c "$cwd" /bin/zsh -lc "$command"
        echo "[启动] tmux 会话已启动: $session"
    else
        (
            cd "$cwd"
            nohup /bin/zsh -lc "$command" >/dev/null 2>&1 &
        )
        echo "[启动] nohup 后台进程已启动: $session"
    fi
}

# Start backend in background
echo "[启动] 启动后端服务..."
start_background "$BACKEND_SESSION" "$PROJECT_DIR/backend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/backend/server.js' >> '$PROJECT_DIR/backend.log' 2>&1"

# Start frontend in background
echo "[启动] 启动前端服务..."
start_background "$FRONTEND_SESSION" "$PROJECT_DIR/frontend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/frontend/static-server.js' >> '$PROJECT_DIR/frontend.log' 2>&1"

echo "[启动] 等待 5 秒让服务启动..."
sleep 5

# Health check
echo "[启动] 执行健康检查..."
FRONTEND_PORT="$FRONTEND_PORT"
BACKEND_PORT="$BACKEND_PORT"

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1 || true)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1 || true)

echo "========== 启动验证 =========="
if [ -n "$frontend_pid" ]; then
    echo "[成功] 前端端口 $FRONTEND_PORT 正在监听，PID=$frontend_pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  (无法获取进程信息)"
    frontend_status=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | tr -d ' ' || echo "UNKNOWN")
    if [[ "$frontend_status" == T* ]] || [[ "$frontend_status" == Z* ]]; then
        echo "[错误] 前端进程状态异常: $frontend_status"
        exit 1
    fi
    frontend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
    echo "[HTTP] 前端首页状态码: $frontend_http"
    if [ "$frontend_http" != "200" ]; then
        echo "[警告] 前端首页未返回 200，请检查 frontend.log"
    fi
else
    echo "[错误] 前端端口 $FRONTEND_PORT 未在监听"
    echo "请检查 frontend.log 获取详细错误信息"
    exit 1
fi

if [ -n "$backend_pid" ]; then
    echo "[成功] 后端端口 $BACKEND_PORT 正在监听，PID=$backend_pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || echo "  (无法获取进程信息)"
    backend_status=$(ps -o stat= -p "$backend_pid" 2>/dev/null | tr -d ' ' || echo "UNKNOWN")
    if [[ "$backend_status" == T* ]] || [[ "$backend_status" == Z* ]]; then
        echo "[错误] 后端进程状态异常: $backend_status"
        exit 1
    fi
    backend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
    echo "[HTTP] 后端健康检查状态码: $backend_http"
    if [ "$backend_http" != "200" ]; then
        echo "[警告] 后端健康检查未返回 200，请检查 backend.log"
    fi
else
    echo "[错误] 后端端口 $BACKEND_PORT 未在监听"
    echo "请检查 backend.log 获取详细错误信息"
    exit 1
fi

echo "========================================"
echo "  ✅ 服务启动成功"
echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
echo "  后端: http://127.0.0.1:$BACKEND_PORT"
echo "  后端健康检查: http://127.0.0.1:$BACKEND_PORT/api/health"
echo "========================================"
