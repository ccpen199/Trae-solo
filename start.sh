#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

source .env

check_port() {
  local port=$1
  lsof -nP -iTCP:$port -sTCP:LISTEN -t >/dev/null 2>&1
}

kill_process_for_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"*)
        echo "Killing process $pid (cwd: $cwd) on port $port"
        kill "$pid" 2>/dev/null || true
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
          kill -9 "$pid" 2>/dev/null || true
          sleep 1
        fi
        ;;
      *)
        echo "Warning: Port $port is occupied by process $pid (cwd: $cwd, cmd: $cmd) which does not belong to this project"
        return 1
        ;;
    esac
  fi
  return 0
}

echo "Checking ports..."

if check_port "$FRONTEND_PORT"; then
  echo "Frontend port $FRONTEND_PORT is occupied"
  if ! kill_process_for_port "$FRONTEND_PORT"; then
    echo "Trying next port slot..."
    FRONTEND_PORT=$((41000 + 3483))
    BACKEND_PORT=$((51000 + 3483))
    if check_port "$FRONTEND_PORT" || check_port "$BACKEND_PORT"; then
      echo "Error: All port slots are occupied. Please free up ports manually."
      exit 1
    fi
    sed -i.bak "s/FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" .env
    sed -i.bak "s/BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" .env
    sed -i.bak "s|API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
    sed -i.bak "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
    rm -f .env.bak
    echo "Updated ports: FRONTEND_PORT=$FRONTEND_PORT, BACKEND_PORT=$BACKEND_PORT"
  fi
fi

if check_port "$BACKEND_PORT"; then
  echo "Backend port $BACKEND_PORT is occupied"
  if ! kill_process_for_port "$BACKEND_PORT"; then
    echo "Error: Backend port $BACKEND_PORT cannot be freed"
    exit 1
  fi
fi

echo "Installing dependencies..."

if [ ! -d "backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd "$PROJECT_DIR/backend"
  npm install --silent
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$PROJECT_DIR/frontend"
  npm install --silent
fi

cd "$PROJECT_DIR"

: > "$PROJECT_DIR/backend.log"
: > "$PROJECT_DIR/frontend.log"

echo "Starting backend server..."
cd "$PROJECT_DIR/backend"
(
  exec node src/index.js
) >> "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/backend.pid"
echo "Backend PID: $BACKEND_PID"

echo "Starting frontend server..."
cd "$PROJECT_DIR/frontend"
(
  exec node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
) >> "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/frontend.pid"
echo "Frontend PID: $FRONTEND_PID"

echo "Waiting for servers to start..."
sleep 8

echo "Verifying backend..."
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -z "$backend_pid" ]; then
  echo "Error: Backend failed to start on port $BACKEND_PORT"
  echo "Backend log:"
  cat "$PROJECT_DIR/backend.log"
  exit 1
fi
backend_stat=$(ps -o stat= -p "$backend_pid")
if [[ "$backend_stat" == *T* ]] || [[ "$backend_stat" == *Z* ]]; then
  echo "Error: Backend process is not running properly (stat: $backend_stat)"
  exit 1
fi
echo "Backend is running on port $BACKEND_PORT (PID: $backend_pid, stat: $backend_stat)"

echo "Verifying frontend..."
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -z "$frontend_pid" ]; then
  echo "Error: Frontend failed to start on port $FRONTEND_PORT"
  echo "Frontend log:"
  cat "$PROJECT_DIR/frontend.log"
  exit 1
fi
frontend_stat=$(ps -o stat= -p "$frontend_pid")
if [[ "$frontend_stat" == *T* ]] || [[ "$frontend_stat" == *Z* ]]; then
  echo "Error: Frontend process is not running properly (stat: $frontend_stat)"
  exit 1
fi
echo "Frontend is running on port $FRONTEND_PORT (PID: $frontend_pid, stat: $frontend_stat)"

echo "Testing backend health..."
health_check=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" || echo "FAILED")
if [[ "$health_check" != *"ok"* ]]; then
  echo "Error: Backend health check failed"
  echo "Response: $health_check"
  exit 1
fi
echo "Backend health check passed"

echo "Testing frontend..."
frontend_check=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" || echo "000")
if [[ "$frontend_check" != "200" ]]; then
  echo "Error: Frontend HTTP check failed"
  echo "Response: $frontend_check"
  exit 1
fi
echo "Frontend HTTP check passed"

echo ""
echo "============================================"
echo "  Servers started successfully!"
echo "============================================"
echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT/"
echo "  Health:   http://127.0.0.1:$BACKEND_PORT/api/health"
echo "============================================"
echo "  Frontend PID: $frontend_pid"
echo "  Backend PID:  $backend_pid"
echo "============================================"
echo ""
echo "Test accounts (password: 123456):"
echo "  - admin (管理员)"
echo "  - teacher1 (班主任)"
echo "  - coach1 (教练)"
echo "  - student1 (学员)"
echo ""
echo "Logs:"
echo "  - Frontend: $PROJECT_DIR/frontend.log"
echo "  - Backend:  $PROJECT_DIR/backend.log"
echo ""
echo "To stop servers, use the stop.sh script"
echo ""
