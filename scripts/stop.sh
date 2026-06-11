#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$PROJECT_DIR/scripts"

source "$SCRIPT_DIR/process-common.sh"
load_env

echo "=== Stopping project may-89096 ==="
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: $BACKEND_PORT"

frontend_pid=$(get_pid_by_port "$FRONTEND_PORT")
if [ -n "$frontend_pid" ]; then
  frontend_cwd=$(ps -o cwd= -p "$frontend_pid" 2>/dev/null | xargs)
  frontend_cmd=$(ps -o command= -p "$frontend_pid" 2>/dev/null)
  case "$frontend_cwd" in
    "$PROJECT_DIR"/*)
      echo "Stopping frontend (pid=$frontend_pid, cwd=$frontend_cwd)"
      kill "$frontend_pid" 2>/dev/null || true
      sleep 0.5
      kill -9 "$frontend_pid" 2>/dev/null || true
      ;;
    *)
      echo "skip kill frontend: cwd=$frontend_cwd cmd=$frontend_cmd"
      ;;
  esac
else
  echo "No frontend process found on port $FRONTEND_PORT"
fi

backend_pid=$(get_pid_by_port "$BACKEND_PORT")
if [ -n "$backend_pid" ]; then
  backend_cwd=$(ps -o cwd= -p "$backend_pid" 2>/dev/null | xargs)
  backend_cmd=$(ps -o command= -p "$backend_pid" 2>/dev/null)
  case "$backend_cwd" in
    "$PROJECT_DIR"/*)
      echo "Stopping backend (pid=$backend_pid, cwd=$backend_cwd)"
      kill "$backend_pid" 2>/dev/null || true
      sleep 0.5
      kill -9 "$backend_pid" 2>/dev/null || true
      ;;
    *)
      echo "skip kill backend: cwd=$backend_cwd cmd=$backend_cmd"
      ;;
  esac
else
  echo "No backend process found on port $BACKEND_PORT"
fi

echo ""
echo "Verification..."
sleep 1

frontend_pid=$(get_pid_by_port "$FRONTEND_PORT")
backend_pid=$(get_pid_by_port "$BACKEND_PORT")

if [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]; then
  echo "All services stopped successfully"
else
  [ -n "$frontend_pid" ] && echo "WARN: Frontend still running (pid=$frontend_pid)"
  [ -n "$backend_pid" ] && echo "WARN: Backend still running (pid=$backend_pid)"
fi
