#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89083"
cd "$PROJECT_DIR"

# Kill ALL processes belonging to THIS project
echo "=== Killing old processes ==="
for pid in $(pgrep -f "nodemon\|node\|vite" 2>/dev/null || true); do
  if [ -z "$pid" ]; then continue; fi
  pid_cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "")
  cmd=$(ps -p "$pid" -o command= 2>/dev/null | head -n1 || echo "")
  
  if [[ "$pid_cwd" == "$PROJECT_DIR"* ]] || [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
    echo "Killing PID=$pid CWD=$pid_cwd"
    echo "  CMD=$cmd"
    kill "$pid" 2>/dev/null || true
    sleep 0.5
    # Force kill
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
done

sleep 2

# Double-check ports
echo ""
echo "=== Checking ports ==="
for p in 49083 59083 50083 60083; do
  pid=$(lsof -nP -iTCP:$p -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "")
    if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
      echo "Port $p still occupied by PID=$pid (our project), force killing"
      kill -9 "$pid" 2>/dev/null || true
    else
      echo "Port $p occupied by PID=$pid (foreign project), CWD=$cwd"
    fi
  else
    echo "Port $p: FREE"
  fi
done

sleep 1

# Load env
export $(grep -v '^#' .env | xargs)
echo ""
echo "Starting backend on $BACKEND_PORT..."
cd "$PROJECT_DIR/backend"
rm -f backend.log
nohup npm run dev > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started PID=$BACKEND_PID"

echo ""
echo "Starting frontend on $FRONTEND_PORT..."
cd "$PROJECT_DIR/frontend"
rm -f frontend.log
nohup npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started PID=$FRONTEND_PID"

echo ""
echo "Waiting 25 seconds..."
sleep 25

echo ""
echo "=== Verification ==="
for p in $FRONTEND_PORT $BACKEND_PORT; do
  pid=$(lsof -nP -iTCP:$p -sTCP:LISTEN -t 2>/dev/null | head -n1)
  cwd=$(lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2- | head -n1 || echo "")
  echo "Port $p: ${pid:+PID=$pid CWD=$cwd}${pid:-NOT LISTENING}"
done

echo ""
echo "--- HTTP Checks ---"
H1=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:$FRONTEND_PORT/ || echo "000")
H2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:$BACKEND_PORT/api/health || echo "000")
echo "Frontend: $H1"
echo "Backend /api/health: $H2"

if [ "$H1" = "200" ] && [ "$H2" = "200" ]; then
  echo ""
  echo "========================================="
  echo "[SUCCESS] Services running!"
  echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
  echo "Backend:  http://127.0.0.1:$BACKEND_PORT/api"
  echo "========================================="
else
  echo ""
  echo "Backend log:"
  cat "$PROJECT_DIR/backend.log"
fi
