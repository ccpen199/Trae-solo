#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
source ./.env
set +a

exec npm exec -- vite --strictPort --host 127.0.0.1 --port "$FRONTEND_PORT"
