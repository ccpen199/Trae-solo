#!/bin/zsh

cd /Users/chen/Documents/trae_projects/local_projects/may-89174 || exit 1

export HOST=127.0.0.1
export BACKEND_PORT=59174
export PORT=59174
export FRONTEND_PORT=49174
export FRONTEND_URL=http://127.0.0.1:49174
export BACKEND_URL=http://127.0.0.1:59174
export NODE_ENV=development

exec /opt/homebrew/bin/node /Users/chen/Documents/trae_projects/local_projects/may-89174/api/server.mjs
