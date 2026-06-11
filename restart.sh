#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Restarting project may-89103..."
echo "========================================"

"$PROJECT_DIR/stop.sh"

echo ""
echo "Waiting 2 seconds before restart..."
sleep 2

"$PROJECT_DIR/start.sh"
