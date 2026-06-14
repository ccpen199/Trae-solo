#!/bin/bash
cd "$(dirname "$0")"
set -a
[ -f .env ] && . ./.env
set +a

: "${FRONTEND_PORT:=50034}"
: "${BACKEND_PORT:=59034}"

( cd backend && nohup node src/server.js > ../backend.log 2>&1 & echo $! > ../backend.pid )
BACKEND_PID=$(cat backend.pid 2>/dev/null || true)
echo "Backend PID: $BACKEND_PID"

( cd frontend && nohup node serve.cjs > ../frontend.log 2>&1 & echo $! > ../frontend.pid )
FRONTEND_PID=$(cat frontend.pid 2>/dev/null || true)
echo "Frontend PID: $FRONTEND_PID"

echo "Waiting for services..."
sleep 6

echo "=== Backend ==="
curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health || echo "Backend FAILED"

echo ""
echo "=== Frontend ==="
curl -sS --max-time 5 -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:$FRONTEND_PORT/ || echo "Frontend FAILED"
echo ""
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend: http://127.0.0.1:$BACKEND_PORT"
