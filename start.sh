#!/bin/bash
cd "$(dirname "$0")"

FRONTEND_PORT=49018
BACKEND_PORT=59018
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"

echo "Starting backend..."
cd backend
"$NODE_BIN" src/server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

sleep 3

echo "Starting frontend..."
cd frontend
./node_modules/.bin/vite --host 127.0.0.1 --port 49018 --strictPort > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

sleep 5

echo ""
echo "=== Service Status ==="
echo "Backend: http://127.0.0.1:$BACKEND_PORT (PID: $BACKEND_PID)"
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT (PID: $FRONTEND_PID)"
echo ""
echo "Health checks:"
curl -sS http://127.0.0.1:$BACKEND_PORT/api/health && echo ""
echo ""
echo "Done! Press Enter to exit (services will continue running)"
