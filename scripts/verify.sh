#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$PROJECT_DIR/.env"

curl -sS -o /dev/null -w "frontend %{http_code}\n" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/"
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
echo
