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
  local cwd args parent_pid parent_cwd parent_args
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  args="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  parent_pid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
  parent_cwd="$(lsof -a -p "$parent_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  parent_args="$(ps -o command= -p "$parent_pid" 2>/dev/null || true)"
  if [[ "$cwd" == "$PROJECT_DIR"* || "$args" == *"$PROJECT_DIR"* ]]; then
    if [[ -n "$parent_pid" && "$parent_pid" != "1" && ( "$parent_cwd" == "$PROJECT_DIR"* || "$parent_args" == *"$PROJECT_DIR"* ) ]]; then
      kill "$parent_pid" 2>/dev/null || true
    fi
    kill "$pid" 2>/dev/null || true
    for _ in {1..20}; do
      if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
      fi
      sleep 0.25
    done
    echo "Port $port is still occupied by this project after stop: PID=$pid CWD=$cwd"
    exit 1
  else
    echo "Port $port is occupied by another project: PID=$pid CWD=$cwd"
    exit 1
  fi
}

wait_for_frontend() {
  for _ in {1..40}; do
    local pid
    pid="$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
    if [ -n "$pid" ]; then
      echo "$pid" > .frontend.pid
      return 0
    fi
    sleep 0.25
  done
  echo "Frontend did not listen on 127.0.0.1:$FRONTEND_PORT" >&2
  tail -n 80 frontend.log >&2 || true
  exit 1
}

owned_pid_on_port "$FRONTEND_PORT"
: > frontend.log

SESSION_NAME="${PROJECT_NAME:-may-89123}-frontend"
if [ -n "$TMUX_BIN" ]; then
  "$TMUX_BIN" has-session -t "$SESSION_NAME" 2>/dev/null && "$TMUX_BIN" kill-session -t "$SESSION_NAME" 2>/dev/null || true
  "$TMUX_BIN" new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" \
    "exec env HOST='${HOST:-127.0.0.1}' FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' NODE_ENV='${NODE_ENV:-development}' PATH='$PATH' '$NODE_BIN' node_modules/vite/bin/vite.js --host 127.0.0.1 --port '$FRONTEND_PORT' --strictPort >> frontend.log 2>&1"
else
  nohup "$NODE_BIN" node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort </dev/null > frontend.log 2>&1 &
  echo $! > .frontend.pid
  disown "$!" 2>/dev/null || true
fi

wait_for_frontend
