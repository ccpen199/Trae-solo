#!/bin/bash
cd "$(dirname "$0")"

echo "=== Starting Clinical Pathway System ==="
echo "Backend Port: 58918"
echo "Frontend Port: 48918"

echo ""
echo "Starting backend..."
cd backend
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

echo ""
echo "Waiting for backend..."
sleep 5

echo ""
echo "Checking backend health..."
curl -sS --max-time 5 http://127.0.0.1:58918/api/health || echo "Backend check failed"

echo ""
echo "Starting frontend..."
cd frontend
node node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "Waiting for frontend..."
sleep 10

echo ""
echo "=== Service Status ==="
echo "Backend port check:"
lsof -nP -iTCP:58918 -sTCP:LISTEN 2>/dev/null && echo "Backend: OK" || echo "Backend: FAILED"

echo ""
echo "Frontend port check:"
lsof -nP -iTCP:48918 -sTCP:LISTEN 2>/dev/null && echo "Frontend: OK" || echo "Frontend: FAILED"

echo ""
echo "=== Access URLs ==="
echo "Frontend: http://127.0.0.1:48918/"
echo "Backend API: http://127.0.0.1:58918/api"
echo "Health check: http://127.0.0.1:58918/api/health"
echo ""
echo "Logs: backend.log, frontend.log"
echo ""
