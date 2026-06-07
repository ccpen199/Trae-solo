#!/bin/bash
cd "$(dirname "$0")"

echo "=== Starting Backend ==="
cd backend
node src/index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
disown
echo "Backend PID: $BACKEND_PID"

sleep 5

echo "=== Starting Frontend ==="
cd ../frontend
./node_modules/.bin/vite --port 50996 --host 127.0.0.1 --strictPort < /dev/null > ../frontend.log 2>&1 &
FRONTEND_PID=$!
disown
echo "Frontend PID: $FRONTEND_PID"

sleep 10

echo "=== Verification ==="
echo "Frontend port 50996:"
lsof -nP -iTCP:50996 -sTCP:LISTEN -t 2>/dev/null || echo "not listening"
echo "Backend port 60996:"
lsof -nP -iTCP:60996 -sTCP:LISTEN -t 2>/dev/null || echo "not listening"

echo "=== Backend Health ==="
curl -sS --max-time 5 http://127.0.0.1:60996/api/health || echo "failed"
echo ""
echo "=== Frontend HTTP ==="
curl -I --max-time 10 http://127.0.0.1:50996/ 2>&1 | head -3 || echo "failed"

echo ""
echo "Access URLs:"
echo "  Frontend: http://127.0.0.1:50996/"
echo "  Backend API: http://127.0.0.1:60996/api"
echo "  Backend Health: http://127.0.0.1:60996/api/health"
