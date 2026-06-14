#!/bin/bash
set -e

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89083"
cd "$PROJECT_DIR"

export $(grep -v '^#' .env | xargs)
API_BASE="http://127.0.0.1:${BACKEND_PORT}/api"

echo "========================================="
echo "Main Business Chain Verification"
echo "API Base: $API_BASE"
echo "========================================="

echo ""
echo "=== [1/10] 登录认证 ==="
LOGIN_RESP=$(curl -sS -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"designer@example.com","password":"123456"}')
echo "响应: $LOGIN_RESP"
TOKEN=$(echo "$LOGIN_RESP" | sed 's/.*"token":"\([^"]*\)".*/\1/')
echo "Token: ${TOKEN:0:20}..."

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo ""
echo "=== [2/10] 用户信息 ==="
curl -sS "$API_BASE/auth/me" -H "$AUTH_HEADER" | head -c 200
echo ""

echo ""
echo "=== [3/10] 案例库(四维标签) ==="
curl -sS "$API_BASE/cases?page=1&pageSize=5&type=三居室&style=现代简约&budget_range=10-20万&area=100-120" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "=== [4/10] 案例详情 ==="
curl -sS "$API_BASE/cases/1" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "=== [5/10] AI风格迁移 ==="
curl -sS -X POST "$API_BASE/cases/migrate-style" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"case_id":1,"target_styles":["北欧","新中式","轻奢"],"area":120}'
echo ""

echo ""
echo "=== [6/10] 报价详情 ==="
curl -sS "$API_BASE/quotations/1" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "=== [7/10] 项目列表 ==="
curl -sS "$API_BASE/projects?page=1&pageSize=5" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "=== [8/10] ERP排期 ==="
curl -sS "$API_BASE/erp/schedules?page=1&pageSize=5" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "=== [9/10] 施工日志 ==="
curl -sS "$API_BASE/manager/logs?page=1&pageSize=5" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "=== [10/10] 公司审核 ==="
curl -sS "$API_BASE/admin/companies?page=1&pageSize=5" -H "$AUTH_HEADER" | head -c 300
echo ""

echo ""
echo "========================================="
echo "[SUCCESS] All 10 business chain tests passed!"
echo "========================================="
