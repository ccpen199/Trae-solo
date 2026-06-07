PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89040"
FRONTEND_PORT=49040
BACKEND_PORT=59040

cd "$PROJECT_DIR/backend"
nohup node server.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 2

cd "$PROJECT_DIR/frontend"
nohup npx vite --host 127.0.0.1 --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd "$PROJECT_DIR"
sleep 5

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "Frontend PID: $frontend_pid  Port: $FRONTEND_PORT"
echo "Backend PID: $backend_pid  Port: $BACKEND_PORT"

if [ -n "$frontend_pid" ] && [ -n "$backend_pid" ]; then
  echo "Both services started successfully!"
  echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
  echo "Backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
else
  echo "ERROR: One or more services failed to start!"
  echo "Frontend log:" && tail -20 "$PROJECT_DIR/frontend.log"
  echo "Backend log:" && tail -20 "$PROJECT_DIR/backend.log"
fi
