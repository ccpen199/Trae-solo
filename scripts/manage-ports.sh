#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

get_tail4() {
  local dir_name=$(basename "$PROJECT_DIR")
  local num=$(echo "$dir_name" | grep -oE '[0-9]+' | head -n1)
  printf "%04d" "${num: -4}"
}

TAIL4=$(get_tail4)

SLOT_OFFSETS=(0 1000 2000 3000 4000 5000)

check_port() {
  local port=$1
  lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1
}

get_env_value() {
  local key=$1
  grep "^${key}=" "$ENV_FILE" | cut -d'=' -f2-
}

set_env_value() {
  local key=$1
  local value=$2
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

find_available_ports() {
  for offset in "${SLOT_OFFSETS[@]}"; do
    local fe_port=$((40000 + offset + TAIL4))
    local be_port=$((50000 + offset + TAIL4))
    
    local fe_pid=$(check_port $fe_port)
    local be_pid=$(check_port $be_port)
    
    if [ -z "$fe_pid" ] && [ -z "$be_pid" ]; then
      echo "$fe_port $be_port"
      return 0
    else
      echo "Slot offset $offset: FE $fe_port (PID: ${fe_pid:-free}), BE $be_port (PID: ${be_pid:-free}) - skipped" >&2
    fi
  done
  
  echo "ERROR: All port slots are occupied!" >&2
  echo "Checked slots (FE/BE):" >&2
  for offset in "${SLOT_OFFSETS[@]}"; do
    local fe_port=$((40000 + offset + TAIL4))
    local be_port=$((50000 + offset + TAIL4))
    local fe_pid=$(check_port $fe_port)
    local be_pid=$(check_port $be_port)
    echo "  $offset: $fe_port (${fe_pid:-free}) / $be_port (${be_pid:-free})" >&2
  done
  return 1
}

case "${1:-check}" in
  check)
    CURRENT_FE=$(get_env_value FRONTEND_PORT)
    CURRENT_BE=$(get_env_value BACKEND_PORT)
    
    FE_PID=$(check_port $CURRENT_FE)
    BE_PID=$(check_port $CURRENT_BE)
    
    echo "Project: $PROJECT_DIR"
    echo "Tail4: $TAIL4"
    echo "Frontend Port: $CURRENT_FE (PID: ${FE_PID:-not listening})"
    echo "Backend Port: $CURRENT_BE (PID: ${BE_PID:-not listening})"
    
    if [ -n "$FE_PID" ]; then
      echo "Frontend process:"
      ps -p "$FE_PID" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "  Process not found"
    fi
    if [ -n "$BE_PID" ]; then
      echo "Backend process:"
      ps -p "$BE_PID" -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null || echo "  Process not found"
    fi
    ;;
  
  auto-select)
    PORTS=$(find_available_ports)
    if [ $? -ne 0 ]; then
      exit 1
    fi
    
    FE_PORT=$(echo $PORTS | cut -d' ' -f1)
    BE_PORT=$(echo $PORTS | cut -d' ' -f2)
    
    set_env_value FRONTEND_PORT "$FE_PORT"
    set_env_value BACKEND_PORT "$BE_PORT"
    set_env_value FRONTEND_URL "http://127.0.0.1:$FE_PORT"
    set_env_value BACKEND_URL "http://127.0.0.1:$BE_PORT"
    set_env_value API_BASE_URL "http://127.0.0.1:$BE_PORT/api"
    set_env_value VITE_API_URL "http://127.0.0.1:$BE_PORT/api"
    
    echo "Selected ports: FRONTEND=$FE_PORT, BACKEND=$BE_PORT"
    echo "Updated .env file"
    ;;
  
  show-slots)
    echo "Available port slots for tail4=$TAIL4:"
    for offset in "${SLOT_OFFSETS[@]}"; do
      fe_port=$((40000 + offset + TAIL4))
      be_port=$((50000 + offset + TAIL4))
      fe_pid=$(check_port $fe_port)
      be_pid=$(check_port $be_port)
      status="AVAILABLE"
      if [ -n "$fe_pid" ] || [ -n "$be_pid" ]; then
        status="OCCUPIED"
      fi
      printf "  Slot %d: FE=%5d (%s), BE=%5d (%s) - %s\n" \
        $((offset/1000)) $fe_port "${fe_pid:-free}" $be_port "${be_pid:-free}" "$status"
    done
    ;;
  
  *)
    echo "Usage: $0 {check|auto-select|show-slots}"
    exit 1
    ;;
esac
