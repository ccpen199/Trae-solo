#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set -a
source "$ROOT/.env"
set +a

stop_project_port() {
  local port="$1"
  local pid cwd

  for pid in $(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true); do
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
    if [[ "$cwd" == "$ROOT" || "$cwd" == "$ROOT"/* ]]; then
      kill "$pid" 2>/dev/null || true
    else
      echo "Port $port is occupied by another project: PID $pid" >&2
      ps -p "$pid" -o pid=,command= >&2 || true
      exit 1
    fi
  done
}

wait_url() {
  local name="$1"
  local url="$2"

  for _ in {1..80}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name ready: $url"
      return
    fi
    sleep 0.25
  done

  echo "$name failed to become ready: $url" >&2
  exit 1
}

tmux kill-session -t may-88935-backend 2>/dev/null || true
tmux kill-session -t may-88935-frontend 2>/dev/null || true
launchctl bootout "gui/$(id -u)" "$ROOT/.launchd/local.may-88935.frontend.plist" >/dev/null 2>&1 || true
launchctl bootout "gui/$(id -u)" "$ROOT/.launchd/local.may-88935.backend.plist" >/dev/null 2>&1 || true

stop_project_port "$BACKEND_PORT"
stop_project_port "$FRONTEND_PORT"
sleep 1

if [[ ! -d "$ROOT/backend/node_modules" ]]; then
  (cd "$ROOT/backend" && npm install)
fi
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  (cd "$ROOT/frontend" && npm install)
fi

(cd "$ROOT/backend" && npm run build)

: >"$ROOT/backend.log"
: >"$ROOT/frontend.log"

tmux new-session -d -s may-88935-backend -c "$ROOT" \
  "bash -lc 'set -a; source .env; set +a; exec node backend/dist/index.js >> backend.log 2>&1'"
tmux new-session -d -s may-88935-frontend -c "$ROOT/frontend" \
  "bash -lc 'set -a; source ../.env; set +a; exec npm run dev -- --host 127.0.0.1 --port \"$FRONTEND_PORT\" >> ../frontend.log 2>&1'"

wait_url backend "http://127.0.0.1:${BACKEND_PORT}/api/health"
wait_url frontend "http://127.0.0.1:${FRONTEND_PORT}/"

lsof -tiTCP:"$BACKEND_PORT" -sTCP:LISTEN | head -n1 > "$ROOT/backend.pid"
lsof -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN | head -n1 > "$ROOT/frontend.pid"

echo "Frontend: http://127.0.0.1:${FRONTEND_PORT}/"
echo "Backend:  http://127.0.0.1:${BACKEND_PORT}"
