#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

TAIL4=3468

resolve_node_bin() {
  if [ -n "${NODE_BIN:-}" ] && [ -x "$NODE_BIN" ]; then
    echo "$NODE_BIN"
    return 0
  fi
  for candidate in \
    "$HOME/.nvm/versions/node/v22.22.0/bin/node" \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    "$(command -v node 2>/dev/null || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  echo "node"
}

NODE_BIN="$(resolve_node_bin)"
export NODE_BIN

owner_matches_project() {
  local pid="$1"
  local cwd
  local cmd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  [[ "$cwd" == "$PROJECT_DIR"* || "$cmd" == *"$PROJECT_DIR"* ]]
}

stop_pid_if_project() {
  local pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && owner_matches_project "$pid"; then
    kill "$pid" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      if ! kill -0 "$pid" 2>/dev/null; then
        return
      fi
      sleep 1
    done
    kill -9 "$pid" 2>/dev/null || true
  fi
}

stop_from_pid_file() {
  local pid_file="$1"
  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  stop_pid_if_project "$pid"
}

stop_project_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  if [ -n "$pid" ]; then
    stop_pid_if_project "$pid"
  fi
}

port_available() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  [ -z "$pid" ]
}

find_slot() {
  for slot in 0 1 2 3 4 5; do
    local frontend=$((40000 + slot * 1000 + TAIL4))
    local backend=$((50000 + slot * 1000 + TAIL4))
    if port_available "$frontend" && port_available "$backend"; then
      echo "$frontend $backend"
      return 0
    fi
  done
  return 1
}

stop_from_pid_file "$PROJECT_DIR/backend.pid"
stop_from_pid_file "$PROJECT_DIR/frontend.pid"
stop_project_port "$BACKEND_PORT"
stop_project_port "$FRONTEND_PORT"

read -r NEXT_FRONTEND_PORT NEXT_BACKEND_PORT < <(find_slot)
if [ -z "$NEXT_FRONTEND_PORT" ] || [ -z "$NEXT_BACKEND_PORT" ]; then
  echo "No available port slot for project may-63468" >&2
  exit 1
fi

if [ "$NEXT_FRONTEND_PORT" != "$FRONTEND_PORT" ] || [ "$NEXT_BACKEND_PORT" != "$BACKEND_PORT" ]; then
  echo "Updating .env to frontend=$NEXT_FRONTEND_PORT backend=$NEXT_BACKEND_PORT"
  /usr/bin/sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$NEXT_FRONTEND_PORT/" "$PROJECT_DIR/.env"
  /usr/bin/sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$NEXT_BACKEND_PORT/" "$PROJECT_DIR/.env"
  /usr/bin/sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$NEXT_BACKEND_PORT|" "$PROJECT_DIR/.env"
  /usr/bin/sed -i '' "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://127.0.0.1:$NEXT_BACKEND_PORT|" "$PROJECT_DIR/.env"
  FRONTEND_PORT="$NEXT_FRONTEND_PORT"
  BACKEND_PORT="$NEXT_BACKEND_PORT"
fi

: > "$PROJECT_DIR/backend.log"
: > "$PROJECT_DIR/frontend.log"

echo "=== Starting backend..."
/usr/bin/python3 "$PROJECT_DIR/scripts/daemonize.py" \
  --cwd "$PROJECT_DIR" \
  --env-file "$PROJECT_DIR/.env" \
  --pid-file "$PROJECT_DIR/backend.pid" \
  --log-file "$PROJECT_DIR/backend.log" \
  -- /bin/bash "$PROJECT_DIR/scripts/run-backend.sh"
sleep 1
BACKEND_PID="$(cat "$PROJECT_DIR/backend.pid" 2>/dev/null || true)"
echo "Backend PID: ${BACKEND_PID:-unknown}"

echo "=== Building frontend..."
(cd "$PROJECT_DIR/frontend" && NODE_ENV=production npm run build)

echo "=== Starting frontend..."
/usr/bin/python3 "$PROJECT_DIR/scripts/daemonize.py" \
  --cwd "$PROJECT_DIR" \
  --env-file "$PROJECT_DIR/.env" \
  --pid-file "$PROJECT_DIR/frontend.pid" \
  --log-file "$PROJECT_DIR/frontend.log" \
  -- "$NODE_BIN" "$PROJECT_DIR/scripts/static-server.js"
sleep 2
FRONTEND_PID="$(cat "$PROJECT_DIR/frontend.pid" 2>/dev/null || true)"
echo "Frontend PID: ${FRONTEND_PID:-unknown}"

for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1 &&
     curl -fsSI "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" = "10" ]; then
    curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null
    curl -fsSI "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null
  fi
  sleep 1
done

echo "=== Verification ==="
echo "Frontend URL: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend URL: http://127.0.0.1:$BACKEND_PORT"
