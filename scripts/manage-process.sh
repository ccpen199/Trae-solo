#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs -0)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49098}
BACKEND_PORT=${BACKEND_PORT:-59098}
HOST=${HOST:-127.0.0.1}

check_port() {
  local port=$1
  lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1
}

verify_process_owner() {
  local pid=$1
  local project_dir=$2
  
  if [ -z "$pid" ]; then
    return 1
  fi
  
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  if [ -z "$cwd" ]; then
    return 1
  fi
  
  case "$cwd" in
    "$project_dir"/*) return 0 ;;
    *) return 1 ;;
  esac
}

safe_kill() {
  local port=$1
  local project_dir=$2
  
  local pid=$(check_port $port)
  
  if [ -z "$pid" ]; then
    echo "Port $port is not occupied"
    return 0
  fi
  
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  
  echo "Checking PID $pid on port $port..."
  echo "  cwd: $cwd"
  echo "  cmd: $cmd"
  
  case "$cwd" in
    "$project_dir"/*)
      echo "Killing PID $pid (belongs to this project)"
      kill "$pid"
      sleep 1
      if ps -p "$pid" > /dev/null 2>&1; then
        echo "Force killing PID $pid"
        kill -9 "$pid"
      fi
      return 0
      ;;
    *)
      echo "SKIP: PID $pid does NOT belong to this project (cwd=$cwd)"
      echo "Will attempt to use alternate port..."
      return 1
      ;;
  esac
}

start_frontend() {
  echo "Starting frontend on port $FRONTEND_PORT..."
  
  local pid=$(check_port $FRONTEND_PORT)
  if [ -n "$pid" ]; then
    if ! safe_kill $FRONTEND_PORT "$PROJECT_DIR"; then
      echo "Frontend port occupied by external process, switching ports..."
      "$SCRIPT_DIR/manage-ports.sh" auto-select
      source "$ENV_FILE"
      export FRONTEND_PORT BACKEND_PORT FRONTEND_URL BACKEND_URL API_BASE_URL VITE_API_URL
    fi
  fi
  
  if [ ! -d "$PROJECT_DIR/frontend" ]; then
    echo "Frontend directory not found. Skipping frontend start."
    return 0
  fi
  
  cd "$PROJECT_DIR/frontend"
  
  if [ -f "package.json" ]; then
    if grep -q "\"dev:h5\"" package.json; then
      nohup env HOST="$HOST" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" VITE_API_URL="$VITE_API_URL" npm run dev:h5 > "$PROJECT_DIR/frontend.log" 2>&1 &
    else
      nohup npm run dev -- --host $HOST --port $FRONTEND_PORT --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
    fi
    FE_PID=$!
    echo "Frontend started with PID $FE_PID (background mode)"
    echo $FE_PID > "$PROJECT_DIR/.frontend.pid"
  else
    echo "No package.json found in frontend directory"
    return 1
  fi
}

start_backend() {
  echo "Starting backend on port $BACKEND_PORT..."
  
  local pid=$(check_port $BACKEND_PORT)
  if [ -n "$pid" ]; then
    if ! safe_kill $BACKEND_PORT "$PROJECT_DIR"; then
      echo "Backend port occupied by external process, switching ports..."
      "$SCRIPT_DIR/manage-ports.sh" auto-select
      source "$ENV_FILE"
      export FRONTEND_PORT BACKEND_PORT FRONTEND_URL BACKEND_URL API_BASE_URL VITE_API_URL
    fi
  fi
  
  if [ ! -d "$PROJECT_DIR/backend" ]; then
    echo "Backend directory not found. Skipping backend start."
    return 0
  fi
  
  cd "$PROJECT_DIR/backend"
  
  if [ -f "package.json" ]; then
    if grep -q "\"start\"" package.json; then
      nohup npm start > "$PROJECT_DIR/backend.log" 2>&1 &
    elif grep -q "\"dev\"" package.json; then
      nohup npm run dev > "$PROJECT_DIR/backend.log" 2>&1 &
    else
      echo "No start/dev script found in backend package.json"
      return 1
    fi
    BE_PID=$!
    echo "Backend started with PID $BE_PID (background mode)"
    echo $BE_PID > "$PROJECT_DIR/.backend.pid"
  elif [ -f "app.py" ] || [ -f "main.py" ]; then
    nohup python app.py > "$PROJECT_DIR/backend.log" 2>&1 &
    BE_PID=$!
    echo "Backend started with PID $BE_PID (background mode)"
    echo $BE_PID > "$PROJECT_DIR/.backend.pid"
  else
    echo "No recognized backend entry point found"
    return 1
  fi
}

stop_frontend() {
  echo "Stopping frontend..."
  local pid=$(check_port $FRONTEND_PORT)
  if [ -n "$pid" ]; then
    safe_kill $FRONTEND_PORT "$PROJECT_DIR"
  else
    echo "Frontend is not running on port $FRONTEND_PORT"
  fi
  rm -f "$PROJECT_DIR/.frontend.pid"
}

stop_backend() {
  echo "Stopping backend..."
  local pid=$(check_port $BACKEND_PORT)
  if [ -n "$pid" ]; then
    safe_kill $BACKEND_PORT "$PROJECT_DIR"
  else
    echo "Backend is not running on port $BACKEND_PORT"
  fi
  rm -f "$PROJECT_DIR/.backend.pid"
}

status() {
  echo "=== Process Status ==="
  echo "Project: $PROJECT_DIR"
  echo "Frontend Port: $FRONTEND_PORT"
  echo "Backend Port: $BACKEND_PORT"
  echo ""
  
  local fe_pid=$(check_port $FRONTEND_PORT)
  local be_pid=$(check_port $BACKEND_PORT)
  
  if [ -n "$fe_pid" ]; then
    echo "Frontend (PID $fe_pid):"
    ps -p "$fe_pid" -o pid=,ppid=,stat=,cwd=,command=
    if verify_process_owner "$fe_pid" "$PROJECT_DIR"; then
      echo "  Status: OWNED by this project"
    else
      echo "  Status: EXTERNAL process (not owned)"
    fi
  else
    echo "Frontend: NOT RUNNING"
  fi
  
  echo ""
  
  if [ -n "$be_pid" ]; then
    echo "Backend (PID $be_pid):"
    ps -p "$be_pid" -o pid=,ppid=,stat=,cwd=,command=
    if verify_process_owner "$be_pid" "$PROJECT_DIR"; then
      echo "  Status: OWNED by this project"
    else
      echo "  Status: EXTERNAL process (not owned)"
    fi
  else
    echo "Backend: NOT RUNNING"
  fi
}

case "${1:-status}" in
  start)
    start_backend
    sleep 2
    start_frontend
    echo ""
    echo "Waiting 5 seconds for services to stabilize..."
    sleep 5
    "$SCRIPT_DIR/verify.sh"
    ;;
  
  start-frontend)
    start_frontend
    sleep 5
    "$SCRIPT_DIR/verify.sh" frontend
    ;;
  
  start-backend)
    start_backend
    sleep 5
    "$SCRIPT_DIR/verify.sh" backend
    ;;
  
  stop)
    stop_frontend
    stop_backend
    ;;
  
  stop-frontend)
    stop_frontend
    ;;
  
  stop-backend)
    stop_backend
    ;;
  
  restart)
    stop_frontend
    stop_backend
    sleep 2
    start_backend
    sleep 2
    start_frontend
    echo ""
    echo "Waiting 5 seconds for services to stabilize..."
    sleep 5
    "$SCRIPT_DIR/verify.sh"
    ;;
  
  status)
    status
    ;;
  
  *)
    echo "Usage: $0 {start|start-frontend|start-backend|stop|stop-frontend|stop-backend|restart|status}"
    exit 1
    ;;
esac
