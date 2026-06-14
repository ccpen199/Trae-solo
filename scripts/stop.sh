#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$PROJECT_DIR/.env"

stop_port() {
  local port="$1"
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -n "$pid" ] || return 0
  local cwd args
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1 || true)"
  args="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  if [[ "$cwd" == "$PROJECT_DIR"* || "$args" == *"$PROJECT_DIR"* ]]; then
    kill "$pid" 2>/dev/null || true
  else
    echo "Skip PID $pid on $port; not owned by $PROJECT_DIR"
  fi
}

stop_port "$FRONTEND_PORT"
stop_port "$BACKEND_PORT"
