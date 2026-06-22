#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-89303

echo "========================================"
echo "Starting Vite Dev Server"
echo "========================================"
echo "Date: $(date)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "========================================"

exec node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173
