#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:/Users/chen/.nvm/versions/node/v22.22.0/bin:$PATH"
set -a
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
set +a

cd "$ROOT/frontend"
npm run build
exec node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port "${FRONTEND_PORT:-48769}" --strictPort
