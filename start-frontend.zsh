#!/bin/zsh

cd /Users/chen/Documents/trae_projects/local_projects/may-89174 || exit 1

export HOST=127.0.0.1
export FRONTEND_PORT=49174
export BACKEND_PORT=59174
export PORT=49174
export FRONTEND_URL=http://127.0.0.1:49174
export BACKEND_URL=http://127.0.0.1:59174
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1

exec /opt/homebrew/bin/node /Users/chen/Documents/trae_projects/local_projects/may-89174/node_modules/next/dist/bin/next dev --hostname "$HOST" --port "$FRONTEND_PORT" >> /Users/chen/Documents/trae_projects/local_projects/may-89174/frontend.log 2>> /Users/chen/Documents/trae_projects/local_projects/may-89174/frontend.error.log
