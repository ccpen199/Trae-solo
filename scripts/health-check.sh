#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

echo "========================================"
echo "  Project Health Check"
echo "========================================"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "[1/4] Checking port listening status..."
if [ -n "$frontend_pid" ]; then
  echo "  ✅ Frontend port $FRONTEND_PORT is listening (PID: $frontend_pid)"
else
  echo "  ❌ Frontend port $FRONTEND_PORT is NOT listening"
  exit 1
fi

if [ -n "$backend_pid" ]; then
  echo "  ✅ Backend port $BACKEND_PORT is listening (PID: $backend_pid)"
else
  echo "  ❌ Backend port $BACKEND_PORT is NOT listening"
  exit 1
fi

echo ""
echo "[2/4] Checking process status..."
fe_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
be_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)

if [[ "$fe_stat" == *"T"* ]] || [[ "$fe_stat" == *"Z"* ]] || [ -z "$fe_stat" ]; then
  echo "  ❌ Frontend process is in invalid state: $fe_stat"
  exit 1
else
  echo "  ✅ Frontend process status: $fe_stat"
fi

if [[ "$be_stat" == *"T"* ]] || [[ "$be_stat" == *"Z"* ]] || [ -z "$be_stat" ]; then
  echo "  ❌ Backend process is in invalid state: $be_stat"
  exit 1
else
  echo "  ✅ Backend process status: $be_stat"
fi

echo ""
echo "[3/4] Checking process ownership..."
fe_cwd=$(lsof -p "$frontend_pid" -d cwd -Fn 2>/dev/null | awk '/^p/ {pid=substr($0,2)} /^n/ && pid=='"$frontend_pid"' {print substr($0,2); exit}')
be_cwd=$(lsof -p "$backend_pid" -d cwd -Fn 2>/dev/null | awk '/^p/ {pid=substr($0,2)} /^n/ && pid=='"$backend_pid"' {print substr($0,2); exit}')

if [[ "$fe_cwd" == "$PROJECT_DIR"* ]]; then
  echo "  ✅ Frontend process belongs to current project"
else
  echo "  ⚠️  Frontend cwd: $fe_cwd (expected: $PROJECT_DIR/*)"
fi

if [[ "$be_cwd" == "$PROJECT_DIR"* ]]; then
  echo "  ✅ Backend process belongs to current project"
else
  echo "  ⚠️  Backend cwd: $be_cwd (expected: $PROJECT_DIR/*)"
fi

echo ""
echo "[4/4] HTTP response verification..."
fe_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>/dev/null || echo "000")
be_http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "000")

if [ "$fe_http" = "200" ]; then
  echo "  ✅ Frontend HTTP response: $fe_http"
else
  echo "  ❌ Frontend HTTP response: $fe_http (expected: 200)"
  exit 1
fi

if [ "$be_http" = "200" ] || [ "$be_http" = "201" ] || [ "$be_http" = "301" ] || [ "$be_http" = "302" ]; then
  echo "  ✅ Backend HTTP response: $be_http"
else
  echo "  ❌ Backend HTTP response: $be_http (expected: 2xx/3xx)"
  exit 1
fi

echo ""
echo "========================================"
echo "  All checks passed!"
echo "========================================"
echo ""
echo "Frontend URL: http://127.0.0.1:$FRONTEND_PORT"
echo "Backend URL:  http://127.0.0.1:$BACKEND_PORT"
echo "API Base URL: http://127.0.0.1:$BACKEND_PORT/api"
echo ""
