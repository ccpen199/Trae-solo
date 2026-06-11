#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found"
    exit 1
fi

source "$ENV_FILE"

get_process_cwd() {
    local pid=$1
    local cwd=""
    cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
    if [ -z "$cwd" ]; then
        local cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
        if echo "$cmd" | grep -Fq "$PROJECT_DIR"; then
            cwd="$PROJECT_DIR"
        fi
    fi
    echo "$cwd"
}

kill_pid_if_belongs() {
    local pid=$1
    local port=$2
    
    if [ -z "$pid" ]; then
        echo "No process listening on port $port"
        return 0
    fi
    
    local cwd=$(get_process_cwd "$pid")
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    
    if [ -z "$cwd" ]; then
        echo "Skip kill: cannot get cwd for pid=$pid on port $port"
        return 1
    fi
    
    case "$cwd" in
        "$PROJECT_DIR"/*)
            echo "Killing pid=$pid on port=$port (cwd=$cwd)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                echo "Force killing pid=$pid"
                kill -9 "$pid" 2>/dev/null || true
            fi
            return 0
            ;;
        *)
            echo "Skip kill: pid=$pid on port=$port does not belong to this project"
            echo "  cwd=$cwd"
            echo "  cmd=$cmd"
            return 1
            ;;
    esac
}

echo "Stopping project may-89103..."
echo "========================================"

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

if [ -n "$frontend_pid" ]; then
    kill_pid_if_belongs "$frontend_pid" "$FRONTEND_PORT" || true
fi

if [ -n "$backend_pid" ]; then
    kill_pid_if_belongs "$backend_pid" "$BACKEND_PORT" || true
fi

echo "========================================"
echo "Checking if ports are released..."

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

if [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]; then
    echo "All ports released successfully"
else
    echo "WARNING: Some ports still occupied"
    [ -n "$frontend_pid" ] && echo "Port $FRONTEND_PORT still has pid=$frontend_pid"
    [ -n "$backend_pid" ] && echo "Port $BACKEND_PORT still has pid=$backend_pid"
fi

echo "Stop complete."
