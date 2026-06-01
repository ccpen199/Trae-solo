#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting frontend service..."

source "$PROJECT_DIR/.env"

FE_PORT=${FRONTEND_PORT}
BE_PORT=${BACKEND_PORT}

echo "📡 Using ports: FE=$FE_PORT, BE=$BE_PORT"

cd "$PROJECT_DIR/frontend"

LOG_FILE="$PROJECT_DIR/frontend.log"
echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "[$(date)] Starting frontend on port $FE_PORT" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

nohup npm run dev -- --host 127.0.0.1 --port $FE_PORT --strictPort < /dev/null >> "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/.frontend.pid"

echo "⏳ Waiting for frontend to start..."
sleep 5

echo "🔍 Checking frontend status..."
frontend_pid=$(lsof -nP -iTCP:$FE_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$frontend_pid" ]; then
  echo "❌ Frontend failed to start. Check frontend.log for details."
  tail -50 "$LOG_FILE"
  exit 1
fi

ps_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
if [[ "$ps_stat" == *T* ]] || [[ "$ps_stat" == *Z* ]]; then
  echo "❌ Frontend process is not healthy (stat=$ps_stat)"
  exit 1
fi

curl_result=$(curl -sS -I --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$FE_PORT/" 2>&1)
if [ "$curl_result" != "200" ]; then
  echo "❌ Frontend health check failed (HTTP $curl_result)"
  exit 1
fi

echo ""
echo "✅ Frontend started successfully!"
echo "   PID: $frontend_pid"
echo "   URL: http://127.0.0.1:$FE_PORT"
echo "   Log: $LOG_FILE"
