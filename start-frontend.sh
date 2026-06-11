#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

set -a
[ -f .env ] && source ./.env
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
[ -x "$NODE_BIN" ] || NODE_BIN="$(command -v node)"

env_set() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  if [ -f .env ]; then
    awk -v key="$key" -v value="$value" '
      BEGIN { done = 0 }
      $0 ~ "^" key "=" { print key "=" value; done = 1; next }
      { print }
      END { if (!done) print key "=" value }
    ' .env > "$tmp"
  else
    printf '%s=%s\n' "$key" "$value" > "$tmp"
  fi
  mv "$tmp" .env
}

listener_pid() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n1
}

process_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1
}

process_command() {
  ps -o command= -p "$1" 2>/dev/null || true
}

resolve_port() {
  local preferred="$1"
  local port
  local attempt
  for attempt in 0 1 2 3 4; do
    port=$((preferred + attempt * 1000))
    local pid
    pid="$(listener_pid "$port")"
    if [ -z "$pid" ]; then
      printf '%s\n' "$port"
      return 0
    fi
    if [ "$(process_cwd "$pid")" = "$PROJECT_DIR" ] && echo "$(process_command "$pid")" | grep -q 'vite'; then
      kill "$pid" 2>/dev/null || true
      sleep 2
      if [ -z "$(listener_pid "$port")" ]; then
        printf '%s\n' "$port"
        return 0
      fi
    fi
  done
  return 1
}

FRONTEND_PORT="$(resolve_port "${FRONTEND_PORT:-49120}")"
env_set FRONTEND_PORT "$FRONTEND_PORT"
env_set FRONTEND_URL "http://127.0.0.1:$FRONTEND_PORT"
env_set HOST "127.0.0.1"

[ -L frontend.log ] && rm frontend.log
[ -L frontend.err.log ] && rm frontend.err.log
: > frontend.log
: > frontend.err.log

"$NODE_BIN" node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort > frontend.log 2> frontend.err.log &
pid=$!
echo "$pid" > .frontend.pid
disown "$pid" 2>/dev/null || true

sleep 3
curl -sS --max-time 8 "http://127.0.0.1:$FRONTEND_PORT/" >/dev/null
echo "Frontend ready: http://127.0.0.1:$FRONTEND_PORT"
