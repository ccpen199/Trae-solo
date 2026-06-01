#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source .env
set +a

cd "$PROJECT_DIR/backend"
if [ -z "${NODE_BIN:-}" ] || [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi
exec "$NODE_BIN" src/index.js
