#!/bin/zsh
set -e

cd /Users/chen/Documents/trae_projects/local_projects/may-89180
export PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOST="127.0.0.1"
export FRONTEND_PORT="49180"
export BACKEND_PORT="59180"
export PORT="49180"
export FRONTEND_URL="http://127.0.0.1:49180"
export BACKEND_URL="http://127.0.0.1:59180"
export VITE_API_URL="http://127.0.0.1:59180"
export VITE_API_BASE_URL="http://127.0.0.1:59180"
export NODE_ENV="development"

printf '[frontend-launch] %s starting may-89180 frontend\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

exec ./node_modules/.bin/vite --host "$HOST" --port "$FRONTEND_PORT" --strictPort --clearScreen false
