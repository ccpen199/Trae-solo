#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89135"
NODE22="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"
cd "$PROJECT_DIR"

set -a
source "$PROJECT_DIR/.env"
set +a

export PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOST="${HOST:-127.0.0.1}"
export FRONTEND_PORT="${FRONTEND_PORT:-49135}"
export BACKEND_PORT="${BACKEND_PORT:-59135}"
export VITE_API_URL="${VITE_API_URL:-http://127.0.0.1:59135/api}"

echo $$ > "$PROJECT_DIR/frontend.pid"
exec "$NODE22" ./node_modules/vite/bin/vite.js --host "$HOST" --port "$FRONTEND_PORT" --strictPort >> "$PROJECT_DIR/frontend.log" 2>&1
