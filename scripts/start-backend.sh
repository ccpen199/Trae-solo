#!/bin/zsh
set -e
cd /Users/chen/Documents/trae_projects/local_projects/may-89138
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NODE_ENV="development"
exec /opt/homebrew/bin/node /Users/chen/Documents/trae_projects/local_projects/may-89138/node_modules/.bin/tsx api/server.ts >> backend.log 2>&1
