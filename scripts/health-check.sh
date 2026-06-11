#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$PROJECT_DIR/scripts"

source "$SCRIPT_DIR/process-common.sh"
load_env

echo "=== Health Check for may-89096 ==="
echo "PROJECT_DIR=$PROJECT_DIR"
echo "FRONTEND_PORT=$FRONTEND_PORT"
echo "BACKEND_PORT=$BACKEND_PORT"
echo ""

frontend_pid=$(lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t | head -n1)

echo "--- Process Info ---"
if [ -n "$frontend_pid" ]; then
  echo "Frontend PID: $frontend_pid"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "Process $frontend_pid not found"
else
  echo "Frontend: No process listening on port $FRONTEND_PORT"
fi

if [ -n "$backend_pid" ]; then
  echo "Backend PID: $backend_pid"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "Process $backend_pid not found"
else
  echo "Backend: No process listening on port $BACKEND_PORT"
fi

echo ""
echo "--- Process Status Check ---"
ALL_OK=true

if [ -n "$frontend_pid" ]; then
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  case "$frontend_stat" in
    *T*|*Z*|"")
      echo "FAIL: Frontend process $frontend_pid status is '$frontend_stat'"
      ALL_OK=false
      ;;
    *)
      echo "OK: Frontend process $frontend_pid status is '$frontend_stat'"
      ;;
  esac
else
  echo "FAIL: Frontend not running"
  ALL_OK=false
fi

if [ -n "$backend_pid" ]; then
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  case "$backend_stat" in
    *T*|*Z*|"")
      echo "FAIL: Backend process $backend_pid status is '$backend_stat'"
      ALL_OK=false
      ;;
    *)
      echo "OK: Backend process $backend_pid status is '$backend_stat'"
      ;;
  esac
else
  echo "FAIL: Backend not running"
  ALL_OK=false
fi

echo ""
echo "--- HTTP Check ---"

echo "Frontend HTTP (http://127.0.0.1:$FRONTEND_PORT/):"
frontend_http=$(curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -n1)
if echo "$frontend_http" | grep -q "HTTP/.* 200\|HTTP/.* 30[12347]"; then
  echo "  OK: $frontend_http"
else
  echo "  FAIL: $frontend_http"
  ALL_OK=false
fi

echo "Backend Health (http://127.0.0.1:$BACKEND_PORT/api/health):"
backend_health=$(curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1)
backend_http_code=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "000")
if [ "$backend_http_code" = "200" ] || [ "$backend_http_code" = "201" ] || [ "$backend_http_code" = "301" ] || [ "$backend_http_code" = "302" ] || [ "$backend_http_code" = "304" ]; then
  echo "  OK: HTTP $backend_http_code - $backend_health"
elif [ "$backend_http_code" = "404" ] || [ "$backend_http_code" = "405" ]; then
  echo "  WARN: HTTP $backend_http_code - Health endpoint may not exist yet"
else
  echo "  FAIL: HTTP $backend_http_code - $backend_health"
  ALL_OK=false
fi

echo ""
echo "--- Summary ---"
if $ALL_OK; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "SOME CHECKS FAILED"
  exit 1
fi
