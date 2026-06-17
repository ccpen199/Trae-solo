#!/bin/zsh
cd /Users/chen/Documents/trae_projects/local_projects/may-89217
export PATH=/Users/chen/.nvm/versions/node/v22.22.0/bin:$PATH
export HOST=127.0.0.1
export FRONTEND_HOST=127.0.0.1
export FRONTEND_PORT=49217
export APP_PORT=49217
export BACKEND_HOST=127.0.0.1
export BACKEND_PORT=59217
exec ./node_modules/.bin/vite --host 127.0.0.1 --port 49217
