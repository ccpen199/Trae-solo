#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "错误: 找不到 .env 文件: $ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

get_port_for_slot() {
    local slot=$1
    local type=$2
    
    if [ "$slot" -eq 0 ]; then
        if [ "$type" = "frontend" ]; then
            echo "$FRONTEND_PORT"
        else
            echo "$BACKEND_PORT"
        fi
    else
        if [ "$type" = "frontend" ]; then
            local var="FRONTEND_PORT_SLOT${slot}"
            echo "${!var}"
        else
            local var="BACKEND_PORT_SLOT${slot}"
            echo "${!var}"
        fi
    fi
}

is_port_available() {
    local port=$1
    local pid
    
    pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -z "$pid" ]; then
        return 0
    fi
    
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    
    case "$cwd" in
        "$PROJECT_DIR"/*)
            echo "端口 $port 被当前项目进程占用 (PID=$pid, cwd=$cwd)"
            return 1
            ;;
        *)
            echo "端口 $port 被其他项目占用 (PID=$pid, cwd=$cwd, cmd=$cmd)"
            return 2
            ;;
    esac
}

kill_project_process() {
    local port=$1
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -z "$pid" ]; then
        echo "端口 $port 没有进程在监听"
        return 0
    fi
    
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    
    case "$cwd" in
        "$PROJECT_DIR"/*)
            echo "终止当前项目进程 (PID=$pid, port=$port, cwd=$cwd)"
            kill "$pid"
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            return 0
            ;;
        *)
            echo "SKIP: 不终止其他项目进程 (PID=$pid, cwd=$cwd, cmd=$cmd)"
            return 1
            ;;
    esac
}

update_env_ports() {
    local slot=$1
    local frontend_port=$(get_port_for_slot "$slot" "frontend")
    local backend_port=$(get_port_for_slot "$slot" "backend")
    local app_port=$frontend_port
    
    echo "更新 .env 端口配置: slot=$slot, frontend=$frontend_port, backend=$backend_port"
    
    sed -i.bak "s|^FRONTEND_PORT=.*|FRONTEND_PORT=$frontend_port|" "$ENV_FILE"
    sed -i.bak "s|^BACKEND_PORT=.*|BACKEND_PORT=$backend_port|" "$ENV_FILE"
    sed -i.bak "s|^APP_PORT=.*|APP_PORT=$app_port|" "$ENV_FILE"
    sed -i.bak "s|^ACTIVE_SLOT=.*|ACTIVE_SLOT=$slot|" "$ENV_FILE"
    sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
    sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$ENV_FILE"
    sed -i.bak "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
    sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
    
    rm -f "${ENV_FILE}.bak"
    
    export FRONTEND_PORT=$frontend_port
    export BACKEND_PORT=$backend_port
    export APP_PORT=$app_port
    export ACTIVE_SLOT=$slot
    export FRONTEND_URL="http://127.0.0.1:$frontend_port"
    export BACKEND_URL="http://127.0.0.1:$backend_port"
    export API_BASE_URL="http://127.0.0.1:$backend_port/api"
    export VITE_API_URL="http://127.0.0.1:$backend_port/api"
}

find_available_ports() {
    local start_slot=${1:-0}
    
    for slot in $(seq $start_slot 5); do
        local frontend_port=$(get_port_for_slot "$slot" "frontend")
        local backend_port=$(get_port_for_slot "$slot" "backend")
        
        echo "检查槽位 $slot: frontend=$frontend_port, backend=$backend_port"
        
        local fe_status
        local be_status
        
        is_port_available "$frontend_port" && fe_status=0 || fe_status=$?
        is_port_available "$backend_port" && be_status=0 || be_status=$?
        
        if [ "$fe_status" -eq 0 ] && [ "$be_status" -eq 0 ]; then
            echo "找到可用端口槽位: slot=$slot"
            update_env_ports "$slot"
            return 0
        elif [ "$fe_status" -eq 1 ] || [ "$be_status" -eq 1 ]; then
            echo "端口被当前项目占用，尝试终止..."
            [ "$fe_status" -eq 1 ] && kill_project_process "$frontend_port" || true
            [ "$be_status" -eq 1 ] && kill_project_process "$backend_port" || true
            
            if is_port_available "$frontend_port" && is_port_available "$backend_port"; then
                echo "端口已释放，使用槽位 $slot"
                update_env_ports "$slot"
                return 0
            fi
        fi
    done
    
    echo "错误: 所有端口槽位 (0-5) 均被占用"
    echo "请手动释放端口或检查其他项目"
    for slot in 0 1 2 3 4 5; do
        local fp=$(get_port_for_slot "$slot" "frontend")
        local bp=$(get_port_for_slot "$slot" "backend")
        local fpid=$(lsof -nP -iTCP:$fp -sTCP:LISTEN -t 2>/dev/null | head -n1)
        local bpid=$(lsof -nP -iTCP:$bp -sTCP:LISTEN -t 2>/dev/null | head -n1)
        [ -n "$fpid" ] && echo "  slot $slot: frontend port $fp 被 PID $fpid 占用"
        [ -n "$bpid" ] && echo "  slot $slot: backend port $bp 被 PID $bpid 占用"
    done
    exit 1
}

check_process_health() {
    local port=$1
    local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -z "$pid" ]; then
        echo "端口 $port 无监听进程"
        return 1
    fi
    
    local stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs)
    
    if [ -z "$stat" ]; then
        echo "PID $pid 不存在"
        return 1
    fi
    
    case "$stat" in
        T*|Z*)
            echo "进程异常: PID=$pid, STAT=$stat"
            return 1
            ;;
        *)
            echo "进程正常: PID=$pid, STAT=$stat"
            return 0
            ;;
    esac
}

case "$1" in
    check)
        echo "=== 检查端口 ==="
        echo "Frontend port: $FRONTEND_PORT"
        echo "Backend port: $BACKEND_PORT"
        is_port_available "$FRONTEND_PORT" && echo "  frontend 可用" || echo "  frontend 被占用"
        is_port_available "$BACKEND_PORT" && echo "  backend 可用" || echo "  backend 被占用"
        ;;
    find)
        find_available_ports "${2:-0}"
        ;;
    kill)
        if [ -n "$2" ]; then
            kill_project_process "$2"
        else
            echo "Usage: $0 kill <port>"
            exit 1
        fi
        ;;
    health)
        echo "=== 检查进程健康 ==="
        check_process_health "$FRONTEND_PORT" || true
        check_process_health "$BACKEND_PORT" || true
        ;;
    *)
        echo "Usage: $0 {check|find|kill|health}"
        echo "  check  - 检查当前端口状态"
        echo "  find [slot] - 查找可用端口槽位并更新 .env"
        echo "  kill <port> - 安全终止指定端口的当前项目进程"
        echo "  health - 检查进程健康状态"
        exit 1
        ;;
esac
