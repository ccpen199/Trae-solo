#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
. "$PROJECT_DIR/.env"
set +a

FRONTEND_PORT="${FRONTEND_PORT:-43454}"
BACKEND_PORT="${BACKEND_PORT:-53454}"

curl -sS -o /dev/null -w "frontend HTTP %{http_code}\n" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/"
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
printf '\n'
