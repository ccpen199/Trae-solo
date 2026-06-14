#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_DIR/.env"

curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
echo
curl -sS -o /dev/null -w "frontend_http=%{http_code}\n" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/"
