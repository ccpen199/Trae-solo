#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
source ./.env
set +a

: "${HOST:=127.0.0.1}"
: "${FRONTEND_PORT:=49143}"
: "${BACKEND_PORT:=59143}"

python3 scripts/daemonize.py \
  --cwd "$(pwd)" \
  --pidfile "$(pwd)/backend.pid" \
  --log "$(pwd)/backend.log" \
  -- python3 backend.py

python3 scripts/daemonize.py \
  --cwd "$(pwd)" \
  --pidfile "$(pwd)/frontend.pid" \
  --log "$(pwd)/frontend.log" \
  -- python3 -m http.server "${FRONTEND_PORT}" --bind "${HOST}" --directory frontend

echo "frontend=http://${HOST}:${FRONTEND_PORT}/"
echo "backend=http://${HOST}:${BACKEND_PORT}"
