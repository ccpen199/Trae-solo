#!/bin/bash
set -e

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

source .env

if [ "$1" = "backend" ]; then
  PORT=$BACKEND_PORT
elif [ "$1" = "frontend" ]; then
  PORT=$FRONTEND_PORT
else
  echo "Usage: $0 [backend|frontend]"
  exit 1
fi

get_cwd() {
  local pid=$1
  lsof -p "$pid" -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-
}

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -n1)
if [ -z "$pid" ]; then
  echo "No process found on port $PORT"
  exit 0
fi

cwd=$(get_cwd "$pid")
cmd=$(ps -o command= -p "$pid" 2>/dev/null)

echo "Found pid=$pid on port=$PORT, cwd=$cwd"

case "$cwd" in
  "$PROJECT_DIR"/*)
    echo "Killing pid=$pid (belongs to this project)"
    kill "$pid"
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid"
    fi
    echo "Stopped"
    ;;
  *)
    echo "skip kill: cwd=$cwd cmd=$cmd"
    echo "Process does not belong to this project, not killing"
    exit 1
    ;;
esac
