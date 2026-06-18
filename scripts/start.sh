#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

HOST="${HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-49137}"
BACKEND_PORT="${BACKEND_PORT:-59137}"

if [[ "$HOST" != "127.0.0.1" ]]; then
  echo "Refusing to start: HOST must be 127.0.0.1" >&2
  exit 1
fi

mkdir -p .runtime backend/data frontend

wait_for_url() {
  local url="$1"
  local tries="${2:-40}"
  local delay="${3:-0.25}"
  local i
  for ((i = 1; i <= tries; i += 1)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done
  echo "Timed out waiting for $url" >&2
  return 1
}

cat > frontend/config.js <<CONFIG
window.APP_CONFIG = {
  backendUrl: "http://${HOST}:${BACKEND_PORT}"
};
CONFIG

PYTHON_BIN="/usr/bin/python3"
if [[ ! -x "$PYTHON_BIN" ]]; then
  PYTHON_BIN="$(command -v python3)"
fi

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(cat "$pid_file")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null || return 1
  local cwd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | awk '/^n/ { sub(/^n/, ""); print; exit }')"
  [[ "$cwd" == "$ROOT"* ]]
}

start_job() {
  local name="$1"
  local url="$2"
  shift 2
  if curl -fsS "$url" >/dev/null 2>&1; then
    return 0
  fi
  if is_running ".runtime/${name}.pid"; then
    echo "${name} has a running pid but ${url} is unhealthy" >&2
    return 1
  fi
  rm -f ".runtime/${name}.pid"
  "$PYTHON_BIN" "$ROOT/scripts/daemonize.py" \
    --pid-file "$ROOT/.runtime/${name}.pid" \
    --log-file "$ROOT/${name}.log" \
    --cwd "$ROOT" \
    -- "$@"
  wait_for_url "$url"
}

start_job backend "http://${HOST}:${BACKEND_PORT}/api/health" \
  "$PYTHON_BIN" -u "$ROOT/backend/server.py"

start_job frontend "http://${HOST}:${FRONTEND_PORT}/" \
  "$PYTHON_BIN" -m http.server "$FRONTEND_PORT" --bind "$HOST" --directory frontend

lsof -nP -t -iTCP:"$BACKEND_PORT" -sTCP:LISTEN > .runtime/backend.pid 2>/dev/null || true
lsof -nP -t -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN > .runtime/frontend.pid 2>/dev/null || true

echo "frontend=http://${HOST}:${FRONTEND_PORT}/"
echo "backend=http://${HOST}:${BACKEND_PORT}"
