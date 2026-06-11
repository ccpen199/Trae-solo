#!/bin/bash
cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"
cd frontend
nohup npx vite --host 127.0.0.1 --port 49088 --strictPort > "$PROJECT_DIR/frontend.log" 2>&1 &
echo $!
