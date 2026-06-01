#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

python3 scripts/port_check.py
set -a
source "$PROJECT_DIR/.env"
set +a

mkdir -p "$PROJECT_DIR/data"

rm -f "$PROJECT_DIR/data/app.sqlite"

BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}/api/health"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}/"

url_ok() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 "$url" 2>/dev/null || true)"
  [[ "$code" == "200" ]]
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"

  for _ in $(seq 1 "$attempts"); do
    if url_ok "$url"; then
      echo "$label healthy: $url"
      return 0
    fi
    sleep 0.5
  done

  echo "$label failed to become healthy: $url" >&2
  return 1
}

if url_ok "$BACKEND_URL"; then
  echo "Backend already healthy: $BACKEND_URL"
else
  echo "Starting backend on 127.0.0.1:${BACKEND_PORT}"
  : > "$PROJECT_DIR/backend.log"
  python3 "$PROJECT_DIR/scripts/daemonize.py" \
    --cwd "$PROJECT_DIR" \
    --pid-file "$PROJECT_DIR/backend.pid" \
    --log-file "$PROJECT_DIR/backend.log" \
    -- python3 -u "$PROJECT_DIR/backend/server.py" >/dev/null
fi

if ! wait_for_url "$BACKEND_URL" "Backend"; then
  tail -80 "$PROJECT_DIR/backend.log" >&2 || true
  exit 1
fi

if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$PROJECT_DIR/frontend"
  npm install
  cd "$PROJECT_DIR"
fi

FRONTEND_PID=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)
if [ -n "$FRONTEND_PID" ]; then
  echo "Frontend already running on port $FRONTEND_PORT (PID: $FRONTEND_PID)"
else
  echo "Starting frontend on 127.0.0.1:${FRONTEND_PORT}"
  : > "$PROJECT_DIR/frontend.log"
  cd "$PROJECT_DIR/frontend"
  nohup npx vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
  echo $! > "$PROJECT_DIR/frontend.pid"
  cd "$PROJECT_DIR"
fi

if ! wait_for_url "$FRONTEND_URL" "Frontend"; then
  tail -80 "$PROJECT_DIR/frontend.log" >&2 || true
  exit 1
fi

echo ""
echo "======================================"
echo "  设计稿评审协作平台 已启动"
echo "======================================"
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: http://127.0.0.1:${BACKEND_PORT}"
echo "Backend health: $BACKEND_URL"
echo "======================================"
