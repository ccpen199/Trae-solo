#!/bin/bash
set -e

BACKEND="http://127.0.0.1:59079"
FRONTEND="http://127.0.0.1:49079"

echo "========================================"
echo "  API 测试"
echo "========================================"

echo ""
echo "1. 后端健康检查"
curl -sS "$BACKEND/api/health"
echo ""

echo ""
echo "2. 前端健康检查"
curl -s -o /dev/null -w "HTTP %{http_code}" "$FRONTEND/"
echo ""

echo ""
echo "3. 居民用户登录"
LOGIN_RESP=$(curl -sS -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"idCard":"430101199001011234","password":"123456"}')
echo "$LOGIN_RESP"
echo ""

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token','')) if d.get('success') else print('')" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi
echo "Token: ${TOKEN:0:50}..."

if [ -n "$TOKEN" ]; then
  echo ""
  echo "4. 获取用户信息"
  curl -sS "$BACKEND/api/user/profile" -H "Authorization: Bearer $TOKEN"
  echo ""

  echo ""
  echo "5. 获取参保信息"
  curl -sS "$BACKEND/api/insurance" -H "Authorization: Bearer $TOKEN"
  echo ""

  echo ""
  echo "6. 获取缴费订单"
  curl -sS "$BACKEND/api/payment/orders" -H "Authorization: Bearer $TOKEN"
  echo ""

  echo ""
  echo "7. 创建缴费订单"
  curl -sS -X POST "$BACKEND/api/payment/create-order" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"insuranceType":"pension","payYear":2026,"payGrade":300,"channel":"alipay"}'
  echo ""

  echo ""
  echo "8. 获取家庭共济成员"
  curl -sS "$BACKEND/api/family/members" -H "Authorization: Bearer $TOKEN"
  echo ""

  echo ""
  echo "9. 获取养老金发放"
  curl -sS "$BACKEND/api/benefit/pension" -H "Authorization: Bearer $TOKEN"
  echo ""

  echo ""
  echo "10. 养老金测算"
  curl -sS -X POST "$BACKEND/api/calculator/pension-estimate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"payYears":30,"payGrade":500,"retireAge":60,"currentAge":30}'
  echo ""
fi

echo ""
echo "========================================"
echo "  管理员测试"
echo "========================================"

echo ""
echo "11. 税务管理员登录"
ADMIN_RESP=$(curl -sS -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"idCard":"430101198001019999","password":"123456"}')
echo "$ADMIN_RESP"
echo ""

ADMIN_TOKEN=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token','')) if d.get('success') else print('')" 2>/dev/null)
if [ -z "$ADMIN_TOKEN" ]; then
  ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi
echo "Admin Token: ${ADMIN_TOKEN:0:50}..."

if [ -n "$ADMIN_TOKEN" ]; then
  echo ""
  echo "12. 获取预警列表"
  curl -sS "$BACKEND/api/admin/warnings" -H "Authorization: Bearer $ADMIN_TOKEN"
  echo ""

  echo ""
  echo "13. 获取稽核规则"
  curl -sS "$BACKEND/api/admin/audit-rules" -H "Authorization: Bearer $ADMIN_TOKEN"
  echo ""

  echo ""
  echo "14. 跨部门数据比对"
  curl -sS "$BACKEND/api/admin/datashare/compare" -H "Authorization: Bearer $ADMIN_TOKEN"
  echo ""
fi

echo ""
echo "========================================"
echo "  测试完成"
echo "========================================"
