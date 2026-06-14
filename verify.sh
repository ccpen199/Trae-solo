#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

FAILED=0

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

echo "============================================"
echo "Project Verification Report"
echo "============================================"
echo "Project:       may-89083"
echo "Frontend URL:  $FRONTEND_URL"
echo "Backend URL:   $BACKEND_URL"
echo "Frontend Port: $FRONTEND_PORT"
echo "Backend Port:  $BACKEND_PORT"
echo "============================================"
echo ""

echo "--- Port Listening Check ---"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)

if [ -n "$frontend_pid" ]; then
  echo "[OK] Frontend port $FRONTEND_PORT is LISTEN, PID=$frontend_pid"
else
  echo "[FAIL] Frontend port $FRONTEND_PORT is NOT listening"
  FAILED=1
fi

if [ -n "$backend_pid" ]; then
  echo "[OK] Backend port $BACKEND_PORT is LISTEN, PID=$backend_pid"
else
  echo "[FAIL] Backend port $BACKEND_PORT is NOT listening"
  FAILED=1
fi

echo ""
echo "--- Process Status Check ---"
check_process_status() {
  local pid=$1
  local name=$2
  if [ -z "$pid" ]; then
    echo "[SKIP] $name: no PID"
    return
  fi
  local stat
  stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs || echo "UNKNOWN")
  local cwd
  cwd=$(pid_cwd "$pid")
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null | xargs || echo "UNKNOWN")

  echo "  PID=$pid, STAT=$stat, CWD=$cwd"
  echo "  CMD=$cmd"

  case "$stat" in
    T*|Z*)
      echo "[FAIL] $name is in bad state: $stat"
      FAILED=1
      ;;
    *)
      case "$cwd" in
        "$PROJECT_DIR"*)
          echo "[OK] $name is running and belongs to this project"
          ;;
        *)
          echo "[WARN] $name CWD ($cwd) is not under $PROJECT_DIR"
          ;;
      esac
      ;;
  esac
}

check_process_status "$frontend_pid" "Frontend"
check_process_status "$backend_pid" "Backend"

echo ""
echo "--- HTTP Health Check ---"

# Check frontend
if [ -n "$frontend_pid" ]; then
  echo "Checking $FRONTEND_URL/"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$FRONTEND_URL/" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "[OK] Frontend returns HTTP 200"
  else
    echo "[FAIL] Frontend returns HTTP $HTTP_CODE"
    FAILED=1
  fi
else
  echo "[SKIP] Frontend HTTP check (no process)"
fi

# Check backend health endpoint
if [ -n "$backend_pid" ]; then
  echo "Checking $BACKEND_URL/api/health"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BACKEND_URL/api/health" || echo "000")
  if [[ "$HTTP_CODE" =~ ^[23][0-9][0-9]$ ]]; then
    echo "[OK] Backend /api/health returns HTTP $HTTP_CODE"
  else
    # Try alternative endpoints
    HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BACKEND_URL/health" || echo "000")
    if [[ "$HTTP_CODE2" =~ ^[23][0-9][0-9]$ ]]; then
      echo "[OK] Backend /health returns HTTP $HTTP_CODE2"
    else
      echo "[FAIL] Backend health check failed: /api/health=$HTTP_CODE, /health=$HTTP_CODE2"
      FAILED=1
    fi
  fi
else
  echo "[SKIP] Backend HTTP check (no process)"
fi

echo ""
echo "============================================"
if [ "$FAILED" -eq 0 ]; then
  echo "[SUCCESS] All checks passed!"
  echo "============================================"
  exit 0
else
  echo "[FAILURE] Some checks failed. Please review."
  echo "============================================"
  echo ""
  echo "Last 20 lines of backend.log:"
  [ -f backend.log ] && tail -n 20 backend.log || echo "(no log file)"
  echo ""
  echo "Last 20 lines of frontend.log:"
  [ -f frontend.log ] && tail -n 20 frontend.log || echo "(no log file)"
  exit 1
fi
