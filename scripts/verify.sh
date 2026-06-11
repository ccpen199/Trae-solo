#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49100}
BACKEND_PORT=${BACKEND_PORT:-59100}

echo "=== Acceptance Verification ==="
echo "PROJECT_DIR=$PROJECT_DIR"
echo ""

PROJECT_DIR="$(pwd)"
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "Frontend PID: ${frontend_pid:-MISSING}"
echo "Backend PID:  ${backend_pid:-MISSING}"
echo ""

ERRORS=0

if [ -z "$frontend_pid" ]; then
  echo "FAIL: Frontend port $FRONTEND_PORT is not listening"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Frontend listening on port $FRONTEND_PORT (PID $frontend_pid)"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  case "$frontend_stat" in
    T*|Z*)
      echo "FAIL: Frontend process state is $frontend_stat (stopped/zombie)"
      ERRORS=$((ERRORS + 1))
      ;;
    *)
      echo "PASS: Frontend process state is $frontend_stat"
      ;;
  esac
fi

echo ""

if [ -z "$backend_pid" ]; then
  echo "FAIL: Backend port $BACKEND_PORT is not listening"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS: Backend listening on port $BACKEND_PORT (PID $backend_pid)"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  case "$backend_stat" in
    T*|Z*)
      echo "FAIL: Backend process state is $backend_stat (stopped/zombie)"
      ERRORS=$((ERRORS + 1))
      ;;
    *)
      echo "PASS: Backend process state is $backend_stat"
      ;;
  esac
fi

echo ""
echo "--- HTTP Verification ---"

if [ -n "$frontend_pid" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "PASS: Frontend HTTP returns 200"
  else
    echo "FAIL: Frontend HTTP returns $HTTP_CODE"
    ERRORS=$((ERRORS + 1))
    curl -I --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/" 2>&1 | head -10
  fi
fi

if [ -n "$backend_pid" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health")
  if [[ "$HTTP_CODE" =~ ^[23][0-9][0-9]$ ]]; then
    echo "PASS: Backend /api/health returns $HTTP_CODE"
  else
    echo "FAIL: Backend /api/health returns $HTTP_CODE"
    ERRORS=$((ERRORS + 1))
    curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>&1
  fi
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "=== ALL CHECKS PASSED ==="
  exit 0
else
  echo "=== $ERRORS CHECK(S) FAILED ==="
  exit 1
fi
