#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

PORT=${BACKEND_PORT:-59092}

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)

if [ -z "$pid" ]; then
  echo "No process found on port $PORT"
  exit 0
fi

cwd=$(lsof -a -p "$pid" -d cwd -Fn | grep '^n' | sed 's/^n//' | xargs)
cmd=$(ps -o args= -p "$pid")

echo "Found PID $pid on port $PORT"
echo "cwd=$cwd"
echo "cmd=$cmd"

case "$cwd" in
  "$PROJECT_DIR"/*)
    echo "Killing PID $pid (belongs to this project)"
    kill "$pid"
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      echo "Process still running, force killing..."
      kill -9 "$pid"
    fi
    echo "Done"
    ;;
  *)
    echo "skip kill: cwd=$cwd cmd=$cmd"
    echo "Process does not belong to this project, trying next port slot"
    exit 1
    ;;
esac
