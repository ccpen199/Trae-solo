#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Stopping all services for $PROJECT_DIR"
bash "$SCRIPT_DIR/stop-frontend.sh" || true
echo ""
bash "$SCRIPT_DIR/stop-backend.sh" || true
echo ""
echo "All stop scripts completed"
