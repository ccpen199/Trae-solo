#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== Stopping $PROJECT_NAME ==="
load_env

echo ""
echo "Stopping frontend on port $FRONTEND_PORT..."
safe_kill "$FRONTEND_PORT" || true

echo ""
echo "Stopping backend on port $BACKEND_PORT..."
safe_kill "$BACKEND_PORT" || true

echo ""
echo "=== Status ==="
sleep 1

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

if [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]; then
    echo "All services stopped successfully"
else
    [ -n "$frontend_pid" ] && echo "WARNING: Frontend still running with PID $frontend_pid"
    [ -n "$backend_pid" ] && echo "WARNING: Backend still running with PID $backend_pid"
fi
