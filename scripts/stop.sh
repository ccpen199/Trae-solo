#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== 停止当前项目所有进程 ==="
./scripts/port-manager.sh stop-all

echo ""
echo "✅ 已停止所有属于当前项目的进程"
./scripts/port-manager.sh status
