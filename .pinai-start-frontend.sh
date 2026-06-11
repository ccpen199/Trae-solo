#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
TMUX_BIN="${TMUX_BIN:-$(command -v tmux || true)}"
HOST="${HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-49124}"
BACKEND_PORT="${BACKEND_PORT:-59124}"
NODE_ENV="${NODE_ENV:-development}"

pid_belongs_to_project() {
  local pid="$1"
  local cwd args
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  args="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  [[ "$cwd" == "$PROJECT_DIR"* || "$args" == *"$PROJECT_DIR"* ]]
}

stop_owned_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -n "$pid" ] || return 0
  if pid_belongs_to_project "$pid"; then
    kill "$pid" 2>/dev/null || true
    sleep 1
  else
    echo "Port $port is occupied by another project: PID=$pid"
    exit 1
  fi
}

stop_owned_port "$FRONTEND_PORT"
: > frontend.log

SESSION_NAME="${PROJECT_NAME:-may-89124}-frontend"
if [ -n "$TMUX_BIN" ]; then
  "$TMUX_BIN" has-session -t "$SESSION_NAME" 2>/dev/null && "$TMUX_BIN" kill-session -t "$SESSION_NAME" 2>/dev/null || true
  "$TMUX_BIN" new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" \
    "echo \$\$ > frontend.pid; exec env HOST='$HOST' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' NODE_ENV='$NODE_ENV' '$NODE_BIN' node_modules/vite/bin/vite.js --host '$HOST' --port '$FRONTEND_PORT' --strictPort >> frontend.log 2>&1"
else
  nohup env \
    HOST="$HOST" \
    FRONTEND_PORT="$FRONTEND_PORT" \
    BACKEND_PORT="$BACKEND_PORT" \
    NODE_ENV="$NODE_ENV" \
    "$NODE_BIN" node_modules/vite/bin/vite.js --host "$HOST" --port "$FRONTEND_PORT" --strictPort \
    </dev/null >> frontend.log 2>&1 &
  echo $! > frontend.pid
fi
