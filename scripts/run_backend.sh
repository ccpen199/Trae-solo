#!/usr/bin/env zsh
set -e

cd /Users/chen/Documents/trae_projects/local_projects/may-89241
export PATH="/Users/chen/.nvm/versions/node/v22.22.0/bin:$PATH"
echo $$ > backend.pid

cd backend
npm run build
exec node dist/index.js
