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
export BACKEND_PORT="${BACKEND_PORT:-59135}"
export PORT="$BACKEND_PORT"
export DB_PATH="${DB_PATH:-api/db/recycle.db}"

echo $$ > "$PROJECT_DIR/backend.pid"
exec "$NODE22" "$PROJECT_DIR/node_modules/tsx/dist/cli.mjs" api/server.ts >> "$PROJECT_DIR/backend.log" 2>&1
