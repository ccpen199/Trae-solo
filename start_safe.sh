#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89083"
cd "$PROJECT_DIR"

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "ERROR: .env file not found"
  exit 1
fi

FRONTEND_PORT=${FRONTEND_PORT:-50083}
BACKEND_PORT=${BACKEND_PORT:-60083}

NODE22_BIN="$HOME/.nvm/versions/node/v22.22.0/bin"
if [ -x "$NODE22_BIN/node" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

echo "========================================="
echo "Starting may-89083 services"
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "========================================="

# ==========================================
# Step 1: Safe kill of existing processes
# ==========================================
safe_kill() {
  local PORT=$1
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    # Get cwd - use lsof which is more reliable
    local pid_cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "")
    if [ -z "$pid_cwd" ]; then
      # Fallback to /proc on mac
      pid_cwd=$(ps -p "$pid" -o cwd= 2>/dev/null | awk '{$1=$1};1' || echo "")
    fi
    local cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -n1 || echo "")
    
    echo "Port $PORT occupied by PID=$pid, CWD=$pid_cwd"
    echo "CMD=$cmd"
    
    # Check if it belongs to THIS project
    if [[ "$pid_cwd" == "$PROJECT_DIR"* ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
      echo "=> Killing process (belongs to this project)"
      kill "$pid" 2>/dev/null || true
      sleep 2
      # Force kill if still alive
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
      fi
    else
      echo "=> SKIPPING: Process does NOT belong to this project"
      exit 1
    fi
  else
    echo "Port $PORT: free"
  fi
}

safe_kill $FRONTEND_PORT
safe_kill $BACKEND_PORT

# Also kill any orphaned nodemon/node processes from this project
for pid in $(pgrep -f "nodemon\|node" 2>/dev/null); do
  pid_cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "")
  if [[ "$pid_cwd" == "$PROJECT_DIR"* ]]; then
    cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -n1 || echo "")
    if [[ "$cmd" == *"server.js"* ]] || [[ "$cmd" == *"vite"* ]]; then
      echo "Killing orphan $pid: $cmd"
      kill "$pid" 2>/dev/null || true
      sleep 0.5
    fi
  fi
done

# ==========================================
# Step 2: Initialize database if needed
# ==========================================
if [ ! -f "$PROJECT_DIR/backend/data/app.sqlite" ]; then
  echo "Initializing database..."
  cd "$PROJECT_DIR/backend"
  npm run init-db
  cd "$PROJECT_DIR"
fi

# ==========================================
# Step 3: Start backend
# ==========================================
echo ""
echo "Starting backend on port $BACKEND_PORT..."
cd "$PROJECT_DIR"
node "$PROJECT_DIR/start_detached.js" backend
BACKEND_PID=$(cat "$PROJECT_DIR/backend.pid")
echo "Backend started PID=$BACKEND_PID"

# ==========================================
# Step 4: Start frontend
# ==========================================
echo ""
echo "Starting frontend on port $FRONTEND_PORT..."
cd "$PROJECT_DIR"
node "$PROJECT_DIR/start_detached.js" frontend
FRONTEND_PID=$(cat "$PROJECT_DIR/frontend.pid")
echo "Frontend started PID=$FRONTEND_PID"

# ==========================================
# Step 5: Wait and verify
# ==========================================
echo ""
echo "Waiting 20 seconds for services to initialize..."
sleep 20

echo ""
echo "========================================="
echo "VERIFICATION"
echo "========================================="

# Check ports
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "Frontend port $FRONTEND_PORT: ${frontend_pid:+PID=$frontend_pid}${frontend_pid:-NOT LISTENING}"
echo "Backend port $BACKEND_PORT:  ${backend_pid:+PID=$backend_pid}${backend_pid:-NOT LISTENING}"

# Process details
if [ -n "$frontend_pid" ]; then
  f_cwd=$(lsof -p "$frontend_pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "UNKNOWN")
  echo "Frontend CWD: $f_cwd"
fi
if [ -n "$backend_pid" ]; then
  b_cwd=$(lsof -p "$backend_pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "UNKNOWN")
  echo "Backend CWD: $b_cwd"
fi

# HTTP checks
echo ""
echo "--- HTTP Health Checks ---"
set +e
HTTP_BACK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://127.0.0.1:$BACKEND_PORT/api/health" || echo "000")
echo "Backend /api/health: $HTTP_BACK"
if [ "$HTTP_BACK" = "200" ]; then
  echo "Backend health response:"
  curl -sS --max-time 10 "http://127.0.0.1:$BACKEND_PORT/api/health"
  echo ""
fi

HTTP_FRONT=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://127.0.0.1:$FRONTEND_PORT/" || echo "000")
echo "Frontend /: $HTTP_FRONT"
set -e

echo ""
echo "========================================="
if [ "$HTTP_FRONT" = "200" ] && [ "$HTTP_BACK" = "200" ] && [ -n "$frontend_pid" ] && [ -n "$backend_pid" ]; then
  echo "[SUCCESS] All services running!"
  echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
  echo "Backend API: http://127.0.0.1:$BACKEND_PORT/api"
  exit 0
else
  echo "[FAILURE] Some services failed"
  echo ""
  echo "Backend log (last 50 lines):"
  tail -n 50 "$PROJECT_DIR/backend.log" 2>/dev/null || echo "(no log)"
  echo ""
  echo "Frontend log (last 50 lines):"
  tail -n 50 "$PROJECT_DIR/frontend.log" 2>/dev/null || echo "(no log)"
  exit 1
fi
