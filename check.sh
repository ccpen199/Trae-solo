#!/bin/bash
echo "=== 端口检查 ==="
echo -n "后端 54417: "
lsof -nP -iTCP:54417 -sTCP:LISTEN -t 2>/dev/null || echo "未监听"
echo -n "前端 44417: "
lsof -nP -iTCP:44417 -sTCP:LISTEN -t 2>/dev/null || echo "未监听"

echo ""
echo "=== 后端健康 ==="
curl -sS --max-time 5 http://127.0.0.1:54417/api/health 2>&1
echo ""

echo ""
echo "=== 前端首页 ==="
curl -sS -o /dev/null -w "HTTP状态: %{http_code}\n" --max-time 10 http://127.0.0.1:44417/ 2>&1
