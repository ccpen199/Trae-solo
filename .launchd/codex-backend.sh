#!/bin/zsh
cd /Users/chen/Documents/trae_projects/local_projects/may-89100 || exit 1
exec >> backend.log 2>&1
export HOST=127.0.0.1
export BACKEND_PORT=59100
export FRONTEND_URL=http://127.0.0.1:50100
exec /Users/chen/.nvm/versions/node/v22.22.0/bin/node --import tsx api/server.ts
