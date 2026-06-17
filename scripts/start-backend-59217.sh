#!/bin/zsh
cd /Users/chen/Documents/trae_projects/local_projects/may-89217
export PATH=/Users/chen/.nvm/versions/node/v22.22.0/bin:$PATH
export HOST=127.0.0.1
export BACKEND_HOST=127.0.0.1
export BACKEND_PORT=59217
export PORT=59217
exec ./node_modules/.bin/tsx api/server.ts
