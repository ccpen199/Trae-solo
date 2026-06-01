#!/bin/bash
cd "$(dirname "$0")"

echo "Starting AI Data Anomaly Explanation Agent..."
echo "Frontend: http://127.0.0.1:43378"
echo "Backend:  http://127.0.0.1:53378"

cd backend
echo "Starting backend..."
node src/server.js > server.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd ../frontend
echo "Starting frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

sleep 3
echo ""
echo "Services started!"
echo "Frontend: http://127.0.0.1:43378"
echo "Backend:  http://127.0.0.1:53378/api/health"
