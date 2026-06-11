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

FRONTEND_PORT=${FRONTEND_PORT:-49114}
BACKEND_PORT=${BACKEND_PORT:-59114}
VITE_API_URL=${VITE_API_URL:-http://127.0.0.1:$BACKEND_PORT/api}

pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -n "$pid" ]; then
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  if echo "$cmd" | grep -q "vite" && [ "$cwd" = "$PROJECT_DIR" ]; then
    echo "Stopping existing frontend process: $pid"
    kill "$pid" 2>/dev/null || true
    sleep 2
  else
    echo "ERROR: Frontend port $FRONTEND_PORT is occupied by another process: $pid"
    echo "$cmd"
    exit 1
  fi
fi

echo "Starting frontend on 127.0.0.1:$FRONTEND_PORT..."
TMUX_BIN=${TMUX_BIN:-$(command -v tmux)}
if [ -z "$TMUX_BIN" ]; then
  echo "ERROR: tmux is required for durable background startup"
  exit 1
fi

SESSION_NAME=pinai_may-89114_frontend
"$TMUX_BIN" has-session -t "$SESSION_NAME" >/dev/null 2>&1 && "$TMUX_BIN" kill-session -t "$SESSION_NAME" || true
"$TMUX_BIN" new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR" /bin/zsh -lc "FRONTEND_PORT='$FRONTEND_PORT' BACKEND_PORT='$BACKEND_PORT' VITE_API_URL='$VITE_API_URL' exec npx vite --host 127.0.0.1 --port '$FRONTEND_PORT' --strictPort > '$PROJECT_DIR/frontend.log' 2>&1"

sleep 6

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$frontend_pid" ]; then
  echo "ERROR: Frontend not listening on port $FRONTEND_PORT"
  cat frontend.log
  exit 1
fi

echo "$frontend_pid" > .frontend.pid
curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -5
echo "Frontend started successfully: http://127.0.0.1:$FRONTEND_PORT"
