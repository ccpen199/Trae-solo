#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source "$PROJECT_DIR/.env"

echo "🔍 Running acceptance verification..."
echo "========================================"
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port:  $BACKEND_PORT"
echo "========================================"
echo ""

FRONTEND_PID=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
BACKEND_PID=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "📊 Process status:"
echo "   Frontend PID: ${FRONTEND_PID:-none}"
echo "   Backend PID:  ${BACKEND_PID:-none}"

if [ -z "$FRONTEND_PID" ] || [ -z "$BACKEND_PID" ]; then
  echo "❌ FAILED: Services not running"
  exit 1
fi

echo ""
echo "📋 Process details:"
echo ""

echo "Frontend process:"
ps -p "$FRONTEND_PID" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "   (not found)"
echo ""

echo "Backend process:"
ps -p "$BACKEND_PID" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "   (not found)"
echo ""

echo "🔬 Process health checks:"

FE_STAT=$(ps -o stat= -p "$FRONTEND_PID" 2>/dev/null | xargs)
BE_STAT=$(ps -o stat= -p "$BACKEND_PID" 2>/dev/null | xargs)

echo "   Frontend stat: $FE_STAT"
echo "   Backend stat:  $BE_STAT"

if [[ "$FE_STAT" == *T* ]] || [[ "$FE_STAT" == *Z* ]] || [[ "$FE_STAT" == "" ]]; then
  echo "❌ FAILED: Frontend process unhealthy (stat=$FE_STAT)"
  exit 1
fi

if [[ "$BE_STAT" == *T* ]] || [[ "$BE_STAT" == *Z* ]] || [[ "$BE_STAT" == "" ]]; then
  echo "❌ FAILED: Backend process unhealthy (stat=$BE_STAT)"
  exit 1
fi

echo ""
echo "🌐 HTTP health checks:"

FE_HTTP=$(curl -sS -I --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$FRONTEND_PORT/" 2>&1)
echo "   Frontend HTTP: $FE_HTTP"
if [ "$FE_HTTP" != "200" ]; then
  echo "❌ FAILED: Frontend returned $FE_HTTP"
  exit 1
fi

BE_HTTP=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1)
echo "   Backend HTTP:  $BE_HTTP"
if [ "$BE_HTTP" != "200" ]; then
  echo "❌ FAILED: Backend returned $BE_HTTP"
  exit 1
fi

echo ""
echo "🔗 API endpoint tests:"

echo "   Testing /api/health..."
HEALTH=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
echo "      ✓ $(echo "$HEALTH" | grep -o '"status":"[^"]*"' || echo "ok")"

echo "   Testing /api/overview..."
OVERVIEW=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/overview")
METRICS=$(echo "$OVERVIEW" | grep -o '"metrics":{[^}]*}' | head -n1)
echo "      ✓ metrics loaded"

echo "   Testing /api/verify (known fraud number)..."
VERIFY=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/verify?type=phone&value=%2B86-13800138000")
IS_FRAUD=$(echo "$VERIFY" | grep -o '"is_fraud":true')
echo "      ✓ is_fraud=$([ -n "$IS_FRAUD" ] && echo "true" || echo "false")"

echo "   Testing /api/reports..."
REPORTS=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/reports?pageSize=1")
REPORT_COUNT=$(echo "$REPORTS" | grep -c '"id":')
echo "      ✓ $REPORT_COUNT reports returned"

echo "   Testing /api/knowledge-graph..."
KG=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/knowledge-graph")
KG_COUNT=$(echo "$KG" | grep -c '"id":')
echo "      ✓ $KG_COUNT knowledge nodes"

echo "   Testing /api/quizzes..."
QUIZZES=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/quizzes?limit=1")
QUIZ_COUNT=$(echo "$QUIZZES" | grep -c '"id":')
echo "      ✓ $QUIZ_COUNT quizzes"

echo ""
echo "✅ ALL CHECKS PASSED!"
echo ""
echo "========================================"
echo "Access URLs:"
echo "   Frontend: http://127.0.0.1:$FRONTEND_PORT"
echo "   Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "   Health:   http://127.0.0.1:$BACKEND_PORT/api/health"
echo "========================================"
