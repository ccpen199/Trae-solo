#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

source "$PROJECT_DIR/scripts/process-common.sh"
load_env

echo "=== Verification for may-89096 ==="
echo ""

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health

echo ""
echo "=== Verification Complete ==="
