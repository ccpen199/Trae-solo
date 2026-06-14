#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

PORT_MANAGER="$PROJECT_DIR/scripts/port-manager.sh"
chmod +x "$PORT_MANAGER"

echo "=== 停止项目服务 ==="
echo "项目目录: $PROJECT_DIR"
echo ""

echo "1. 检查当前运行的进程..."
bash "$PORT_MANAGER" check
echo ""

echo "2. 安全终止本项目进程..."
bash "$PORT_MANAGER" kill-all
echo ""

echo "3. 确认端口已释放..."
sleep 2
bash "$PORT_MANAGER" check
echo ""

echo "=== 停止完成 ==="
echo "如果需要重新启动，请运行: bash scripts/start.sh"
