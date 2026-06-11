#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-49100}
BACKEND_PORT=${BACKEND_PORT:-59100}

echo "=== Stopping Project Services ==="
echo "PROJECT_DIR=$PROJECT_DIR"
echo ""

kill_if_owned() {
  local PORT=$1
  local NAME=$2
  local pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)

  if [ -z "$pid" ]; then
    echo "$NAME (port $PORT): not running"
    return 0
  fi

  local cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)
  local cmd=$(ps -o command= -p "$pid" 2>/dev/null)

  if [ -z "$cwd" ]; then
    echo "$NAME (port $PORT, pid $pid): cwd unknown, SKIPPING (use fallback port)"
    return 1
  fi

  case "$cwd" in
    "$PROJECT_DIR"|"$PROJECT_DIR"/*)
      echo "$NAME (port $PORT, pid $pid): cwd=$cwd - killing"
      kill "$pid"
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        echo "  Force killing..."
        kill -9 "$pid"
      fi
      echo "  Stopped."
      return 0
      ;;
    *)
      echo "$NAME (port $PORT, pid $pid): cwd=$cwd NOT in $PROJECT_DIR, SKIPPING"
      echo "  cmd=$cmd"
      return 1
      ;;
  esac
}

FRONTEND_STOPPED=0
BACKEND_STOPPED=0

kill_if_owned $FRONTEND_PORT "Frontend" || FRONTEND_STOPPED=1
kill_if_owned $BACKEND_PORT "Backend" || BACKEND_STOPPED=1

if [ "$FRONTEND_STOPPED" -ne 0 ] || [ "$BACKEND_STOPPED" -ne 0 ]; then
  echo ""
  echo "WARNING: Some services could not be stopped due to ownership verification."
  echo "Consider using fallback ports in .env or manually verify the processes."
fi

echo ""
echo "Done."
