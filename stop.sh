#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
LAUNCH_DOMAIN="gui/$(id -u)"
BACKEND_LABEL="local.codex.may-63449.backend.run"
FRONTEND_LABEL="local.codex.may-63449.frontend.run"

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

echo "Stopping Parking Guidance System..."

for label in "$BACKEND_LABEL" "$FRONTEND_LABEL" local.codex.may-63449.backend local.codex.may-63449.frontend local.codex.may-63449.backend2 local.codex.may-63449.backend3 local.codex.may-63449.frontend2 local.pinai.may-63449.backend local.test.backend49 local.test.backend49x local.test.backend49y local.test.backend49z local.may-63449.backend local.may-63449.frontend local.test.frontend49 local.test.frontend49run local.test.frontend49debug; do
  launchctl bootout "$LAUNCH_DOMAIN/$label" >/dev/null 2>&1 || true
  launchctl remove "$label" >/dev/null 2>&1 || true
done

for pid_file in backend.pid frontend.pid; do
  if [[ -f "$pid_file" ]]; then
    stop_project_pid "$(cat "$pid_file")"
    rm -f "$pid_file"
  fi
done

for port in "${FRONTEND_PORT:-43449}" "${BACKEND_PORT:-53449}"; do
  for pid in $(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null); do
    if pid_in_project "$pid"; then
      stop_project_pid "$pid"
    else
      echo "Skipping process $pid on port $port: not in project directory"
    fi
  done
done
