#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

set -a
source "$ROOT/.env"
set +a

exec python3 -m http.server "$FRONTEND_PORT" --bind "$HOST" --directory "$ROOT/frontend"
