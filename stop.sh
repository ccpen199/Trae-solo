#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

set -a
. "$PROJECT_DIR/.env"
set +a

owner_matches_project() {
  local pid="$1"
  local cwd
  local cmd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  [[ "$cwd" == "$PROJECT_DIR"* || "$cmd" == *"$PROJECT_DIR"* ]]
}

for PORT in "$FRONTEND_PORT" "$BACKEND_PORT"; do
  pid="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  if [ -n "$pid" ]; then
    if owner_matches_project "$pid"; then
      kill "$pid" 2>/dev/null && echo "Stopped process $pid on port $PORT"
    else
      echo "Skipping process $pid on port $PORT: not in project directory"
    fi
  else
    echo "No process found on port $PORT"
  fi
done
