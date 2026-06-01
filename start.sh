#!/bin/bash
cd "$(dirname "$0")"

source .env

echo "Starting backend on port $BACKEND_PORT..."
cd backend
nohup node src/server.js > ../backend.log 2>&1 &
echo "Backend PID: $!"

sleep 2

echo "Starting frontend on port $FRONTEND_PORT..."
cd ../frontend
nohup node node_modules/vite/bin/vite.js --host 127.0.0.1 --port $FRONTEND_PORT --strictPort < /dev/null > ../frontend.log 2>&1 &
echo "Frontend PID: $!"

sleep 8

echo ""
echo "=== Service Status ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend API: http://127.0.0.1:$BACKEND_PORT/api"
echo ""
echo "=== Port Check ==="
lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN 2>/dev/null | head -2
lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN 2>/dev/null | head -2
