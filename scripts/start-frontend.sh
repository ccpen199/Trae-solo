#!/bin/zsh
set -e

cd "$(dirname "$0")/.."
exec >> frontend.log 2>&1
echo "[start-frontend] $(date '+%Y-%m-%d %H:%M:%S') cwd=$(pwd)"

set -a
[ -f .env ] && . ./.env
set +a

echo $$ > .frontend.pid
exec /opt/homebrew/bin/npm --prefix frontend run preview
