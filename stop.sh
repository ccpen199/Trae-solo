#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

owner_matches_project() {
  local pid="$1"
  local cwd
  local cmd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
  [[ "$cwd" == "$PROJECT_DIR"* || "$cmd" == *"$PROJECT_DIR"* ]]
}

stop_pid_file() {
  local pid_file="$1"
  if [ ! -f "$pid_file" ]; then
    return
  fi
  local pid
  pid="$(cat "$pid_file")"
  if [ -n "$pid" ] && ps -p "$pid" >/dev/null 2>&1 && owner_matches_project "$pid"; then
    echo "Stopping PID $pid"
    kill "$pid" 2>/dev/null || true
  fi
  rm -f "$pid_file"
}

stop_pid_file "$PROJECT_DIR/frontend.pid"
stop_pid_file "$PROJECT_DIR/backend.pid"
