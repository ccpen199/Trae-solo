#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting backend service..."

PORTS=$(bash scripts/check-ports.sh)
FE_PORT=$(echo "$PORTS" | tail -n1 | awk '{print $1}')
BE_PORT=$(echo "$PORTS" | tail -n1 | awk '{print $2}')

echo "📡 Using ports: FE=$FE_PORT, BE=$BE_PORT"

source "$PROJECT_DIR/.env"

cd "$PROJECT_DIR/backend"

LOG_FILE="$PROJECT_DIR/backend.log"
echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "[$(date)] Starting backend on port $BE_PORT" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

nohup npm start < /dev/null >> "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/.backend.pid"

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🔍 Checking backend status..."
backend_pid=$(lsof -nP -iTCP:$BE_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$backend_pid" ]; then
  echo "❌ Backend failed to start. Check backend.log for details."
  tail -50 "$LOG_FILE"
  exit 1
fi

ps_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
if [[ "$ps_stat" == *T* ]] || [[ "$ps_stat" == *Z* ]]; then
  echo "❌ Backend process is not healthy (stat=$ps_stat)"
  exit 1
fi

curl_result=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BE_PORT/api/health" 2>&1)
if [ "$curl_result" != "200" ]; then
  echo "❌ Backend health check failed (HTTP $curl_result)"
  exit 1
fi

echo ""
echo "✅ Backend started successfully!"
echo "   PID: $backend_pid"
echo "   URL: http://127.0.0.1:$BE_PORT"
echo "   Health: http://127.0.0.1:$BE_PORT/api/health"
echo "   Log: $LOG_FILE"
