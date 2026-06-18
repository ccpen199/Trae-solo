#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
source .env
set +a
exec python3 -m http.server "${FRONTEND_PORT}" --bind "${HOST}" --directory frontend
