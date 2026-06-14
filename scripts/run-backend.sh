#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
BACKEND_LOG="$PROJECT_DIR/backend.log"

set -a
source "$ENV_FILE"
set +a

NODE_BIN="${NODE_BIN:-/Users/chen/.nvm/versions/node/v22.22.0/bin/node}"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

cd "$PROJECT_DIR/backend"
exec "$NODE_BIN" -r "$PROJECT_DIR/backend/node_modules/ts-node/register/transpile-only" "$PROJECT_DIR/backend/src/index.ts" --skip-port-check >> "$BACKEND_LOG" 2>&1
