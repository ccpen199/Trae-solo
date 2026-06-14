#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

source .env

check_port_available() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -n "$pid" ]; then
    local cwd=$(lsof -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^p/ {p=substr($0,2)} /^n/ && p=='"$pid"' {print substr($0,2); exit}')
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    case "$cwd" in
      "$PROJECT_DIR"*)
        echo "Port $port is occupied by current project PID $pid, killing it..."
        kill "$pid" 2>/dev/null || true
        sleep 2
        ;;
      *)
        return 1
        ;;
    esac
  fi
  return 0
}

find_available_ports() {
  local tail4=9084
  local slots=(0 1000 2000 3000 4000 5000)
  
  for slot in "${slots[@]}"; do
    local fe_port=$((40000 + slot + tail4))
    local be_port=$((50000 + slot + tail4))
    
    local fe_pid=$(lsof -nP -iTCP:$fe_port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    local be_pid=$(lsof -nP -iTCP:$be_port -sTCP:LISTEN -t 2>/dev/null | head -n1)
    
    if [ -z "$fe_pid" ] && [ -z "$be_pid" ]; then
      FRONTEND_PORT=$fe_port
      BACKEND_PORT=$be_port
      update_env_ports
      return 0
    elif [ -n "$fe_pid" ]; then
      local fe_cwd=$(lsof -p "$fe_pid" -d cwd -Fn 2>/dev/null | awk '/^p/ {p=substr($0,2)} /^n/ && p=='"$fe_pid"' {print substr($0,2); exit}')
      case "$fe_cwd" in
        "$PROJECT_DIR"*)
          kill "$fe_pid" 2>/dev/null || true
          sleep 2
          FRONTEND_PORT=$fe_port
          BACKEND_PORT=$be_port
          update_env_ports
          return 0
          ;;
      esac
    elif [ -n "$be_pid" ]; then
      local be_cwd=$(lsof -p "$be_pid" -d cwd -Fn 2>/dev/null | awk '/^p/ {p=substr($0,2)} /^n/ && p=='"$be_pid"' {print substr($0,2); exit}')
      case "$be_cwd" in
        "$PROJECT_DIR"*)
          kill "$be_pid" 2>/dev/null || true
          sleep 2
          FRONTEND_PORT=$fe_port
          BACKEND_PORT=$be_port
          update_env_ports
          return 0
          ;;
      esac
    fi
  done
  
  echo "ERROR: All port slots are occupied by other projects!"
  echo "Please free ports or contact admin."
  return 1
}

update_env_ports() {
  sed -i "" "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" .env
  sed -i "" "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" .env
  sed -i "" "s/^APP_PORT=.*/APP_PORT=$FRONTEND_PORT/" .env
  sed -i "" "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$FRONTEND_PORT|" .env
  sed -i "" "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$BACKEND_PORT|" .env
  sed -i "" "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
  sed -i "" "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$BACKEND_PORT/api|" .env
  source .env
}

if ! check_port_available "$FRONTEND_PORT" || ! check_port_available "$BACKEND_PORT"; then
  echo "Default ports occupied, finding available slots..."
  find_available_ports
fi

mkdir -p data logs

echo "Starting backend on port $BACKEND_PORT..."
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
  npm install
fi
nohup npm run dev > "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

echo "Starting frontend on port $FRONTEND_PORT..."
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi
nohup npm run dev > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "Waiting 10 seconds for services to start..."
sleep 10

cd "$PROJECT_DIR"
bash scripts/health-check.sh
