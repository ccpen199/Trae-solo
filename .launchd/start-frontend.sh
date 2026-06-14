#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89115"
cd "$PROJECT_DIR/hangzhou-citizen-platform"

export PATH="/opt/homebrew/bin:/Users/chen/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
set -a
source "$PROJECT_DIR/.env"
set +a

export HOST="${HOST:-127.0.0.1}"
export FRONTEND_PORT="${FRONTEND_PORT:-49115}"
export BACKEND_PORT="${BACKEND_PORT:-59115}"

exec /opt/homebrew/bin/npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
