#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

FRONTEND_PORT=${FRONTEND_PORT:-43447}
BACKEND_PORT=${BACKEND_PORT:-53447}

echo "前端: http://127.0.0.1:$FRONTEND_PORT/"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" --max-time 5 "http://127.0.0.1:$FRONTEND_PORT/"
echo "后端: http://127.0.0.1:$BACKEND_PORT/api/health"
curl -sS --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/health"
echo ""
