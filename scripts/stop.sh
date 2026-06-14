#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
TMUX_BIN="${TMUX_BIN:-/opt/homebrew/bin/tmux}"
ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

pid_cwd() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

stop_project_port() {
  local port="$1"
  local label="$2"
  [ -z "$port" ] && return 0
  local pid
  pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n1 || true)"
  [ -z "$pid" ] && return 0

  local cwd
  cwd="$(pid_cwd "$pid")"
  case "$cwd" in
    "$PROJECT_DIR"/*)
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5; do
        kill -0 "$pid" 2>/dev/null || break
        sleep 0.3
      done
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      echo "stopped $label pid $pid on port $port"
      ;;
    *)
      echo "skip $label pid $pid on port $port outside project: ${cwd:-unknown}"
      ;;
  esac
}

for session in "pinai_${PROJECT_NAME}_frontend" "pinai_${PROJECT_NAME}_backend"; do
  if "$TMUX_BIN" has-session -t "$session" >/dev/null 2>&1; then
    "$TMUX_BIN" kill-session -t "$session"
    echo "stopped $session"
  fi
done

stop_project_port "${FRONTEND_PORT:-49090}" "frontend"
stop_project_port "${BACKEND_PORT:-59090}" "backend"
