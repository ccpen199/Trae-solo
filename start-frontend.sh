#!/bin/bash
set -a
source "$(dirname "$0")/.env"
set +a

cd "$(dirname "$0")/frontend"
exec node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "${FRONTEND_PORT:-43423}" --strictPort
