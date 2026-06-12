#!/bin/zsh
set -e

cd /Users/chen/Documents/trae_projects/local_projects/may-89180
export PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOST="127.0.0.1"
export PORT="59180"
export BACKEND_PORT="59180"
export FRONTEND_PORT="49180"
export FRONTEND_URL="http://127.0.0.1:49180"
export BACKEND_URL="http://127.0.0.1:59180"
export NODE_ENV="development"

printf '[backend-launch] %s starting may-89180 backend\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

./node_modules/.bin/esbuild api/server.ts --bundle --platform=node --format=esm --packages=external --outfile=.backend-build/server.mjs

exec /Users/chen/.nvm/versions/node/v22.22.0/bin/node /Users/chen/Documents/trae_projects/local_projects/may-89180/.backend-build/server.mjs
