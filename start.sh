#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

TAIL4=3453

read_env() {
  local env_file="$PROJECT_DIR/.env"
  if [ -f "$env_file" ]; then
    while IFS='=' read -r key value; do
      case "$key" in
        \#* | '') continue ;;
      esac
      key=$(echo "$key" | xargs)
      value=$(echo "$value" | xargs | sed -e 's/^"//' -e 's/"$//')
      export "$key=$value"
    done < "$env_file"
  fi
}

read_env

FRONTEND_PORT="${FRONTEND_PORT:-43453}"
BACKEND_PORT="${BACKEND_PORT:-53453}"

owner_matches_project() {
  local pid="$1"
  local cwd
  local cmd
  if [ -z "$pid" ]; then return 1; fi
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 | xargs)"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  [ -z "$cwd" ] && return 1
  case "$cwd" in
    "$PROJECT_DIR"*) return 0 ;;
    *)
      if [[ "$cmd" == *"$PROJECT_DIR"* ]]; then
        return 0
      fi
      return 1
      ;;
  esac
}

stop_project_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  if [ -z "$pid" ]; then
    return 0
  fi
  if owner_matches_project "$pid"; then
    local cwd cmd
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 | xargs)"
    cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
    echo "Stopping current project process on port $port (PID $pid)"
    echo "  cwd=$cwd"
    echo "  cmd=$cmd"
    kill "$pid" 2>/dev/null || true
    sleep 1
  else
    local cwd cmd
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 | xargs)"
    cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
    echo "Port $port is occupied by PID $pid which does not belong to this project"
    echo "  cwd=$cwd"
    echo "  cmd=$cmd"
  fi
}

port_available() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  [ -z "$pid" ]
}

find_slot() {
  for slot in 0 1 2 3 4 5; do
    local frontend=$((40000 + slot * 1000 + TAIL4))
    local backend=$((50000 + slot * 1000 + TAIL4))
    echo "Checking slot $slot: frontend=$frontend backend=$backend" >&2
    if port_available "$frontend" && port_available "$backend"; then
      echo "$frontend $backend"
      return 0
    fi
  done
  echo "All port slots are occupied! Check the following ports and processes:" >&2
  for slot in 0 1 2 3 4 5; do
    local frontend=$((40000 + slot * 1000 + TAIL4))
    local backend=$((50000 + slot * 1000 + TAIL4))
    local fpid bpid
    fpid="$(lsof -nP -iTCP:"$frontend" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
    bpid="$(lsof -nP -iTCP:"$backend" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
    [ -n "$fpid" ] && echo "  Port $frontend: PID $fpid ($(ps -o command= -p "$fpid" 2>/dev/null || true))" >&2
    [ -n "$bpid" ] && echo "  Port $backend: PID $bpid ($(ps -o command= -p "$bpid" 2>/dev/null || true))" >&2
  done
  return 1
}

update_env() {
  local frontend="$1"
  local backend="$2"
  echo "Updating .env to frontend=$frontend backend=$backend"
  if [ -f "$PROJECT_DIR/.env" ]; then
    /usr/bin/sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend/" "$PROJECT_DIR/.env" 2>/dev/null || true
    /usr/bin/sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend/" "$PROJECT_DIR/.env" 2>/dev/null || true
    /usr/bin/sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend/api|" "$PROJECT_DIR/.env" 2>/dev/null || true
  else
    cat > "$PROJECT_DIR/.env" <<EOF
HOST=127.0.0.1
FRONTEND_PORT=$frontend
BACKEND_PORT=$backend
API_BASE_URL=http://127.0.0.1:$backend/api
DATABASE_PATH=./data/app.sqlite
NODE_ENV=development
EOF
  fi
  export FRONTEND_PORT="$frontend"
  export BACKEND_PORT="$backend"
}

echo "=== Training Center Management System ==="
echo "Project dir: $PROJECT_DIR"
echo "Current ports: FRONTEND=$FRONTEND_PORT BACKEND=$BACKEND_PORT"
echo ""

echo "Stopping existing project processes..."
stop_project_port "$FRONTEND_PORT"
stop_project_port "$BACKEND_PORT"
echo ""

echo "Finding available port slot..."
read -r NEXT_FRONTEND_PORT NEXT_BACKEND_PORT < <(find_slot)
if [ -z "$NEXT_FRONTEND_PORT" ] || [ -z "$NEXT_BACKEND_PORT" ]; then
  echo "ERROR: No available port slot for project may-63453" >&2
  echo "Please stop the conflicting processes manually and try again." >&2
  exit 1
fi
echo "Found available slot: frontend=$NEXT_FRONTEND_PORT backend=$NEXT_BACKEND_PORT"
echo ""

if [ "$NEXT_FRONTEND_PORT" != "$FRONTEND_PORT" ] || [ "$NEXT_BACKEND_PORT" != "$BACKEND_PORT" ]; then
  update_env "$NEXT_FRONTEND_PORT" "$NEXT_BACKEND_PORT"
  FRONTEND_PORT="$NEXT_FRONTEND_PORT"
  BACKEND_PORT="$NEXT_BACKEND_PORT"
  echo ""
fi

mkdir -p "$PROJECT_DIR/data"
mkdir -p "$PROJECT_DIR/backend/uploads"

echo "Installing dependencies..."
if [ ! -d "$PROJECT_DIR/backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd "$PROJECT_DIR/backend"
  npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 &
  BACKEND_INSTALL_PID=$!
fi
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$PROJECT_DIR/frontend"
  npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 &
  FRONTEND_INSTALL_PID=$!
fi

if [ -n "$BACKEND_INSTALL_PID" ]; then
  wait "$BACKEND_INSTALL_PID" 2>/dev/null || true
  echo "Backend dependencies installed"
fi
if [ -n "$FRONTEND_INSTALL_PID" ]; then
  wait "$FRONTEND_INSTALL_PID" 2>/dev/null || true
  echo "Frontend dependencies installed"
fi
echo ""

echo "Starting backend on http://127.0.0.1:$BACKEND_PORT"
cd "$PROJECT_DIR/backend"
nohup npm run start > "$PROJECT_DIR/backend.log" 2>&1 < /dev/null &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PROJECT_DIR/backend.pid"
echo "Backend PID: $BACKEND_PID"

echo "Starting frontend on http://127.0.0.1:$FRONTEND_PORT"
cd "$PROJECT_DIR/frontend"
nohup npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort --clearScreen false > "$PROJECT_DIR/frontend.log" 2>&1 < /dev/null &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PROJECT_DIR/frontend.pid"
echo "Frontend PID: $FRONTEND_PID"
echo ""

echo "Waiting for services to start..."
sleep 5
echo ""

echo "=== Service Verification ==="

PROJECT_DIR="$(pwd)"
frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)
backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

echo "Checking frontend port $FRONTEND_PORT..."
if [ -n "$frontend_pid" ]; then
  echo "  Frontend PID: $frontend_pid"
  ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "  Process not found"
  frontend_stat=$(ps -o stat= -p "$frontend_pid" 2>/dev/null | xargs)
  if [ "$frontend_stat" = "T" ] || [ "$frontend_stat" = "Z" ] || [ -z "$frontend_stat" ]; then
    echo "  ERROR: Frontend process is not running properly (stat=$frontend_stat)" >&2
  fi
else
  echo "  ERROR: Frontend port $FRONTEND_PORT is not listening" >&2
fi

echo "Checking backend port $BACKEND_PORT..."
if [ -n "$backend_pid" ]; then
  echo "  Backend PID: $backend_pid"
  ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "  Process not found"
  backend_stat=$(ps -o stat= -p "$backend_pid" 2>/dev/null | xargs)
  if [ "$backend_stat" = "T" ] || [ "$backend_stat" = "Z" ] || [ -z "$backend_stat" ]; then
    echo "  ERROR: Backend process is not running properly (stat=$backend_stat)" >&2
  fi
else
  echo "  ERROR: Backend port $BACKEND_PORT is not listening" >&2
fi

echo ""
echo "Checking HTTP responses..."
sleep 2

frontend_http=$(curl -I --max-time 5 -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$FRONTEND_PORT/" 2>/dev/null || echo "000")
backend_http=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "000")

echo "  Frontend HTTP: $frontend_http"
echo "  Backend HTTP:  $backend_http"

if [ "$frontend_http" != "200" ]; then
  echo "  WARNING: Frontend returned $frontend_http, checking log..."
  tail -20 "$PROJECT_DIR/frontend.log" 2>/dev/null || true
fi

if [ "$backend_http" != "200" ]; then
  echo "  WARNING: Backend returned $backend_http, checking log..."
  tail -20 "$PROJECT_DIR/backend.log" 2>/dev/null || true
fi

echo ""
echo "=== Startup Complete ==="
echo "Frontend: http://127.0.0.1:$FRONTEND_PORT/"
echo "Backend:  http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
echo "Logs:"
echo "  Frontend: $PROJECT_DIR/frontend.log"
echo "  Backend:  $PROJECT_DIR/backend.log"
echo ""
echo "To stop services: ./stop.sh"
