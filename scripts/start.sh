#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== Starting $PROJECT_NAME ==="

ensure_ports_available || exit 1

echo ""
echo "Port configuration:"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"
echo "  FRONTEND_URL=$FRONTEND_URL"
echo "  BACKEND_URL=$BACKEND_URL"
echo ""

NODE_BIN="${NODE_BIN:-$(command -v node)}"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"
if [ ! -x "$TMUX_BIN" ]; then
    TMUX_BIN="$(command -v tmux || true)"
fi
if [ -z "$TMUX_BIN" ] || [ ! -x "$TMUX_BIN" ]; then
    echo "ERROR: tmux is required for durable background startup"
    exit 1
fi

start_session() {
    local session="$1"
    local cwd="$2"
    local command="$3"
    "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$session" || true
    "$TMUX_BIN" new-session -d -s "$session" -c "$cwd" /bin/zsh -lc "$command"
}

safe_kill "$FRONTEND_PORT" || true
safe_kill "$BACKEND_PORT" || true

sleep 1

BACKEND_APP_DIR="${BACKEND_DIR:-backend}"
FRONTEND_APP_DIR="${FRONTEND_DIR:-frontend}"
BACKEND_PATH="$PROJECT_DIR/$BACKEND_APP_DIR"
FRONTEND_PATH="$PROJECT_DIR/$FRONTEND_APP_DIR"

echo ""
echo "Starting backend from $BACKEND_APP_DIR..."
cd "$PROJECT_DIR"
if [ -f "$BACKEND_PATH/src/server.js" ]; then
    start_session "pinai_${PROJECT_NAME}_backend" "$BACKEND_PATH" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='${BIND_HOST:-127.0.0.1}' BIND_HOST='${BIND_HOST:-127.0.0.1}' PORT='$BACKEND_PORT' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' CORS_ORIGIN='${CORS_ORIGIN:-http://127.0.0.1:$FRONTEND_PORT}' exec '$NODE_BIN' src/server.js > '$PROJECT_DIR/backend.log' 2>&1"
    echo "Backend tmux session started"
elif [ -f "$BACKEND_PATH/package.json" ]; then
    start_session "pinai_${PROJECT_NAME}_backend" "$BACKEND_PATH" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='${BIND_HOST:-127.0.0.1}' BIND_HOST='${BIND_HOST:-127.0.0.1}' PORT='$BACKEND_PORT' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' CORS_ORIGIN='${CORS_ORIGIN:-http://127.0.0.1:$FRONTEND_PORT}' npm run dev > '$PROJECT_DIR/backend.log' 2>&1"
    echo "Backend tmux session started"
elif [ -f "$BACKEND_PATH/app.py" ] || [ -f "$BACKEND_PATH/main.py" ]; then
    start_session "pinai_${PROJECT_NAME}_backend" "$BACKEND_PATH" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='${BIND_HOST:-127.0.0.1}' BIND_HOST='${BIND_HOST:-127.0.0.1}' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' CORS_ORIGIN='${CORS_ORIGIN:-http://127.0.0.1:$FRONTEND_PORT}' python app.py > '$PROJECT_DIR/backend.log' 2>&1"
    echo "Backend tmux session started"
else
    echo "WARNING: Backend code not found yet, skipping backend start"
fi

echo ""
echo "Starting frontend from $FRONTEND_APP_DIR..."
cd "$PROJECT_DIR"
if [ -f "$FRONTEND_PATH/src/static-server.js" ]; then
    start_session "pinai_${PROJECT_NAME}_frontend" "$FRONTEND_PATH" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='${BIND_HOST:-127.0.0.1}' BIND_HOST='${BIND_HOST:-127.0.0.1}' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' API_BASE_URL='${API_BASE_URL:-http://127.0.0.1:$BACKEND_PORT/api}' VITE_API_URL='${VITE_API_URL:-http://127.0.0.1:$BACKEND_PORT/api}' exec '$NODE_BIN' src/static-server.js > '$PROJECT_DIR/frontend.log' 2>&1"
    echo "Frontend tmux session started"
elif [ -f "$FRONTEND_PATH/package.json" ]; then
    start_session "pinai_${PROJECT_NAME}_frontend" "$FRONTEND_PATH" "PROJECT_DIR='$PROJECT_DIR' PROJECT_NAME='$PROJECT_NAME' HOST='${BIND_HOST:-127.0.0.1}' BIND_HOST='${BIND_HOST:-127.0.0.1}' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' API_BASE_URL='${API_BASE_URL:-http://127.0.0.1:$BACKEND_PORT/api}' VITE_API_URL='${VITE_API_URL:-http://127.0.0.1:$BACKEND_PORT/api}' npm run dev > '$PROJECT_DIR/frontend.log' 2>&1"
    echo "Frontend tmux session started"
else
    echo "WARNING: Frontend code not found yet, skipping frontend start"
fi

echo ""
echo "Waiting 5 seconds for services to initialize..."
sleep 5

echo ""
echo "=== Verification ==="

cd "$PROJECT_DIR"

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

if [ -n "$frontend_pid" ]; then
    printf '%s\n' "$frontend_pid" > "$PROJECT_DIR/frontend.pid"
    printf '%s\n' "$frontend_pid" > "$PROJECT_DIR/.frontend.pid"
    ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
    check_process_health "$frontend_pid" "$FRONTEND_PORT" "Frontend" || true
else
    echo "Frontend not listening on port $FRONTEND_PORT yet"
fi

if [ -n "$backend_pid" ]; then
    printf '%s\n' "$backend_pid" > "$PROJECT_DIR/backend.pid"
    printf '%s\n' "$backend_pid" > "$PROJECT_DIR/.backend.pid"
    ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
    check_process_health "$backend_pid" "$BACKEND_PORT" "Backend" || true
else
    echo "Backend not listening on port $BACKEND_PORT yet"
fi

echo ""
curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>&1 || true
echo ""
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || true

echo ""
echo "=== Access URLs ==="
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BACKEND_URL/api"
echo "Backend Health: $BACKEND_URL/api/health"
echo ""
echo "Logs:"
echo "  Frontend: $PROJECT_DIR/frontend.log"
echo "  Backend: $PROJECT_DIR/backend.log"
echo ""
echo "Use scripts/stop.sh to stop services"
echo "Use scripts/verify.sh to verify services"
