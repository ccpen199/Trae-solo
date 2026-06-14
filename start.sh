#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
MANAGE_PORTS="$PROJECT_DIR/manage-ports.sh"
FRONTEND_LOG="$PROJECT_DIR/frontend.log"
BACKEND_LOG="$PROJECT_DIR/backend.log"
FRONTEND_PID_FILE="$PROJECT_DIR/frontend.pid"
BACKEND_PID_FILE="$PROJECT_DIR/backend.pid"

chmod +x "$MANAGE_PORTS"

function load_env() {
  if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r key value; do
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      export "$key=$value"
    done < "$ENV_FILE"
  fi
}

function wait_for_port() {
  local port=$1
  local max_attempts=15
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
  return 1
}

function verify_process() {
  local pid=$1
  if [ -z "$pid" ]; then
    return 1
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi
  local stat=$(ps -o stat= -p "$pid" 2>/dev/null || true)
  case "$stat" in
    T*|Z*) return 1 ;;
  esac
  return 0
}

echo "=== Starting may-89086 Project ==="
echo "Project dir: $PROJECT_DIR"
echo ""

load_env

echo "Step 1: Checking ports..."
bash "$MANAGE_PORTS" check
echo ""

echo "Step 2: Stopping existing project processes (if any)..."
bash "$MANAGE_PORTS" kill-all || true
echo ""

echo "Step 3: Ensuring ports are available..."
"$MANAGE_PORTS" switch 2>/dev/null || true
load_env
echo "Using ports: FRONTEND=$FRONTEND_PORT, BACKEND=$BACKEND_PORT"
echo ""

echo "Step 4: Starting backend (log: backend.log)..."
cd "$PROJECT_DIR/backend"
: > "$BACKEND_LOG"
nohup node server.js > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo "Backend PID: $BACKEND_PID"
echo ""

echo "Step 5: Starting frontend (log: frontend.log)..."
cd "$PROJECT_DIR/frontend"
: > "$FRONTEND_LOG"
nohup node server.js > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
echo "Frontend PID: $FRONTEND_PID"
echo ""

echo "Step 6: Waiting for services to start (10s)..."
sleep 10
echo ""

echo "Step 7: Verifying backend..."
if ! wait_for_port "$BACKEND_PORT"; then
  echo "ERROR: Backend failed to start on port $BACKEND_PORT"
  echo "Check backend.log for details"
  tail -20 "$BACKEND_LOG"
  exit 1
fi
if ! verify_process "$BACKEND_PID"; then
  echo "ERROR: Backend process is not healthy"
  exit 1
fi
echo "Backend is running on port $BACKEND_PORT"
echo ""

echo "Step 8: Verifying frontend..."
if ! wait_for_port "$FRONTEND_PORT"; then
  echo "ERROR: Frontend failed to start on port $FRONTEND_PORT"
  echo "Check frontend.log for details"
  tail -20 "$FRONTEND_LOG"
  exit 1
fi
if ! verify_process "$FRONTEND_PID"; then
  echo "ERROR: Frontend process is not healthy"
  exit 1
fi
echo "Frontend is running on port $FRONTEND_PORT"
echo ""

echo "Step 9: Running acceptance checks..."
cd "$PROJECT_DIR"
bash "$PROJECT_DIR/acceptance.sh"
echo ""

echo "=== Startup Complete ==="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo "Health API:   $API_BASE_URL/health"
echo ""
echo "Frontend PID: $FRONTEND_PID (see frontend.log)"
echo "Backend PID:  $BACKEND_PID (see backend.log)"
echo ""
echo "To stop: bash manage-ports.sh kill-all"
