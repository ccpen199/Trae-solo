#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="may-89101"
TAIL4="9101"

ENV_FILE="$PROJECT_DIR/.env"

load_env() {
    if [ -f "$ENV_FILE" ]; then
        set -a
        # shellcheck disable=SC1090
        . "$ENV_FILE"
        set +a
    fi
}

save_env() {
    cat > "$ENV_FILE" << 'EOF'
PROJECT_DIR=__PROJECT_DIR__
PROJECT_NAME=may-89101
APP_NAME=常州市公共服务聚合平台

# Port Configuration - tail4 = 9101 from directory name may-89101
# Slot 0 (default): 40000+tail4 / 50000+tail4
# Slot 1: 41000+tail4 / 51000+tail4
# Slot 2: 42000+tail4 / 52000+tail4
# Slot 3: 43000+tail4 / 53000+tail4
# Slot 4: 44000+tail4 / 54000+tail4
# Slot 5: 45000+tail4 / 55000+tail4

PORT_SLOT=__PORT_SLOT__
FRONTEND_PORT=__FRONTEND_PORT__
BACKEND_PORT=__BACKEND_PORT__

# URLs
FRONTEND_URL=http://127.0.0.1:__FRONTEND_PORT__
BACKEND_URL=http://127.0.0.1:__BACKEND_PORT__
API_BASE_URL=http://127.0.0.1:__BACKEND_PORT__/api
VITE_API_URL=http://127.0.0.1:__BACKEND_PORT__/api

# CORS & Bind
BIND_HOST=127.0.0.1
CORS_ORIGIN=http://127.0.0.1:__FRONTEND_PORT__

# Database
DATABASE_URL=sqlite:///data/crowdsourcing.sqlite

# Project Directories
BACKEND_DIR=crowdsourcing-backend
FRONTEND_DIR=crowdsourcing-frontend
EOF

    sed -i '' "s|__PROJECT_DIR__|$PROJECT_DIR|g" "$ENV_FILE"
    sed -i '' "s/__PORT_SLOT__/$1/g" "$ENV_FILE"
    sed -i '' "s/__FRONTEND_PORT__/$2/g" "$ENV_FILE"
    sed -i '' "s/__BACKEND_PORT__/$3/g" "$ENV_FILE"

    load_env
}

get_port_for_slot() {
    local slot=$1
    local frontend_base=$((40000 + slot * 1000))
    local backend_base=$((50000 + slot * 1000))
    echo "$((frontend_base + TAIL4)) $((backend_base + TAIL4))"
}

port_in_use() {
    local port=$1
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
}

get_pid_for_port() {
    local port=$1
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

pid_cwd() {
    local pid=$1
    lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

is_process_owned_by_project() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi

    local cwd
    cwd=$(pid_cwd "$pid")

    case "$cwd" in
        "$PROJECT_DIR"*) return 0 ;;
        *) return 1 ;;
    esac
}

safe_kill() {
    local port=$1
    local pid
    pid=$(get_pid_for_port "$port")

    if [ -z "$pid" ]; then
        echo "Port $port is not in use, nothing to kill"
        return 0
    fi

    if is_process_owned_by_project "$pid"; then
        echo "Killing process $pid on port $port (owned by this project)"
        kill "$pid"
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid"
        fi
    else
        local cwd
        cwd=$(pid_cwd "$pid")
        local cmd
        cmd=$(ps -o command= -p "$pid" 2>/dev/null)
        echo "SKIP kill: Port $port is used by PID $pid (not owned by this project)"
        echo "  cwd=$cwd"
        echo "  cmd=$cmd"
        return 1
    fi
}

find_available_ports() {
    for slot in 0 1 2 3 4 5; do
        read frontend_port backend_port <<< $(get_port_for_slot "$slot")
        if ! port_in_use "$frontend_port" && ! port_in_use "$backend_port"; then
            echo "$slot $frontend_port $backend_port"
            return 0
        fi
        echo "Slot $slot: ports $frontend_port/$backend_port already in use, trying next..." >&2
    done

    echo "ERROR: All port slots (0-5) are occupied!" >&2
    echo "Please free up ports or manually specify different ports in .env" >&2
    for slot in 0 1 2 3 4 5; do
        read frontend_port backend_port <<< $(get_port_for_slot "$slot")
        local fpid bpid
        fpid=$(get_pid_for_port "$frontend_port")
        bpid=$(get_pid_for_port "$backend_port")
        echo "  Slot $slot: FRONTEND=$frontend_port (PID=$fpid), BACKEND=$backend_port (PID=$bpid)" >&2
    done
    return 1
}

ensure_ports_available() {
    load_env

    if [ -n "$FRONTEND_PORT" ] && [ -n "$BACKEND_PORT" ]; then
        if ! port_in_use "$FRONTEND_PORT" && ! port_in_use "$BACKEND_PORT"; then
            echo "Configured ports $FRONTEND_PORT/$BACKEND_PORT are available"
            return 0
        fi
        local frontend_pid backend_pid
        frontend_pid=$(get_pid_for_port "$FRONTEND_PORT")
        backend_pid=$(get_pid_for_port "$BACKEND_PORT")
        if { [ -z "$frontend_pid" ] || is_process_owned_by_project "$frontend_pid"; } && { [ -z "$backend_pid" ] || is_process_owned_by_project "$backend_pid"; }; then
            echo "Configured ports $FRONTEND_PORT/$BACKEND_PORT are used by this project and will be restarted"
            return 0
        fi
        echo "Configured ports $FRONTEND_PORT/$BACKEND_PORT are in use by another process, trying to find alternatives..."
    fi

    read slot frontend_port backend_port <<< $(find_available_ports)
    if [ $? -ne 0 ]; then
        return 1
    fi

    echo "Using slot $slot: FRONTEND=$frontend_port, BACKEND=$backend_port"
    save_env "$slot" "$frontend_port" "$backend_port"
    return 0
}

check_process_health() {
    local pid=$1
    local port=$2
    local name=$3

    if [ -z "$pid" ]; then
        echo "FAIL: $name has no PID listening on port $port"
        return 1
    fi

    local stat
    stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs)
    if [ -z "$stat" ]; then
        echo "FAIL: $name PID $pid does not exist"
        return 1
    fi

    case "$stat" in
        T*|Z*)
            echo "FAIL: $name PID $pid is in bad state: $stat (T=stopped, Z=zombie)"
            return 1
            ;;
    esac

    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | grep -q "^$pid$"; then
        echo "FAIL: $name PID $pid exists but is not listening on port $port"
        return 1
    fi

    echo "OK: $name PID $pid is healthy (stat=$stat, listening on port $port)"
    return 0
}

verify_frontend() {
    local url="$1"
    local response
    response=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url/" 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo "OK: Frontend responds with HTTP 200 at $url"
        return 0
    else
        echo "FAIL: Frontend at $url returned HTTP $response"
        return 1
    fi
}

verify_backend() {
    local url="$1"
    local response
    response=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url/api/health" 2>/dev/null)
    if [[ "$response" =~ ^[23][0-9][0-9]$ ]]; then
        echo "OK: Backend health check returned HTTP $response at $url/api/health"
        return 0
    else
        response=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url/" 2>/dev/null)
        if [[ "$response" =~ ^[23][0-9][0-9]$ ]]; then
            echo "OK: Backend root returned HTTP $response at $url"
            return 0
        else
            echo "FAIL: Backend at $url returned HTTP $response"
            return 1
        fi
    fi
}
