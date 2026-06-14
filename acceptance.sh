#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

function load_env() {
  if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r key value; do
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      export "$key=$value"
    done < "$ENV_FILE"
  fi
}

function get_process_cwd() {
  local pid=$1
  lsof -p "$pid" 2>/dev/null | grep ' cwd ' | awk '{print $9}' | head -1
}

function check_port_listening() {
  local port=$1
  local name=$2
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    echo "FAIL: $name port $port is NOT listening"
    return 1
  fi
  echo "OK: $name port $port is listening (PID=$pid)"
  return 0
}

function check_process_health() {
  local pid=$1
  local name=$2
  if [ -z "$pid" ]; then
    echo "FAIL: $name PID is empty"
    return 1
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "FAIL: $name process $pid does not exist"
    return 1
  fi
  local stat=$(ps -o stat= -p "$pid" 2>/dev/null || true)
  case "$stat" in
    T*)
      echo "FAIL: $name process $pid is STOPPED (stat=$stat)"
      return 1
      ;;
    Z*)
      echo "FAIL: $name process $pid is ZOMBIE (stat=$stat)"
      return 1
      ;;
  esac
  local cwd=$(get_process_cwd "$pid")
  if [[ ! "$cwd" == "$PROJECT_DIR"* ]]; then
    echo "WARN: $name process $pid cwd=$cwd is not in project dir"
  fi
  echo "OK: $name process $pid is running (stat=$stat, cwd=$cwd)"
  return 0
}

function check_http() {
  local url=$1
  local name=$2
  local expected_code=${3:-200}
  local response
  response=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>&1) || true
  if [ "$response" = "$expected_code" ]; then
    echo "OK: $name $url returns HTTP $response"
    return 0
  elif [[ "$response" =~ ^2[0-9][0-9]$ ]] || [[ "$response" =~ ^3[0-9][0-9]$ ]]; then
    echo "OK: $name $url returns HTTP $response (acceptable)"
    return 0
  else
    echo "FAIL: $name $url returns HTTP $response (expected $expected_code or 2xx/3xx)"
    return 1
  fi
}

function check_api_json() {
  local url=$1
  local name=$2
  local response
  response=$(curl -sS --max-time 5 "$url" 2>&1) || true
  if echo "$response" | grep -q '"ok":true'; then
    echo "OK: $name $url returns valid JSON with ok=true"
    return 0
  elif echo "$response" | grep -q '^{.*}$'; then
    echo "OK: $name $url returns valid JSON"
    return 0
  else
    echo "FAIL: $name $url did not return valid JSON"
    echo "Response: $response"
    return 1
  fi
}

load_env

echo "========================================"
echo "  may-89086 Acceptance Check"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo "  API:      $API_BASE_URL"
echo ""

FAILURES=0

echo "--- Port Listening Checks ---"
check_port_listening "$FRONTEND_PORT" "Frontend" || FAILURES=$((FAILURES + 1))
check_port_listening "$BACKEND_PORT" "Backend" || FAILURES=$((FAILURES + 1))
echo ""

echo "--- Process Health Checks ---"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
check_process_health "$frontend_pid" "Frontend" || FAILURES=$((FAILURES + 1))
check_process_health "$backend_pid" "Backend" || FAILURES=$((FAILURES + 1))
echo ""

echo "--- HTTP Response Checks ---"
check_http "$FRONTEND_URL/" "Frontend homepage" 200 || FAILURES=$((FAILURES + 1))
check_http "$API_BASE_URL/health" "Backend health" 200 || FAILURES=$((FAILURES + 1))
echo ""

echo "--- API Response Checks ---"
check_api_json "$API_BASE_URL/health" "Health API" || FAILURES=$((FAILURES + 1))
check_api_json "$API_BASE_URL/tasks" "Tasks API" || FAILURES=$((FAILURES + 1))
check_api_json "$API_BASE_URL/notes" "Notes API" || FAILURES=$((FAILURES + 1))
echo ""

echo "--- Process Details ---"
if [ -n "$frontend_pid" ]; then
  echo "Frontend:"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || true
fi
if [ -n "$backend_pid" ]; then
  echo "Backend:"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,command= 2>/dev/null || true
fi
echo ""

echo "========================================"
if [ $FAILURES -eq 0 ]; then
  echo "  ACCEPTANCE: PASSED ✓"
  echo "========================================"
  echo ""
  echo "Access URLs:"
  echo "  Frontend: $FRONTEND_URL"
  echo "  Backend Health: $API_BASE_URL/health"
  exit 0
else
  echo "  ACCEPTANCE: FAILED ✗ ($FAILURES failures)"
  echo "========================================"
  exit 1
fi
