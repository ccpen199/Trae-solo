#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

TAIL4=$(grep '^TAIL4=' "$ENV_FILE" | cut -d'=' -f2)
CURRENT_SLOT=$(grep '^PORT_SLOT=' "$ENV_FILE" | cut -d'=' -f2)

calculate_ports() {
  local slot=$1
  local frontend_base=$((40000 + slot * 1000))
  local backend_base=$((50000 + slot * 1000))
  echo "$((frontend_base + TAIL4)) $((backend_base + TAIL4))"
}

is_port_available() {
  local port=$1
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    local pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t | head -n1)
    local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
    local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
    if [[ "$cwd" == "$PROJECT_DIR"* ]]; then
      echo "PORT_OWN:$pid"
    else
      echo "PORT_OTHER:$pid:$cwd:$cmd"
    fi
  else
    echo "PORT_FREE"
  fi
}

kill_project_pid() {
  local port=$1
  local result=$(is_port_available "$port")
  if [[ "$result" == PORT_OWN:* ]]; then
    local pid=${result#PORT_OWN:}
    kill "$pid" 2>/dev/null || true
    sleep 1
  fi
}

update_env_port() {
  local slot=$1
  local frontend_port=$2
  local backend_port=$3

  sed -i '' "s/^PORT_SLOT=.*/PORT_SLOT=$slot/" "$ENV_FILE"
  sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" "$ENV_FILE"
  sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" "$ENV_FILE"
  sed -i '' "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
  sed -i '' "s|^VITE_OAUTH_REDIRECT_URL=.*|VITE_OAUTH_REDIRECT_URL=http://127.0.0.1:$frontend_port/oauth/callback|" "$ENV_FILE"
  sed -i '' "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
}

find_available_slot() {
  for slot in 0 1 2 3 4 5; do
    read frontend_port backend_port < <(calculate_ports "$slot")
    fe_status=$(is_port_available "$frontend_port")
    be_status=$(is_port_available "$backend_port")

    if [[ "$fe_status" == "PORT_FREE" && "$be_status" == "PORT_FREE" ]]; then
      update_env_port "$slot" "$frontend_port" "$backend_port"
      echo "FOUND:$slot:$frontend_port:$backend_port"
      return 0
    elif [[ "$fe_status" == PORT_OWN:* && "$be_status" == PORT_OWN:* ]]; then
      kill_project_pid "$frontend_port"
      kill_project_pid "$backend_port"
      update_env_port "$slot" "$frontend_port" "$backend_port"
      echo "FOUND:$slot:$frontend_port:$backend_port"
      return 0
    fi
  done

  echo "ERROR: All port slots occupied!"
  for slot in 0 1 2 3 4 5; do
    read frontend_port backend_port < <(calculate_ports "$slot")
    fe_pid=$(lsof -nP -iTCP:"$frontend_port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
    be_pid=$(lsof -nP -iTCP:"$backend_port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
    echo "  Slot $slot: FE=$frontend_port PID=$fe_pid, BE=$backend_port PID=$be_pid"
  done
  exit 1
}

case "$1" in
  check)
    FRONTEND_PORT=$(grep '^FRONTEND_PORT=' "$ENV_FILE" | cut -d'=' -f2)
    BACKEND_PORT=$(grep '^BACKEND_PORT=' "$ENV_FILE" | cut -d'=' -f2)
    echo "Checking ports: FE=$FRONTEND_PORT, BE=$BACKEND_PORT"
    echo "FE: $(is_port_available "$FRONTEND_PORT")"
    echo "BE: $(is_port_available "$BACKEND_PORT")"
    ;;
  find)
    find_available_slot
    ;;
  stop)
    FRONTEND_PORT=$(grep '^FRONTEND_PORT=' "$ENV_FILE" | cut -d'=' -f2)
    BACKEND_PORT=$(grep '^BACKEND_PORT=' "$ENV_FILE" | cut -d'=' -f2)
    kill_project_pid "$FRONTEND_PORT"
    kill_project_pid "$BACKEND_PORT"
    echo "Stopped processes on ports $FRONTEND_PORT and $BACKEND_PORT"
    ;;
  *)
    echo "Usage: $0 {check|find|stop}"
    exit 1
    ;;
esac
