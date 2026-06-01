#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found: $ENV_FILE"
  exit 1
fi

TAIL4=$(grep '^TAIL4=' "$ENV_FILE" | cut -d'=' -f2)
if [ -z "$TAIL4" ]; then
  echo "❌ TAIL4 not found in .env"
  exit 1
fi

SLOT_BASES=(40000 41000 42000 43000 44000 45000)
BACKEND_BASE_OFFSET=10000

function check_port_owner() {
  local port=$1
  local pid=$(lsof -nP -iTCP:$port -sTCP:LISTEN -t 2>/dev/null | head -n1)
  if [ -z "$pid" ]; then
    echo "free"
    return
  fi
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "mine:$pid"
      ;;
    *)
      echo "other:$pid:$cwd"
      ;;
  esac
}

function update_env_ports() {
  local fe_port=$1
  local be_port=$2
  sed -i.bak "s/^FRONTEND_PORT=.*/FRONTEND_PORT=$fe_port/" "$ENV_FILE"
  sed -i.bak "s/^BACKEND_PORT=.*/BACKEND_PORT=$be_port/" "$ENV_FILE"
  rm -f "${ENV_FILE}.bak"
  echo "✅ Updated .env: FRONTEND_PORT=$fe_port, BACKEND_PORT=$be_port"
}

function kill_my_process() {
  local port=$1
  local pid=$2
  local cwd=$(ps -o cwd= -p "$pid" 2>/dev/null | xargs)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  case "$cwd" in
    "$PROJECT_DIR"/*)
      echo "🔄 Killing project process PID=$pid (cwd=$cwd)"
      kill "$pid" 2>/dev/null || true
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      ;;
    *)
      echo "⚠️  Skipping kill: PID=$pid cwd=$cwd not in project"
      ;;
  esac
}

SLOT_INDEX=0
SELECTED_FE=0
SELECTED_BE=0

while [ $SLOT_INDEX -lt ${#SLOT_BASES[@]} ]; do
  BASE=${SLOT_BASES[$SLOT_INDEX]}
  FE_PORT=$((BASE + TAIL4))
  BE_PORT=$((BASE + BACKEND_BASE_OFFSET + TAIL4))

  echo "🔍 Checking slot $((SLOT_INDEX + 1)): FE=$FE_PORT, BE=$BE_PORT"

  FE_STATUS=$(check_port_owner $FE_PORT)
  BE_STATUS=$(check_port_owner $BE_PORT)

  FE_FREE=false
  BE_FREE=false

  if [ "$FE_STATUS" = "free" ]; then
    FE_FREE=true
  elif [[ "$FE_STATUS" == mine:* ]]; then
    FE_PID=${FE_STATUS#mine:}
    echo "⚠️  Frontend port $FE_PORT used by project PID=$FE_PID"
    kill_my_process $FE_PORT $FE_PID
    FE_FREE=true
  fi

  if [ "$BE_STATUS" = "free" ]; then
    BE_FREE=true
  elif [[ "$BE_STATUS" == mine:* ]]; then
    BE_PID=${BE_STATUS#mine:}
    echo "⚠️  Backend port $BE_PORT used by project PID=$BE_PID"
    kill_my_process $BE_PORT $BE_PID
    BE_FREE=true
  fi

  if [[ "$FE_STATUS" == other:* ]] || [[ "$BE_STATUS" == other:* ]]; then
    echo "⚠️  Slot $((SLOT_INDEX + 1)) ports occupied by other project"
    if [[ "$FE_STATUS" == other:* ]]; then
      IFS=':' read -r _ PID CWD <<< "$FE_STATUS"
      echo "   FE port $FE_PORT: PID=$PID cwd=$CWD"
    fi
    if [[ "$BE_STATUS" == other:* ]]; then
      IFS=':' read -r _ PID CWD <<< "$BE_STATUS"
      echo "   BE port $BE_PORT: PID=$PID cwd=$CWD"
    fi
    SLOT_INDEX=$((SLOT_INDEX + 1))
    continue
  fi

  if [ "$FE_FREE" = true ] && [ "$BE_FREE" = true ]; then
    SELECTED_FE=$FE_PORT
    SELECTED_BE=$BE_PORT
    break
  fi

  SLOT_INDEX=$((SLOT_INDEX + 1))
done

if [ $SELECTED_FE -eq 0 ] || [ $SELECTED_BE -eq 0 ]; then
  echo "❌ ERROR: All slots occupied!"
  echo "   Slots checked:"
  for i in "${!SLOT_BASES[@]}"; do
    BASE=${SLOT_BASES[$i]}
    FE=$((BASE + TAIL4))
    BE=$((BASE + BACKEND_BASE_OFFSET + TAIL4))
    echo "   Slot $((i+1)): FE=$FE BE=$BE"
  done
  echo "   Please free ports or adjust TAIL4 in .env"
  exit 1
fi

CURRENT_FE=$(grep '^FRONTEND_PORT=' "$ENV_FILE" | cut -d'=' -f2)
CURRENT_BE=$(grep '^BACKEND_PORT=' "$ENV_FILE" | cut -d'=' -f2)

if [ "$CURRENT_FE" != "$SELECTED_FE" ] || [ "$CURRENT_BE" != "$SELECTED_BE" ]; then
  update_env_ports $SELECTED_FE $SELECTED_BE
fi

echo "✅ Ports ready: FRONTEND=$SELECTED_FE, BACKEND=$SELECTED_BE"
echo "$SELECTED_FE $SELECTED_BE"
