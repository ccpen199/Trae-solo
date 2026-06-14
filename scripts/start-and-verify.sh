#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49092}
BACKEND_PORT=${BACKEND_PORT:-59092}
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi
NODE_DIR="$(dirname "$NODE_BIN")"
export PATH="$NODE_DIR:$PATH"

if [ ! -x "$TMUX_BIN" ]; then
  TMUX_BIN="$(command -v tmux || true)"
fi
if [ -z "$TMUX_BIN" ] || [ ! -x "$TMUX_BIN" ]; then
  echo "[FAIL] tmux is required for durable background startup"
  exit 1
fi

pid_cwd() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

stop_project_port() {
  local port="$1"
  local label="$2"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -z "$pid" ] && return 0

  local cwd
  cwd="$(pid_cwd "$pid")"
  case "$cwd" in
    "$PROJECT_DIR"/*)
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.3
      done
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      echo "Stopped stale $label pid $pid on port $port"
      ;;
    *)
      echo "[FAIL] $label port $port is occupied outside this project: pid=$pid cwd=${cwd:-unknown}"
      return 1
      ;;
  esac
}

start_session() {
  local session="$1"
  local cwd="$2"
  local command="$3"
  "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$session" || true
  "$TMUX_BIN" new-session -d -s "$session" -c "$cwd" /bin/zsh -lc "$command"
}

echo "========================================"
echo "Starting project $PROJECT_NAME"
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "Node:     $("$NODE_BIN" -v) ($NODE_BIN)"
echo "tmux:     $TMUX_BIN"
echo "========================================"

stop_project_port "$FRONTEND_PORT" "frontend"
stop_project_port "$BACKEND_PORT" "backend"

BACKEND_SESSION="pinai_${PROJECT_NAME}_backend"
FRONTEND_SESSION="pinai_${PROJECT_NAME}_frontend"
COMMON_ENV="PROJECT_NAME='$PROJECT_NAME' PROJECT_DIR='$PROJECT_DIR' HOST='127.0.0.1' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' CORS_ORIGIN='http://127.0.0.1:$FRONTEND_PORT' DB_PATH='./data/app.sqlite'"

echo ""
echo "Starting backend..."
start_session "$BACKEND_SESSION" "$PROJECT_DIR/backend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/backend/src/index.js' > '$PROJECT_DIR/backend.log' 2>&1"

echo "Starting frontend..."
if [ ! -d "$PROJECT_DIR/frontend/dist" ]; then
  npm --prefix "$PROJECT_DIR/frontend" run build
fi
start_session "$FRONTEND_SESSION" "$PROJECT_DIR/frontend" "$COMMON_ENV exec '$NODE_BIN' '$PROJECT_DIR/frontend/static-server.js' > '$PROJECT_DIR/frontend.log' 2>&1"

echo "Waiting for frontend to initialize..."
sleep 8

BACKEND_PID="$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
FRONTEND_PID="$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
if [ -n "$BACKEND_PID" ]; then
  printf '%s\n' "$BACKEND_PID" > "$PROJECT_DIR/backend.pid"
  printf '%s\n' "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
fi
if [ -n "$FRONTEND_PID" ]; then
  printf '%s\n' "$FRONTEND_PID" > "$PROJECT_DIR/frontend.pid"
  printf '%s\n' "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"
fi

echo ""
echo "========================================"
echo "=== Running acceptance checks"
echo "========================================"

# Verification function
verify_service() {
  local name=$1
  local port=$2
  local expected_pid=$3
  local url=$4

  echo ""
  echo "--- Checking $name (port $port, expected pid $expected_pid) ---"

  # Check if port is listening
  local listen_pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  if [ -z "$listen_pid" ]; then
    echo "[FAIL] $name port $port is NOT listening"
    return 1
  else
    echo "[OK] Port $port is listening on PID $listen_pid"
  fi

  local check_pid="$listen_pid"

  # Check process status
  if ps -p "$check_pid" > /dev/null 2>&1; then
    local stat=$(ps -o stat= -p "$check_pid" | xargs)
    case "$stat" in
      T*) echo "[FAIL] Process is stopped (stat=$stat)"
        return 1 ;;
      Z*) echo "[FAIL] Process is zombie (stat=$stat)"
        return 1 ;;
      *) echo "[OK] Process is running (stat=$stat)" ;;
    esac
  else
    echo "[FAIL] Process $check_pid does not exist"
    return 1
  fi

  # Check cwd belongs to project
  local cwd=$(lsof -a -p "$check_pid" -d cwd -Fn | grep '^n' | sed 's/^n//')
  local args=$(ps -o args= -p "$check_pid")
  local belongs=false
  case "$cwd" in
    "$PROJECT_DIR"/*)
      belongs=true
      ;;
  esac
  case "$args" in
    *"$PROJECT_DIR"*)
      belongs=true
      ;;
  esac
  if [ "$belongs" = true ]; then
    echo "[OK] Process belongs to project (cwd=$cwd)"
  else
    echo "[WARN] Process may not belong to project (cwd=$cwd)"
  fi

  # HTTP check
  echo "HTTP request to $url"
  local http_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url" || echo "000")
  if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ] || [ "$http_code" = "304" ]; then
    echo "[OK] HTTP $http_code from $url"
    return 0
  else
    echo "[FAIL] HTTP $http_code from $url"
    return 1
  fi
}

# Run verifications
backend_ok=true
frontend_ok=true

verify_service "Backend" "$BACKEND_PORT" "$BACKEND_PID" "http://127.0.0.1:$BACKEND_PORT/api/health" || backend_ok=false
verify_service "Frontend" "$FRONTEND_PORT" "$FRONTEND_PID" "http://127.0.0.1:$FRONTEND_PORT/" || frontend_ok=false

echo ""
echo "========================================"
echo "=== Summary"
echo "========================================"

if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
  echo "[SUCCESS] All services are running properly!"
  echo ""
  echo "Frontend URL: http://127.0.0.1:$FRONTEND_PORT"
  echo "Backend API:  http://127.0.0.1:$BACKEND_PORT/api"
  echo "Health Check: http://127.0.0.1:$BACKEND_PORT/api/health"
  echo ""
  echo "Logs:"
  echo "  Frontend: $PROJECT_DIR/frontend.log"
  echo "  Backend:  $PROJECT_DIR/backend.log"
  exit 0
else
  echo "[FAILURE] Some services failed to start"
  [ "$backend_ok" = false ] && echo "  - Backend failed"
  [ "$frontend_ok" = false ] && echo "  - Frontend failed"
  echo ""
  echo "Check logs for details:"
  echo "  tail -50 $PROJECT_DIR/backend.log"
  echo "  tail -50 $PROJECT_DIR/frontend.log"
  exit 1
fi
