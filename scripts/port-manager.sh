#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

TAIL4=${TAIL4:-9100}
FRONTEND_PORT=${FRONTEND_PORT:-49100}
BACKEND_PORT=${BACKEND_PORT:-59100}

SLOTS=(0 1 2 3 4 5)

get_process_cwd() {
  local PID=$1
  lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

check_port_owner() {
  local PORT=$1
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)

  if [ -z "$pid" ]; then
    return 0
  fi

  local cwd=$(get_process_cwd "$pid")

  if [ -z "$cwd" ]; then
    echo "Port $PORT occupied by PID $pid (cwd unknown) - cannot use"
    return 1
  fi

  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*)
      echo "Port $PORT occupied by our own PID $pid (cwd=$cwd)"
      return 2
      ;;
    *)
      echo "Port $PORT occupied by PID $pid (cwd=$cwd) - foreign, skipping"
      return 1
      ;;
  esac
}

find_available_slot() {
  for SLOT in "${SLOTS[@]}"; do
    F_PORT=$((40000 + SLOT * 1000 + TAIL4))
    B_PORT=$((50000 + SLOT * 1000 + TAIL4))

    echo "Checking slot $SLOT: frontend=$F_PORT, backend=$B_PORT..."

    set +e
    check_port_owner $F_PORT
    F_STATUS=$?
    check_port_owner $B_PORT
    B_STATUS=$?
    set -e

    if [ "$F_STATUS" -eq 0 ] && [ "$B_STATUS" -eq 0 ]; then
      echo "Slot $SLOT available!"
      FRONTEND_PORT=$F_PORT
      BACKEND_PORT=$B_PORT
      return 0
    elif [ "$F_STATUS" -eq 2 ] || [ "$B_STATUS" -eq 2 ]; then
      echo "Slot $SLOT has our own processes - stopping them first..."
      "$SCRIPT_DIR/stop.sh"
      return 0
    fi
  done

  echo "ERROR: All slots (0-5) are occupied by foreign processes!"
  echo "Please free up ports or manually assign different ports in .env"
  exit 1
}

update_env() {
  local KEY=$1
  local VALUE=$2
  if grep -q "^${KEY}=" "$ENV_FILE"; then
    sed -i.bak "s|^${KEY}=.*|${KEY}=${VALUE}|" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
  else
    echo "${KEY}=${VALUE}" >> "$ENV_FILE"
  fi
}

echo "=== Port Manager ==="
echo "PROJECT_DIR=$PROJECT_DIR"
echo "TAIL4=$TAIL4"
echo ""

echo "Current ports in .env:"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"
echo ""

echo "Checking current ports..."
set +e
check_port_owner $FRONTEND_PORT
F_CURRENT=$?
check_port_owner $BACKEND_PORT
B_CURRENT=$?
set -e

if [ "$F_CURRENT" -eq 0 ] && [ "$B_CURRENT" -eq 0 ]; then
  echo "Current ports are available, no change needed."
  exit 0
elif [ "$F_CURRENT" -eq 2 ] || [ "$B_CURRENT" -eq 2 ]; then
  echo "Current ports occupied by our own processes."
  echo "Stopping current project processes before restart."
  "$SCRIPT_DIR/stop.sh"
  exit 0
fi

echo ""
echo "Current ports occupied by foreign processes, searching fallback slots..."
find_available_slot

echo ""
echo "Updating .env with new ports:"
echo "  FRONTEND_PORT=$FRONTEND_PORT"
echo "  BACKEND_PORT=$BACKEND_PORT"

FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT"
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
API_BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"
VITE_API_URL="http://127.0.0.1:$BACKEND_PORT/api"

update_env "FRONTEND_PORT" "$FRONTEND_PORT"
update_env "BACKEND_PORT" "$BACKEND_PORT"
update_env "FRONTEND_URL" "$FRONTEND_URL"
update_env "BACKEND_URL" "$BACKEND_URL"
update_env "API_BASE_URL" "$API_BASE_URL"
update_env "VITE_API_URL" "$VITE_API_URL"

echo ""
echo "Updated .env successfully."
