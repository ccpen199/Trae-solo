#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

TAIL4="8935"

pid_belongs_to_project() {
  local pid=$1
  local cwd
  local cmd

  cwd=$(lsof -p "$pid" -d cwd -F n 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1 || true)
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)

  [[ "$cwd" == "$PROJECT_DIR"* ]] || \
    [[ "$cmd" == *"$PROJECT_DIR"* ]] || \
    lsof -p "$pid" 2>/dev/null | grep -Fq "$PROJECT_DIR"
}

set_env_value() {
  local file=$1
  local key=$2
  local value=$3

  if grep -q "^$key=" "$file"; then
    sed -i '' "s|^$key=.*|$key=$value|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

listening_pid() {
  local port=$1
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true
}

check_port_slot() {
  local slot=$1
  local frontend_port=$((40000 + slot * 1000 + TAIL4))
  local backend_port=$((50000 + slot * 1000 + TAIL4))
  
  local frontend_pid
  local backend_pid
  frontend_pid=$(listening_pid "$frontend_port")
  backend_pid=$(listening_pid "$backend_port")
  
  if [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]; then
    return 0
  fi
  
  if [ -n "$frontend_pid" ]; then
    if pid_belongs_to_project "$frontend_pid"; then
      echo "Killing stale frontend PID $frontend_pid (port $frontend_port)"
      kill "$frontend_pid" 2>/dev/null || true
      sleep 1
    else
      return 1
    fi
  fi
  
  if [ -n "$backend_pid" ]; then
    if pid_belongs_to_project "$backend_pid"; then
      echo "Killing stale backend PID $backend_pid (port $backend_port)"
      kill "$backend_pid" 2>/dev/null || true
      sleep 1
    else
      return 1
    fi
  fi
  
  frontend_pid=$(listening_pid "$frontend_port")
  backend_pid=$(listening_pid "$backend_port")
  [ -z "$frontend_pid" ] && [ -z "$backend_pid" ]
}

FRONTEND_PORT=""
BACKEND_PORT=""
SLOT=0
for slot in 0 1 2 3 4 5; do
  if check_port_slot $slot; then
    SLOT=$slot
    FRONTEND_PORT=$((40000 + slot * 1000 + TAIL4))
    BACKEND_PORT=$((50000 + slot * 1000 + TAIL4))
    break
  fi
done

if [ -z "$FRONTEND_PORT" ]; then
  echo "ERROR: All port slots are occupied by other projects!"
  for slot in 0 1 2 3 4 5; do
    fp=$((40000 + slot * 1000 + TAIL4))
    bp=$((50000 + slot * 1000 + TAIL4))
    fpid=$(listening_pid "$fp")
    bpid=$(listening_pid "$bp")
    [ -n "$fpid" ] && echo "  Slot $slot: FRONTEND_PORT=$fp PID=$fpid CMD=$(ps -o command= -p $fpid 2>/dev/null | head -c 80)"
    [ -n "$bpid" ] && echo "  Slot $slot: BACKEND_PORT=$bp PID=$bpid CMD=$(ps -o command= -p $bpid 2>/dev/null | head -c 80)"
  done
  echo "Please stop the conflicting processes or choose different ports."
  exit 1
fi

echo "Selected slot $SLOT: FRONTEND_PORT=$FRONTEND_PORT, BACKEND_PORT=$BACKEND_PORT"

set_env_value .env FRONTEND_PORT "$FRONTEND_PORT"
set_env_value .env BACKEND_PORT "$BACKEND_PORT"
set_env_value .env FRONTEND_SLOT "$SLOT"
set_env_value .env BACKEND_SLOT "$SLOT"
set_env_value .env API_BASE_URL "http://127.0.0.1:$BACKEND_PORT/api"
set_env_value .env VITE_API_BASE_URL "http://127.0.0.1:$BACKEND_PORT/api"
set_env_value .env CORS_ORIGIN "http://127.0.0.1:$FRONTEND_PORT"

set_env_value backend/.env BACKEND_PORT "$BACKEND_PORT"
set_env_value backend/.env FRONTEND_PORT "$FRONTEND_PORT"
set_env_value backend/.env CORS_ORIGIN "http://127.0.0.1:$FRONTEND_PORT"

cd frontend
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi
echo "Building frontend..."
npm run build

cd ../backend
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi
echo "Building backend..."
npm run build

cd "$PROJECT_DIR"

echo "Starting backend on 127.0.0.1:$BACKEND_PORT..."
tmux kill-session -t may-88935-backend >/dev/null 2>&1 || true
: > "$PROJECT_DIR/backend.log"
tmux new-session -d -s may-88935-backend -c "$PROJECT_DIR/backend" "node dist/index.js >> '$PROJECT_DIR/backend.log' 2>&1"

for _ in {1..80}; do
  if curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
  echo "ERROR: Backend did not become healthy"
  echo "Backend log tail:"
  tail -50 "$PROJECT_DIR/backend.log"
  exit 1
fi
BACKEND_PID=$(listening_pid "$BACKEND_PORT")
echo "Backend PID: $BACKEND_PID"
echo "$BACKEND_PID" > "$PROJECT_DIR/backend.pid"

echo "Starting frontend on 127.0.0.1:$FRONTEND_PORT..."
tmux kill-session -t may-88935-frontend >/dev/null 2>&1 || true
: > "$PROJECT_DIR/frontend.log"
tmux new-session -d -s may-88935-frontend -c "$PROJECT_DIR" "python3 '$PROJECT_DIR/frontend.py' >> '$PROJECT_DIR/frontend.log' 2>&1"

for _ in {1..80}; do
  if curl -fsS "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! curl -fsS "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null 2>&1; then
  echo "ERROR: Frontend did not become healthy"
  echo "Frontend log tail:"
  tail -50 "$PROJECT_DIR/frontend.log"
  exit 1
fi
FRONTEND_PID=$(listening_pid "$FRONTEND_PORT")
echo "Frontend PID: $FRONTEND_PID"
echo "$FRONTEND_PID" > "$PROJECT_DIR/frontend.pid"

echo "=== Service Verification ==="

PROJECT_DIR="$PROJECT_DIR"
frontend_pid=$(listening_pid "$FRONTEND_PORT")
backend_pid=$(listening_pid "$BACKEND_PORT")

echo "Frontend port $FRONTEND_PORT PID: ${frontend_pid:-NOT LISTENING}"
echo "Backend port $BACKEND_PORT PID: ${backend_pid:-NOT LISTENING}"

if [ -n "$frontend_pid" ]; then
  echo "--- Frontend Process Info ---"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command=
  echo "cwd=$(lsof -p "$frontend_pid" -d cwd -F n 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1 || true)"
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  echo "Frontend status: $frontend_stat"
  case "$frontend_stat" in
    T*|Z*) echo "ERROR: Frontend process is in bad state: $frontend_stat" && exit 1 ;;
  esac
fi

if [ -n "$backend_pid" ]; then
  echo "--- Backend Process Info ---"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command=
  echo "cwd=$(lsof -p "$backend_pid" -d cwd -F n 2>/dev/null | grep '^n' | sed 's/^n//' | head -n1 || true)"
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  echo "Backend status: $backend_stat"
  case "$backend_stat" in
    T*|Z*) echo "ERROR: Backend process is in bad state: $backend_stat" && exit 1 ;;
  esac
fi

echo "--- HTTP Health Checks ---"

echo "Checking frontend http://127.0.0.1:$FRONTEND_PORT/"
frontend_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ || echo "000")
echo "Frontend HTTP status: $frontend_http"
if [ "$frontend_http" != "200" ]; then
  echo "ERROR: Frontend returned HTTP $frontend_http"
  echo "Frontend log tail:"
  tail -30 "$PROJECT_DIR/frontend.log"
  exit 1
fi

echo "Checking backend http://127.0.0.1:$BACKEND_PORT/api/health"
backend_response=$(curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health || echo "FAILED")
echo "Backend response: $backend_response"
if echo "$backend_response" | grep -q '"status":"ok"'; then
  echo "Backend health check: PASSED"
else
  echo "ERROR: Backend health check failed"
  echo "Backend log tail:"
  tail -30 "$PROJECT_DIR/backend.log"
  exit 1
fi

echo ""
echo "=========================================="
echo "  ✅ All services started successfully!"
echo "=========================================="
echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT/api"
echo "  Frontend PID: $frontend_pid"
echo "  Backend PID:  $backend_pid"
echo "  Logs:"
echo "    - frontend.log"
echo "    - backend.log"
echo "=========================================="
