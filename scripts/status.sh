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

FRONTEND_PORT="${FRONTEND_PORT:-43420}"
BACKEND_PORT="${BACKEND_PORT:-53420}"

echo "Service Status for project: $PROJECT_DIR"
echo "========================================"
echo "Configuration:"
echo "  SLOT=$SLOT"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"
echo "========================================"

check_service() {
  local name=$1
  local port=$2
  local url=$3
  
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1)
  
  if [ -z "$pid" ]; then
    echo "❌ $name: Not running (port $port)"
    return 1
  fi
  
  local ppid
  ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | xargs || echo "")
  local stat
  stat=$(ps -o stat= -p "$pid" 2>/dev/null | xargs || echo "")
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs || echo "")
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null || echo "")
  
  local belongs="UNKNOWN"
  if [[ "$cwd" == "$PROJECT_DIR"/* ]]; then
    belongs="YES"
  else
    belongs="NO"
  fi
  
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  
  local status="RUNNING"
  if [[ "$stat" == *T* ]]; then
    status="STOPPED"
  elif [[ "$stat" == *Z* ]]; then
    status="ZOMBIE"
  fi
  
  local http_ok="✗"
  if [ "$http_code" = "200" ] || [ "$http_code" = "301" ] || [ "$http_code" = "302" ] || [ "$http_code" = "304" ]; then
    http_ok="✓"
  fi
  
  echo "✅ $name:"
  echo "   PID:        $pid"
  echo "   PPID:       $ppid"
  echo "   Status:     $status ($stat)"
  echo "   Port:       $port"
  echo "   Belongs:    $belongs"
  echo "   HTTP:       $http_code $http_ok"
  echo "   CWD:        $cwd"
  echo "   Command:    $cmd"
}

echo ""
echo "Frontend Service:"
check_service "Frontend" "$FRONTEND_PORT" "http://127.0.0.1:$FRONTEND_PORT/"

echo ""
echo "Backend Service:"
check_service "Backend" "$BACKEND_PORT" "http://127.0.0.1:$BACKEND_PORT/api/health"

echo ""
echo "========================================"
echo "Quick Commands:"
echo "  Access frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "  Access backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
echo "  Start:           ./scripts/start.sh"
echo "  Stop:            ./scripts/stop.sh"
echo ""
echo "Log files:"
echo "  Frontend: tail -f logs/frontend.log"
echo "  Backend:  tail -f logs/backend.log"
echo ""
