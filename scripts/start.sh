#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

# shellcheck disable=SC2046
export $(grep -v '^#' .env | xargs)

TAIL4="${TAIL4:-3420}"
SLOT="${SLOT:-0}"

calculate_ports() {
  local slot=$1
  FRONTEND_PORT=$((40000 + slot * 1000 + TAIL4))
  BACKEND_PORT=$((50000 + slot * 1000 + TAIL4))
}

check_port_owner() {
  local port=$1
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    return 0
  fi
  
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "")
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  
  if [[ "$cwd" == "$PROJECT_DIR"/* ]]; then
    echo "Port $port is used by current project (PID=$pid), killing it..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    return 0
  else
    echo "Port $port is occupied by another process (PID=$pid, cwd=$cwd, cmd=$cmd)"
    return 1
  fi
}

find_available_slot() {
  for slot in 0 1 2 3 4 5; do
    calculate_ports "$slot"
    
    echo "Checking slot $slot: FRONTEND_PORT=$FRONTEND_PORT, BACKEND_PORT=$BACKEND_PORT"
    
    local fe_available=true
    local be_available=true
    
    if ! check_port_owner "$FRONTEND_PORT"; then
      fe_available=false
    fi
    
    if ! check_port_owner "$BACKEND_PORT"; then
      be_available=false
    fi
    
    if $fe_available && $be_available; then
      SLOT=$slot
      echo "Found available slot $slot"
      return 0
    fi
  done
  
  echo "Error: All slots are occupied by other projects"
  echo "Please free up ports or use a different project directory"
  exit 1
}

update_env() {
  sed -i.bak "s/^SLOT=.*/SLOT=$SLOT/" .env
  sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" .env
  sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" .env
  sed -i.bak "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
  sed -i.bak "s|^VITE_FRONTEND_URL=.*|VITE_FRONTEND_URL=http://127.0.0.1:$FRONTEND_PORT|" .env
  rm -f .env.bak
  
  export FRONTEND_PORT
  export BACKEND_PORT
  export SLOT
}

find_available_slot
update_env

echo "========================================"
echo "Starting services with configuration:"
echo "  SLOT=$SLOT"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"
echo "========================================"

mkdir -p data logs

echo "Starting backend server..."
nohup npx tsx watch backend/src/index.ts > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

echo "Starting frontend dev server..."
nohup npx vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "========================================"
echo "Waiting for services to start..."
sleep 8

verify_service() {
  local name=$1
  local port=$2
  local url=$3
  
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    echo "❌ $name: Port $port is not listening"
    return 1
  fi
  
  local stat
  stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs || echo "")
  
  if [[ "$stat" == *T* ]] || [[ "$stat" == *Z* ]]; then
    echo "❌ $name: Process is in bad state (stat=$stat)"
    return 1
  fi
  
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  
  if [ "$http_code" != "200" ] && [ "$http_code" != "301" ] && [ "$http_code" != "302" ] && [ "$http_code" != "304" ]; then
    echo "❌ $name: HTTP request failed with code $http_code"
    return 1
  fi
  
  echo "✅ $name: Running on port $port (PID=$pid, HTTP $http_code)"
  return 0
}

BACKEND_OK=false
FRONTEND_OK=false

if verify_service "Backend" "$BACKEND_PORT" "http://127.0.0.1:$BACKEND_PORT/api/health"; then
  BACKEND_OK=true
fi

if verify_service "Frontend" "$FRONTEND_PORT" "http://127.0.0.1:$FRONTEND_PORT/"; then
  FRONTEND_OK=true
fi

echo "========================================"
echo "Service Status Summary:"
echo "  Backend:  $($BACKEND_OK && echo "✅ RUNNING" || echo "❌ FAILED")"
echo "  Frontend: $($FRONTEND_OK && echo "✅ RUNNING" || echo "❌ FAILED")"
echo "========================================"

if $BACKEND_OK && $FRONTEND_OK; then
  echo ""
  echo "🎉 All services started successfully!"
  echo ""
  echo "Access URLs:"
  echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT/"
  echo "  Backend:  http://127.0.0.1:$BACKEND_PORT/"
  echo "  API:      http://127.0.0.1:$BACKEND_PORT/api"
  echo "  Health:   http://127.0.0.1:$BACKEND_PORT/api/health"
  echo ""
  echo "Log files:"
  echo "  Backend:  logs/backend.log"
  echo "  Frontend: logs/frontend.log"
  echo ""
  echo "To stop services, run: ./scripts/stop.sh"
  echo "To check status, run: ./scripts/status.sh"
  echo ""
  
  echo "Test accounts (password: 123456):"
  echo "  admin / 123456          - 系统管理员"
  echo "  finance01 / 123456      - 财务"
  echo "  manager01 / 123456      - 门店店长"
  echo "  cashier01 / 123456      - 收银员"
  echo "  cashier02 / 123456      - 收银员"
  echo "  area01 / 123456         - 区域运营"
  echo ""
  
  exit 0
else
  echo "❌ Some services failed to start"
  echo "Check log files for details:"
  echo "  tail -f logs/backend.log"
  echo "  tail -f logs/frontend.log"
  exit 1
fi
