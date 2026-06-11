#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89100"
FRONTEND_PORT=51100
BACKEND_PORT=61100

echo "============================================="
echo "  Restart Services"
echo "============================================="
echo ""

# Kill processes
echo "Killing old processes..."
for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
  if [ -n "$pid" ]; then
    args=$(ps -p $pid -o args= 2>/dev/null)
    if [[ "$args" == *"may-89100"* ]] || [[ "$args" == *"api/server"* ]]; then
      echo "  Killing PID $pid (port $PORT)"
      kill $pid 2>/dev/null || true
    else
      echo "  SKIP PID $pid (port $PORT) - not this project: $args"
    fi
  fi
done

sleep 2

# Verify ports are free
echo ""
echo "Checking ports..."
for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)
  if [ -n "$pid" ]; then
    echo "  WARNING: Port $PORT still in use by PID $pid"
  else
    echo "  Port $PORT: free"
  fi
done

# Clear logs
echo ""
echo "Clearing logs..."
rm -f "$PROJECT_DIR/frontend.log" "$PROJECT_DIR/backend.log"

# Start backend
echo ""
echo "Starting backend (port $BACKEND_PORT)..."
cd "$PROJECT_DIR"
nohup npm run server:start > backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

sleep 5

# Verify backend
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -z "$backend_pid" ]; then
  echo "  ERROR: Backend failed to start"
  echo "  Backend log:"
  tail -20 "$PROJECT_DIR/backend.log"
  exit 1
fi
echo "  Backend is listening (PID $backend_pid)"

# Start frontend
echo ""
echo "Starting frontend (port $FRONTEND_PORT)..."
nohup npm run client:dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

sleep 10

# Verify frontend
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
if [ -z "$frontend_pid" ]; then
  echo "  ERROR: Frontend failed to start"
  echo "  Frontend log:"
  tail -30 "$PROJECT_DIR/frontend.log"
  exit 1
fi
echo "  Frontend is listening (PID $frontend_pid)"

# Health checks
echo ""
echo "============================================="
echo "  Health Checks"
echo "============================================="

echo ""
echo "Frontend HTTP check:"
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/login")
echo "  $HTTP_CODE /login"

echo ""
echo "Backend health check:"
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""

echo ""
echo "Backend login test (admin):"
curl -sS --max-time 5 -X POST "http://127.0.0.1:$BACKEND_PORT/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000000","password":"admin123"}'
echo ""

echo ""
echo "============================================="
echo "  Done!"
echo "============================================="
echo ""
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/login"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT"
echo ""
