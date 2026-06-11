#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
if [ -f .env ]; then
  # shellcheck disable=SC1091
  . ./.env
fi
set +a

export HOST="${HOST:-127.0.0.1}"
export BACKEND_PORT="${BACKEND_PORT:-59121}"
exec node api/server.mjs
