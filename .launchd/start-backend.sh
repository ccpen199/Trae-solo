#!/bin/bash
set -euo pipefail

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89105"
cd "$PROJECT_DIR"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
set -a
source "$PROJECT_DIR/.env"
set +a

export NODE_ENV="${NODE_ENV:-development}"
export HOST="${HOST:-127.0.0.1}"
export BACKEND_PORT="${BACKEND_PORT:-59105}"

exec /opt/homebrew/bin/node --import tsx/esm api/server.ts
