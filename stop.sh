#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
LAUNCH_DOMAIN="gui/$(id -u)"
BACKEND_LABEL="local.codex.may-63450.backend.run"
FRONTEND_LABEL="local.codex.may-63450.frontend.run"

set -a
source "$PROJECT_DIR/.env"
set +a

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'
}

pid_in_project() {
  local cwd
  cwd="$(pid_cwd "$1")"
  [[ -n "$cwd" && "$cwd" == "$PROJECT_DIR"* ]]
}

stop_project_pid() {
  local pid="$1"
  if kill -0 "$pid" 2>/dev/null && pid_in_project "$pid"; then
    kill "$pid" 2>/dev/null || true
    echo "Stopped process $pid"
  fi
}

echo "Stopping Charging Parking System..."

for label in "$BACKEND_LABEL" "$FRONTEND_LABEL" local.codex.may-63450.backend local.codex.may-63450.frontend local.codex.may-63450.backend2 local.codex.may-63450.frontend2 local.may-63450.backend local.may-63450.frontend; do
  launchctl bootout "$LAUNCH_DOMAIN/$label" >/dev/null 2>&1 || true
  launchctl remove "$label" >/dev/null 2>&1 || true
done

for pid_file in backend.pid frontend.pid; do
  if [[ -f "$pid_file" ]]; then
    stop_project_pid "$(cat "$pid_file")"
    rm -f "$pid_file"
  fi
done

for port in "${FRONTEND_PORT:-43450}" "${BACKEND_PORT:-53450}"; do
  for pid in $(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null); do
    if pid_in_project "$pid"; then
      stop_project_pid "$pid"
    else
      echo "Skipping process $pid on port $port: not in project directory"
    fi
  done
done
