#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-63456"
exec >> "$PROJECT_DIR/frontend.log" 2>&1
cd "$PROJECT_DIR/frontend"
exec /opt/homebrew/bin/node server.cjs
