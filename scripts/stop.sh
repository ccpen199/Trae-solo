#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

stop_service() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name is not running"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "stopped $name pid $pid"
  else
    echo "$name pid file was stale"
  fi
  rm -f "$pid_file"
}

stop_service frontend frontend.pid
stop_service backend backend.pid

