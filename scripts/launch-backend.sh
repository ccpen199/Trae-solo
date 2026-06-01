#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-63456"
exec >> "$PROJECT_DIR/backend.log" 2>&1
cd "$PROJECT_DIR/backend"
exec /opt/homebrew/bin/node src/server.js
