#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

echo "=== Service Status Check ==="
echo "Project: $PROJECT_DIR"
echo "FRONTEND_PORT: $FRONTEND_PORT"
echo "BACKEND_PORT: $BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

echo "Frontend port $FRONTEND_PORT: ${frontend_pid:-NOT LISTENING}"
echo "Backend port $BACKEND_PORT: ${backend_pid:-NOT LISTENING}"
echo ""

if [ -n "$frontend_pid" ]; then
  echo "--- Frontend Process ---"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
  echo ""
fi

if [ -n "$backend_pid" ]; then
  echo "--- Backend Process ---"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
  echo ""
fi

echo "--- HTTP Checks ---"

echo -n "Frontend (http://127.0.0.1:$FRONTEND_PORT/): "
frontend_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:$FRONTEND_PORT/ 2>/dev/null || echo "000")
if [ "$frontend_code" = "200" ]; then
  echo "✅ HTTP $frontend_code"
else
  echo "❌ HTTP $frontend_code"
fi

echo -n "Backend (http://127.0.0.1:$BACKEND_PORT/api/health): "
backend_resp=$(curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health 2>&1 || echo "FAILED")
if echo "$backend_resp" | grep -q '"status":"ok"'; then
  echo "✅ OK"
else
  echo "❌ $backend_resp"
fi

echo ""
echo "--- Process Health ---"
if [ -n "$frontend_pid" ]; then
  stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  echo "Frontend status: $stat"
  case "$stat" in
    T*) echo "  ⚠️  Process is stopped (T)" ;;
    Z*) echo "  ❌ Process is zombie (Z)" ;;
    S*|R*) echo "  ✅ Running normally" ;;
  esac
fi

if [ -n "$backend_pid" ]; then
  stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  echo "Backend status: $stat"
  case "$stat" in
    T*) echo "  ⚠️  Process is stopped (T)" ;;
    Z*) echo "  ❌ Process is zombie (Z)" ;;
    S*|R*) echo "  ✅ Running normally" ;;
  esac
fi
