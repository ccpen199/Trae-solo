#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49100}
BACKEND_PORT=${BACKEND_PORT:-59100}
NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi
NODE_DIR="$(dirname "$NODE_BIN")"
export PATH="$NODE_DIR:$PATH"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"
if [ ! -x "$TMUX_BIN" ]; then
  TMUX_BIN="$(command -v tmux || true)"
fi

start_detached() {
  local session=$1
  local cwd=$2
  local command=$3

  if [ -n "$TMUX_BIN" ] && [ -x "$TMUX_BIN" ]; then
    "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$session" || true
    "$TMUX_BIN" new-session -d -s "$session" -c "$cwd" /bin/zsh -lc "$command"
  else
    (
      cd "$cwd"
      nohup /bin/zsh -lc "$command" >/dev/null 2>&1 &
      disown
    )
  fi
}

echo "=== Starting Project Services ==="
echo "PROJECT_DIR=$PROJECT_DIR"
echo "FRONTEND_PORT=$FRONTEND_PORT"
echo "BACKEND_PORT=$BACKEND_PORT"
echo "NODE_BIN=$NODE_BIN"
echo "TMUX_BIN=${TMUX_BIN:-none}"
echo ""

"$SCRIPT_DIR/port-manager.sh"

export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)

echo ""
echo "Starting backend (port $BACKEND_PORT)..."
start_detached "pinai_${PROJECT_NAME}_backend" "$PROJECT_DIR" "PATH='$NODE_DIR':\$PATH FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' exec '$NODE_BIN' --import tsx api/server.ts > '$PROJECT_DIR/backend.log' 2>&1"
echo "Backend session started"

sleep 3

echo ""
echo "Starting frontend (port $FRONTEND_PORT)..."
start_detached "pinai_${PROJECT_NAME}_frontend" "$PROJECT_DIR" "PATH='$NODE_DIR':\$PATH FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' exec '$NODE_BIN' node_modules/vite/bin/vite.js --host 127.0.0.1 --port '$FRONTEND_PORT' --strictPort > '$PROJECT_DIR/frontend.log' 2>&1"
echo "Frontend session started"

echo ""
echo "Waiting 5 seconds for services to initialize..."
sleep 5

echo ""
echo "=== Verification ==="
"$SCRIPT_DIR/check.sh"

echo ""
echo "=== Access URLs ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "API:      http://127.0.0.1:$BACKEND_PORT/api"
echo ""
echo "Logs:"
echo "  Frontend: $PROJECT_DIR/frontend.log"
echo "  Backend:  $PROJECT_DIR/backend.log"
echo ""
echo "To stop: ./scripts/stop.sh"
echo "To check: ./scripts/check.sh"
