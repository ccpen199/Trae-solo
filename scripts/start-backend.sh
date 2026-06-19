#!/bin/zsh
set -e

cd "$(dirname "$0")/.."
exec >> backend.log 2>&1
echo "[start-backend] $(date '+%Y-%m-%d %H:%M:%S') cwd=$(pwd)"

set -a
[ -f .env ] && . ./.env
set +a

echo $$ > .backend.pid
exec /opt/homebrew/bin/node backend/dist/index.js
