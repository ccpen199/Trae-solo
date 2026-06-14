#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
set +a

ENV_FILE="$ROOT/.env"
BASE_PORT="${FRONTEND_PORT:-48822}"
PORT="$BASE_PORT"
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT:-58822}/api/health"

set_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file

  touch "$ENV_FILE"
  tmp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    $0 ~ "^" key "=" {
      print key "=" value
      updated = 1
      next
    }
    { print }
    END {
      if (!updated) print key "=" value
    }
  ' "$ENV_FILE" > "$tmp_file"
  mv "$tmp_file" "$ENV_FILE"
  export "$key=$value"
}

frontend_url_for_port() {
  echo "http://127.0.0.1:$1/"
}

wait_for_backend() {
  local attempt
  for attempt in $(seq 1 60); do
    if curl -fsS --max-time 2 "$BACKEND_HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  echo "Backend health check failed at ${BACKEND_HEALTH_URL}" >&2
  return 1
}

existing_pid_for_port() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -n 1
}

pid_cwd() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

pid_command() {
  ps -p "$1" -o command= 2>/dev/null || true
}

wait_for_backend
cd "$ROOT/frontend"
npm run build

wait_for_port_release() {
  local port="$1"
  local attempt
  for attempt in $(seq 1 20); do
    if [ -z "$(existing_pid_for_port "$port")" ]; then
      return 0
    fi
    sleep 0.25
  done
  return 1
}

choose_frontend_port() {
  local offset
  local candidate
  local pid
  local cwd
  local frontend_url

  for offset in $(seq 0 10); do
    candidate=$((BASE_PORT + offset * 1000))
    if [ "$candidate" -gt 65535 ]; then
      continue
    fi

    pid="$(existing_pid_for_port "$candidate")"
    frontend_url="$(frontend_url_for_port "$candidate")"
    if [ -z "$pid" ]; then
      PORT="$candidate"
      return 0
    fi

    cwd="$(pid_cwd "$pid")"
    if [ "$cwd" = "$ROOT/frontend" ]; then
      command="$(pid_command "$pid")"
      if [[ "$command" == *"/vite/bin/vite.js"* || "$command" == *" vite "* ]]; then
        echo "Frontend pid ${pid} is a Vite dev server; switching this project to static preview" >&2
        kill "$pid" 2>/dev/null || true
        if wait_for_port_release "$candidate"; then
          PORT="$candidate"
          return 0
        fi
        echo "Port ${candidate} did not release after stopping pid ${pid}" >&2
        continue
      fi

      if curl -fsS --max-time 2 "$frontend_url" >/dev/null 2>&1; then
        PORT="$candidate"
        if [ "$PORT" != "$BASE_PORT" ]; then
          set_env_value FRONTEND_PORT "$PORT"
          echo "Using frontend backup port ${PORT}; .env updated"
        fi
        echo "$pid" > "$ROOT/frontend.pid"
        echo "Frontend already running on http://127.0.0.1:${PORT} (pid ${pid})"
        exit 0
      fi

      echo "Frontend pid ${pid} is unhealthy on ${frontend_url}; restarting this project process" >&2
      kill "$pid" 2>/dev/null || true
      if wait_for_port_release "$candidate"; then
        PORT="$candidate"
        return 0
      fi
      echo "Port ${candidate} did not release after stopping pid ${pid}" >&2
      continue
    fi

    echo "Frontend port ${candidate} is occupied by pid ${pid} outside this project: ${cwd:-unknown cwd}; trying backup slot" >&2
  done

  echo "No available frontend port found from ${BASE_PORT} backup slots" >&2
  return 1
}

choose_frontend_port
if [ "$PORT" != "$BASE_PORT" ]; then
  set_env_value FRONTEND_PORT "$PORT"
  echo "Using frontend backup port ${PORT}; .env updated"
fi
export CI="${CI:-true}"
echo "$$" > "$ROOT/frontend.pid"
exec "${NODE_BIN:-node}" preview-server.cjs
