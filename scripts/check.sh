#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

set -a
source "$PROJECT_DIR/.env"
set +a

FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}/"
BACKEND_HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}/api/health"

echo "frontend_status=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$FRONTEND_URL")"
echo "backend_health=$(curl -fsS --max-time 5 "$BACKEND_HEALTH_URL")"

