#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

get_project_tail4() {
  local dir_name
  dir_name=$(basename "$PROJECT_DIR")
  local num
  num=$(echo "$dir_name" | grep -oE '[0-9]+' | head -n1)
  printf "%04d" "${num: -4}"
}

TAIL4=$(get_project_tail4)

SLOT_BASES=(
  "40000 50000"
  "41000 51000"
  "42000 52000"
  "43000 53000"
  "44000 54000"
  "45000 55000"
)

port_occupied() {
  local port=$1
  lsof -nP -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1
}

port_owned_by_project() {
  local port=$1
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    return 1
  fi
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  case "$cwd" in
    "$PROJECT_DIR"/*) return 0 ;;
    *) return 1 ;;
  esac
}

kill_project_port() {
  local port=$1
  local pid
  pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    return 0
  fi
  local cwd
  cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd
  cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      kill "$pid" 2>/dev/null || true
      sleep 0.5
      ;;
    *)
      echo "skip kill: cwd=$cwd cmd=$cmd"
      return 1
      ;;
  esac
}

find_available_ports() {
  local frontend_port backend_port
  for slot in "${SLOT_BASES[@]}"; do
    local front_base back_base
    read -r front_base back_base <<< "$slot"
    frontend_port=$(( front_base + 10#$TAIL4 ))
    backend_port=$(( back_base + 10#$TAIL4 ))

    if ! port_occupied "$frontend_port" && ! port_occupied "$backend_port"; then
      echo "$frontend_port $backend_port"
      return 0
    fi

    if port_owned_by_project "$frontend_port" || port_owned_by_project "$backend_port"; then
      kill_project_port "$frontend_port" || true
      kill_project_port "$backend_port" || true
      if ! port_occupied "$frontend_port" && ! port_occupied "$backend_port"; then
        echo "$frontend_port $backend_port"
        return 0
      fi
    fi
  done

  echo "ERROR: All port slots occupied" >&2
  for slot in "${SLOT_BASES[@]}"; do
    local front_base back_base
    read -r front_base back_base <<< "$slot"
    frontend_port=$(( front_base + 10#$TAIL4 ))
    backend_port=$(( back_base + 10#$TAIL4 ))
    local fpid bpid
    fpid=$(lsof -nP -iTCP:"$frontend_port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
    bpid=$(lsof -nP -iTCP:"$backend_port" -sTCP:LISTEN -t 2>/dev/null | head -n1)
    [ -n "$fpid" ] && echo "  Port $frontend_port: PID $fpid" >&2
    [ -n "$bpid" ] && echo "  Port $backend_port: PID $bpid" >&2
  done
  echo "Please free ports or adjust SLOT_BASES in scripts/port-manager.sh" >&2
  return 1
}

update_env_ports() {
  local frontend_port=$1
  local backend_port=$2

  if grep -q "^FRONTEND_PORT=" "$ENV_FILE"; then
    sed -i '' "s|^FRONTEND_PORT=.*|FRONTEND_PORT=$frontend_port|" "$ENV_FILE"
  else
    echo "FRONTEND_PORT=$frontend_port" >> "$ENV_FILE"
  fi

  if grep -q "^BACKEND_PORT=" "$ENV_FILE"; then
    sed -i '' "s|^BACKEND_PORT=.*|BACKEND_PORT=$backend_port|" "$ENV_FILE"
  else
    echo "BACKEND_PORT=$backend_port" >> "$ENV_FILE"
  fi

  if grep -q "^FRONTEND_URL=" "$ENV_FILE"; then
    sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
  else
    echo "FRONTEND_URL=http://127.0.0.1:$frontend_port" >> "$ENV_FILE"
  fi

  if grep -q "^BACKEND_URL=" "$ENV_FILE"; then
    sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$backend_port|" "$ENV_FILE"
  else
    echo "BACKEND_URL=http://127.0.0.1:$backend_port" >> "$ENV_FILE"
  fi

  if grep -q "^API_BASE_URL=" "$ENV_FILE"; then
    sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
  else
    echo "API_BASE_URL=http://127.0.0.1:$backend_port/api" >> "$ENV_FILE"
  fi

  if grep -q "^VITE_API_URL=" "$ENV_FILE"; then
    sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$backend_port/api|" "$ENV_FILE"
  else
    echo "VITE_API_URL=http://127.0.0.1:$backend_port/api" >> "$ENV_FILE"
  fi

  if grep -q "^CORS_ORIGIN=" "$ENV_FILE"; then
    sed -i '' "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$frontend_port|" "$ENV_FILE"
  else
    echo "CORS_ORIGIN=http://127.0.0.1:$frontend_port" >> "$ENV_FILE"
  fi
}

case "${1:-check}" in
  check)
    if [ -f "$ENV_FILE" ]; then
      FRONTEND_PORT=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d= -f2)
      BACKEND_PORT=$(grep "^BACKEND_PORT=" "$ENV_FILE" | cut -d= -f2)
      echo "Current ports: FRONTEND=$FRONTEND_PORT, BACKEND=$BACKEND_PORT"
    fi
    ports=$(find_available_ports) || exit 1
    read -r f b <<< "$ports"
    echo "Available ports: FRONTEND=$f, BACKEND=$b"
    ;;
  ensure)
    ports=$(find_available_ports) || exit 1
    read -r f b <<< "$ports"
    update_env_ports "$f" "$b"
    echo "Ports ensured: FRONTEND=$f, BACKEND=$b (written to .env)"
    ;;
  show-tail4)
    echo "$TAIL4"
    ;;
  *)
    echo "Usage: $0 {check|ensure|show-tail4}"
    exit 1
    ;;
esac
