#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== 重启项目服务 ==="
echo ""

bash "$PROJECT_DIR/scripts/stop.sh"
echo ""
sleep 2
bash "$PROJECT_DIR/scripts/start.sh"
