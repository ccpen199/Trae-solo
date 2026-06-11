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

echo "========================================"
echo "Project: may-89103"
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port:  $BACKEND_PORT"
echo "========================================"

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo ""
echo "=== Frontend Status ==="
if [ -n "$frontend_pid" ]; then
    echo "PID: $frontend_pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
    echo "cwd: $(get_process_cwd "$frontend_pid")"
    echo ""
    echo "Process state check:"
    stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
    echo "State: $stat"
    case "$stat" in
        T*) echo "WARNING: Process is stopped (T state)" ;;
        Z*) echo "WARNING: Process is zombie (Z state)" ;;
        S*|R*) echo "OK: Process is running" ;;
        *) echo "Unknown state: $stat" ;;
    esac
    echo ""
    echo "HTTP check:"
    curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 | head -n3
else
    echo "NOT RUNNING: No process listening on port $FRONTEND_PORT"
fi

echo ""
echo "=== Backend Status ==="
if [ -n "$backend_pid" ]; then
    echo "PID: $backend_pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
    echo "cwd: $(get_process_cwd "$backend_pid")"
    echo ""
    echo "Process state check:"
    stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
    echo "State: $stat"
    case "$stat" in
        T*) echo "WARNING: Process is stopped (T state)" ;;
        Z*) echo "WARNING: Process is zombie (Z state)" ;;
        S*|R*) echo "OK: Process is running" ;;
        *) echo "Unknown state: $stat" ;;
    esac
    echo ""
    echo "API health check:"
    curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || \
    curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/health 2>&1 || \
    echo "Health endpoint not available"
else
    echo "NOT RUNNING: No process listening on port $BACKEND_PORT"
fi

echo ""
echo "========================================"
if [ -n "$frontend_pid" ] && [ -n "$backend_pid" ]; then
    echo "Both services are running"
    echo "Frontend: $FRONTEND_URL"
    echo "Backend:  $BACKEND_URL"
elif [ -n "$frontend_pid" ]; then
    echo "Only frontend is running"
    echo "Frontend: $FRONTEND_URL"
elif [ -n "$backend_pid" ]; then
    echo "Only backend is running"
    echo "Backend:  $BACKEND_URL"
else
    echo "No services are running"
fi
echo "========================================"
