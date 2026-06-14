#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== Verifying $PROJECT_NAME ==="
load_env

echo ""
echo "Configuration:"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"
echo "  FRONTEND_URL=$FRONTEND_URL"
echo "  BACKEND_URL=$BACKEND_URL"
echo ""

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "=== Process Information ==="
if [ -n "$frontend_pid" ]; then
    echo "Frontend PID: $frontend_pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
else
    echo "Frontend: NOT RUNNING (no listener on port $FRONTEND_PORT)"
fi

if [ -n "$backend_pid" ]; then
    echo "Backend PID: $backend_pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
else
    echo "Backend: NOT RUNNING (no listener on port $BACKEND_PORT)"
fi

echo ""
echo "=== Health Checks ==="
FRONTEND_OK=true
BACKEND_OK=true

if [ -n "$frontend_pid" ]; then
    check_process_health "$frontend_pid" "$FRONTEND_PORT" "Frontend" || FRONTEND_OK=false
    verify_frontend "$FRONTEND_URL" || FRONTEND_OK=false
else
    FRONTEND_OK=false
    echo "FAIL: Frontend is not running"
fi

if [ -n "$backend_pid" ]; then
    check_process_health "$backend_pid" "$BACKEND_PORT" "Backend" || BACKEND_OK=false
    verify_backend "$BACKEND_URL" || BACKEND_OK=false
else
    BACKEND_OK=false
    echo "FAIL: Backend is not running"
fi

echo ""
echo "=== Summary ==="
if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ]; then
    echo "ALL CHECKS PASSED ✓"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend: $BACKEND_URL/api"
    exit 0
else
    echo "SOME CHECKS FAILED ✗"
    [ "$FRONTEND_OK" = false ] && echo "  - Frontend: FAILED"
    [ "$BACKEND_OK" = false ] && echo "  - Backend: FAILED"
    echo ""
    echo "Check logs for details:"
    echo "  Frontend: $PROJECT_DIR/frontend.log"
    echo "  Backend: $PROJECT_DIR/backend.log"
    exit 1
fi
