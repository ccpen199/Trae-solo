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
export FRONTEND_PORT="${FRONTEND_PORT:-49121}"
exec npm run client:dev -- --host "$HOST" --port "$FRONTEND_PORT"
