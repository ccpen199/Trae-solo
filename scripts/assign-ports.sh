#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# Extract tail4 from project name
PROJECT_NAME=${PROJECT_NAME:-may-89092}
TAIL4=$(echo "$PROJECT_NAME" | grep -oE '[0-9]+' | tail -1 | rev | cut -c1-4 | rev | awk '{printf "%04d", $0}')
echo "TAIL4=$TAIL4"

# Port slots: 40000/50000, 41000/51000, ..., 45000/55000
SLOT_BASES=(40000 41000 42000 43000 44000 45000)
SLOT_INDEX=0

check_port() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t | head -n1)
  if [ -z "$pid" ]; then
    return 0  # free
  fi
  # Check if it belongs to this project
  local cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | sed 's/^n//' | xargs)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      # It's our process, we can kill it
      kill "$pid" 2>/dev/null || true
      sleep 1
      return 0
      ;;
    *)
      return 1  # occupied by someone else
      ;;
  esac
}

FRONTEND_PORT=""
BACKEND_PORT=""

while [ $SLOT_INDEX -lt ${#SLOT_BASES[@]} ]; do
  BASE_F=${SLOT_BASES[$SLOT_INDEX]}
  BASE_B=$((BASE_F + 10000))
  TEST_F=$((BASE_F + TAIL4))
  TEST_B=$((BASE_B + TAIL4))
  
  echo "Trying slot $SLOT_INDEX: FRONTEND=$TEST_F, BACKEND=$TEST_B"
  
  if check_port $TEST_F && check_port $TEST_B; then
    FRONTEND_PORT=$TEST_F
    BACKEND_PORT=$TEST_B
    break
  fi
  
  SLOT_INDEX=$((SLOT_INDEX + 1))
done

if [ -z "$FRONTEND_PORT" ] || [ -z "$BACKEND_PORT" ]; then
  echo "ERROR: All port slots are occupied!"
  echo "Please stop other projects or check processes manually."
  exit 1
fi

echo "Selected ports: FRONTEND=$FRONTEND_PORT, BACKEND=$BACKEND_PORT"

# Update .env
ENV_FILE="$PROJECT_DIR/.env"
cp "$ENV_FILE" "$ENV_FILE.bak"
sed -i '' "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$FRONTEND_PORT/" "$ENV_FILE"
sed -i '' "s/^BACKEND_PORT=.*/BACKEND_PORT=$BACKEND_PORT/" "$ENV_FILE"
sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://127.0.0.1:$FRONTEND_PORT|" "$ENV_FILE"
sed -i '' "s|^BACKEND_URL=.*|BACKEND_URL=http://127.0.0.1:$BACKEND_PORT|" "$ENV_FILE"
sed -i '' "s|^API_BASE_URL=.*|API_BASE_URL=http://127.0.0.1:$BACKEND_PORT/api|" "$ENV_FILE"
sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://127.0.0.1:$BACKEND_PORT/api|" "$ENV_FILE"
sed -i '' "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://127.0.0.1:$FRONTEND_PORT|" "$ENV_FILE"

echo ".env updated successfully"
cat "$ENV_FILE"
