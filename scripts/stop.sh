#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
JOB_PREFIX="$(basename "$PROJECT_DIR" | tr -cd '[:alnum:]')"
BACKEND_LABEL="${JOB_PREFIX}backend"
FRONTEND_LABEL="${JOB_PREFIX}frontend"

belongs_to_project() {
  local pid="$1"
  local cwd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)"
  case "$cwd" in
    "$PROJECT_DIR"*) return 0 ;;
    *) return 1 ;;
  esac
}

if command -v launchctl >/dev/null 2>&1; then
  launchctl remove "$BACKEND_LABEL" 2>/dev/null || true
  launchctl remove "$FRONTEND_LABEL" 2>/dev/null || true
fi

stop_pid_file() {
  local file="$1"
  if [ -f "$file" ]; then
    local pid
    pid="$(cat "$file")"
    if kill -0 "$pid" 2>/dev/null && belongs_to_project "$pid"; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$file"
  fi
}

stop_pid_file "$PROJECT_DIR/frontend.pid"
stop_pid_file "$PROJECT_DIR/backend.pid"
