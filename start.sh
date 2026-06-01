#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

source .env

RAW_NUM="${PROJECT_DIR##*-}"
TAIL4=$(printf "%04d" $((10#$RAW_NUM % 10000)))
SLOT_BASE_FE=40000
SLOT_BASE_BE=50000
SLOT_OFFSETS=(0 1000 2000 3000 4000 5000)

resolve_port() {
  local BASE=$1
  local PORT_VAR=$2
  local PORT_VAL=${!PORT_VAR}

  if [ -z "$PORT_VAL" ]; then
    PORT_VAL=$((BASE + TAIL4))
  fi

  for OFFSET in "${SLOT_OFFSETS[@]}"; do
    local CANDIDATE=$((BASE + OFFSET + TAIL4))
    if ! lsof -nP -iTCP:$CANDIDATE -sTCP:LISTEN -t >/dev/null 2>&1; then
      eval "$PORT_VAR=$CANDIDATE"
      return 0
    fi
    local OCCUPYING_PID=$(lsof -nP -iTCP:$CANDIDATE -sTCP:LISTEN -t 2>/dev/null | head -n1)
    if [ -n "$OCCUPYING_PID" ]; then
      local OCCUPYING_CWD=$(ps -o cwd= -p "$OCCUPYING_PID" 2>/dev/null | xargs)
      if [ "$OCCUPYING_CWD" = "$PROJECT_DIR" ] || [[ "$OCCUPYING_CWD" == "$PROJECT_DIR"/* ]]; then
        eval "$PORT_VAR=$CANDIDATE"
        return 0
      fi
    fi
  done

  echo "ERROR: All port slots occupied for $PORT_VAR"
  for OFFSET in "${SLOT_OFFSETS[@]}"; do
    local P=$((BASE + OFFSET + TAIL4))
    local PID=$(lsof -nP -iTCP:$P -sTCP:LISTEN -t 2>/dev/null | head -n1)
    echo "  Port $P occupied by PID $PID"
  done
  return 1
}

resolve_port $SLOT_BASE_FE FRONTEND_PORT || exit 1
resolve_port $SLOT_BASE_BE BACKEND_PORT || exit 1

echo "FRONTEND_PORT=$FRONTEND_PORT" > .env
echo "BACKEND_PORT=$BACKEND_PORT" >> .env

echo "Resolved ports: FRONTEND=$FRONTEND_PORT BACKEND=$BACKEND_PORT"

for PORT_VAR in FRONTEND_PORT BACKEND_PORT; do
  PORT_VAL=${!PORT_VAR}
  EXISTING_PID=$(lsof -nP -iTCP:$PORT_VAL -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$EXISTING_PID" ]; then
    EXISTING_CWD=$(ps -o cwd= -p "$EXISTING_PID" 2>/dev/null | xargs)
    EXISTING_CMD=$(ps -o command= -p "$EXISTING_PID" 2>/dev/null)
    case "$EXISTING_CWD" in
      "$PROJECT_DIR"/*)
        echo "Stopping existing $PORT_VAR process PID=$EXISTING_PID"
        kill "$EXISTING_PID" 2>/dev/null || true
        sleep 1
        ;;
      *)
        echo "Port $PORT_VAL occupied by external process (PID=$EXISTING_PID cwd=$EXISTING_CWD cmd=$EXISTING_CMD)"
        echo "Switching to next slot..."
        resolve_port $(echo $PORT_VAR | sed 's/PORT//')_BASE $PORT_VAR || exit 1
        ;;
    esac
  fi
done

echo "Starting backend..."
cd "$PROJECT_DIR/backend"
nohup node src/index.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "Starting frontend..."
cd "$PROJECT_DIR/frontend"
nohup npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "Waiting 6 seconds for services to start..."
sleep 6

echo "Checking backend (PID $BACKEND_PID)..."
BACKEND_CHECK_PID=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$BACKEND_CHECK_PID" ]; then
  echo "ERROR: Backend not listening on port $BACKEND_PORT"
  cat "$PROJECT_DIR/backend.log"
  exit 1
fi
BACKEND_STAT=$(ps -o stat= -p "$BACKEND_CHECK_PID" 2>/dev/null)
if [[ "$BACKEND_STAT" == *T* ]] || [[ "$BACKEND_STAT" == *Z* ]]; then
  echo "ERROR: Backend process in bad state: $BACKEND_STAT"
  cat "$PROJECT_DIR/backend.log"
  exit 1
fi
HEALTH=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1 || true)
echo "Backend health: $HEALTH"

echo "Checking frontend (PID $FRONTEND_PID)..."
FRONTEND_CHECK_PID=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$FRONTEND_CHECK_PID" ]; then
  echo "ERROR: Frontend not listening on port $FRONTEND_PORT"
  cat "$PROJECT_DIR/frontend.log"
  exit 1
fi
FRONTEND_STAT=$(ps -o stat= -p "$FRONTEND_CHECK_PID" 2>/dev/null)
if [[ "$FRONTEND_STAT" == *T* ]] || [[ "$FRONTEND_STAT" == *Z* ]]; then
  echo "ERROR: Frontend process in bad state: $FRONTEND_STAT"
  cat "$PROJECT_DIR/frontend.log"
  exit 1
fi
FRONTEND_HTTP=$(curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -1 || true)
echo "Frontend HTTP: $FRONTEND_HTTP"

echo ""
echo "=========================================="
echo "  换电站运营系统已启动"
echo "=========================================="
echo "  前端: http://127.0.0.1:$FRONTEND_PORT"
echo "  后端: http://127.0.0.1:$BACKEND_PORT"
echo "=========================================="
