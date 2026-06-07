#!/bin/bash
NODE_BIN="/Users/chen/.nvm/versions/node/v22.22.0/bin/node"
cd /Users/chen/Documents/trae_projects/local_projects/may-89014/frontend
exec "$NODE_BIN" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 49014 --strictPort
