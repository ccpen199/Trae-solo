#!/bin/zsh
cd "$(dirname "$0")"

echo "Starting backend..."
cd backend
nohup node src/index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

echo "Starting frontend..."
cd ../frontend
nohup npm run dev > ../frontend.log 2>&1 < /dev/null &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

sleep 8

echo ""
echo "Service status:"
lsof -nP -iTCP:57892 -sTCP:LISTEN
lsof -nP -iTCP:47892 -sTCP:LISTEN
echo ""
echo "Frontend: http://127.0.0.1:47892/"
echo "Backend:  http://127.0.0.1:57892/api"
