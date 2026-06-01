#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

set -a
# shellcheck disable=SC1091
source ./.env
set +a

if command -v tmux >/dev/null 2>&1; then
  tmux has-session -t "${PROJECT_NAME}-frontend" 2>/dev/null && tmux kill-session -t "${PROJECT_NAME}-frontend"
  tmux has-session -t "${PROJECT_NAME}-backend" 2>/dev/null && tmux kill-session -t "${PROJECT_NAME}-backend"
fi

stop_project_port() {
  local port="$1"
  local pid
  local cwd
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
    case "$cwd" in
      "$PWD" | "$PWD"/*)
        kill "$pid" 2>/dev/null || true
        ;;
    esac
  done < <(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
}

stop_project_port "$FRONTEND_PORT"
stop_project_port "$BACKEND_PORT"

for pidfile in frontend.pid backend.pid; do
  if [[ -f "$pidfile" ]]; then
    pid="$(cat "$pidfile")"
    if [[ "$pid" =~ ^[0-9]+$ ]] && ps -p "$pid" -o command= | grep -Eq "python3 -u (frontend|backend)\\.py"; then
      kill "$pid"
    fi
    rm -f "$pidfile"
  fi
done
