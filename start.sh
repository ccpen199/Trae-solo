#!/bin/bash
cd "$(dirname "$0")"
set -a
[ -f .env ] && . ./.env
set +a

: "${FRONTEND_PORT:=49039}"
: "${BACKEND_PORT:=59039}"

( cd backend && nohup npm run start > ../backend.log 2>&1 & echo $! > ../backend.pid )
echo "Backend PID: $(cat backend.pid 2>/dev/null || true)"

sleep 2

( cd frontend && nohup npm run dev > ../frontend.log 2>&1 & echo $! > ../frontend.pid )
echo "Frontend PID: $(cat frontend.pid 2>/dev/null || true)"

sleep 5
curl -sS --max-time 5 "http://127.0.0.1:${BACKEND_PORT}/api/health" || true
curl -sS --max-time 5 -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:${FRONTEND_PORT}/" || true
