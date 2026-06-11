#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
TMUX_BIN="${TMUX_BIN:-$(command -v tmux || true)}"

owned_pid_on_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -n "$pid" ] || return 0
  local cwd args
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  args="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  if [[ "$cwd" == "$PROJECT_DIR"* || "$args" == *"$PROJECT_DIR"* ]]; then
    kill "$pid" 2>/dev/null || true
    sleep 1
  else
    echo "Port $port is occupied by another project: PID=$pid CWD=$cwd"
    exit 1
  fi
}

owned_pid_on_port "$BACKEND_PORT"
: > backend.log

SESSION_NAME="${PROJECT_NAME:-may-89123}-backend"
if [ -n "$TMUX_BIN" ]; then
  "$TMUX_BIN" has-session -t "$SESSION_NAME" 2>/dev/null && "$TMUX_BIN" kill-session -t "$SESSION_NAME" 2>/dev/null || true
  "$TMUX_BIN" new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" \
    "echo \$\$ > .backend.pid; exec env HOST='${HOST:-127.0.0.1}' BACKEND_PORT='$BACKEND_PORT' NODE_ENV='${NODE_ENV:-development}' PATH='$PATH' '$NODE_BIN' api/server.mjs >> backend.log 2>&1"
else
  nohup "$NODE_BIN" api/server.mjs </dev/null > backend.log 2>&1 &
  echo $! > .backend.pid
  disown "$!" 2>/dev/null || true
fi
