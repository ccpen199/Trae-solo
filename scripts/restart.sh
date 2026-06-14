#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== 重启项目服务 ==="
echo ""

"$SCRIPT_DIR/stop.sh"

echo ""
echo "等待 2 秒..."
sleep 2

"$SCRIPT_DIR/start.sh"
