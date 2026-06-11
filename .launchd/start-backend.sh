#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89113"
cd "$PROJECT_DIR"

export PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
set -a
source "$PROJECT_DIR/.env"
set +a

export HOST="${HOST:-127.0.0.1}"
export BACKEND_PORT="${BACKEND_PORT:-59113}"

exec /Users/chen/.nvm/versions/node/v22.22.0/bin/node backend/server.js
