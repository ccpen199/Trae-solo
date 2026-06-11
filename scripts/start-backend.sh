#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    [[ "$key" =~ '^[A-Za-z_][A-Za-z0-9_]*$' ]] || continue
    export "$key=$value"
  done < .env
fi

BACKEND_PORT=${BACKEND_PORT:-59114}
HOST=${HOST:-127.0.0.1}
NODE_BIN=${NODE_BIN:-}
if [ -z "$NODE_BIN" ]; then
  for candidate in \
    "$HOME/.nvm/versions/node/v22.22.0/bin/node" \
    "$HOME/.nvm/versions/node/v22.1.0/bin/node" \
    "$(command -v node)"; do
    if [ -x "$candidate" ]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

if [ -z "$NODE_BIN" ]; then
  echo "ERROR: node executable not found"
  exit 1
fi

pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  if echo "$cmd" | grep -q "api/server.ts" && [ "$cwd" = "$PROJECT_DIR" ]; then
    echo "Stopping existing backend process: $pid"
    kill "$pid" 2>/dev/null || true
    sleep 2
  else
    echo "ERROR: Backend port $BACKEND_PORT is occupied by another process: $pid"
    echo "$cmd"
    exit 1
  fi
fi

echo "Starting backend on 127.0.0.1:$BACKEND_PORT..."
TMUX_BIN=${TMUX_BIN:-$(command -v tmux)}
if [ -z "$TMUX_BIN" ]; then
  echo "ERROR: tmux is required for durable background startup"
  exit 1
fi

SESSION_NAME=pinai_may-89114_backend
"$TMUX_BIN" has-session -t "$SESSION_NAME" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$SESSION_NAME" || true
"$TMUX_BIN" new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" /bin/zsh -lc "BACKEND_PORT='$BACKEND_PORT' PORT='$BACKEND_PORT' HOST='$HOST' BIND_HOST='127.0.0.1' NODE_ENV='${NODE_ENV:-development}' exec '$NODE_BIN' --import tsx/esm api/server.ts > '$PROJECT_DIR/backend.log' 2>&1"

sleep 6

backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$backend_pid" ]; then
  echo "ERROR: Backend not listening on port $BACKEND_PORT"
  cat backend.log
  exit 1
fi

echo "$backend_pid" > .backend.pid
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "Backend started successfully: http://127.0.0.1:$BACKEND_PORT"
