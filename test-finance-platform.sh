#!/bin/bash
BACKEND_PORT=59061
BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"

echo "======================================"
echo "  财务+平台模块 API 验证"
echo "======================================"
echo ""

# 登录
echo "[1] 管理员登录"
ADMIN_TOKEN=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" -d "username=admin" -d "password=admin123" \
  -d "client_id=platform-admin" -d "client_secret=platform-secret-2024")
ADMIN_ACCESS=$(echo "$ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "OK"

echo "[2] 骑手1登录"
RIDER_TOKEN=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" -d "username=rider1" -d "password=rider123" \
  -d "client_id=platform-admin" -d "client_secret=platform-secret-2024")
RIDER_ACCESS=$(echo "$RIDER_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "OK"
echo ""

# 财务模块
echo "=== 财务模块 ==="
echo ""

echo "[3] 骑手当前钱包"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/finance/wallet" | python3 -m json.tool
echo ""

echo "[4] T+0 提现申请 (扣3%个税)"
WITHDRAW=$(curl -sS -X POST -H "Authorization: Bearer $RIDER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"amount":5.00,"withdraw_method":"alipay","account":"139****0001"}' \
  "$BASE_URL/finance/withdraw")
echo "$WITHDRAW" | python3 -m json.tool
echo ""

echo "[5] 提现后钱包余额"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/finance/wallet" | python3 -m json.tool
echo ""

echo "[6] 税务代扣凭证"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/finance/tax-records?limit=3" | python3 -m json.tool
echo ""

echo "[7] 阶梯提成规则"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/finance/commission-rules" | python3 -m json.tool
echo ""

# 平台模块
echo "=== 平台模块 ==="
echo ""

echo "[8] 24小时单量预测"
curl -sS -H "Authorization: Bearer $ADMIN_ACCESS" "$BASE_URL/platform/forecast" | python3 -m json.tool | head -20
echo ""

echo "[9] 创建激励红包池"
curl -sS -X POST -H "Authorization: Bearer $ADMIN_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"name":"晚高峰激励","start_hour":17,"end_hour":19,"bonus_per_order":2.00,"min_orders":5,"total_budget":500.00,"zone":"中关村"}' \
  "$BASE_URL/platform/incentives" | python3 -m json.tool
echo ""

echo "[10] 激励红包池列表"
curl -sS -H "Authorization: Bearer $ADMIN_ACCESS" "$BASE_URL/platform/incentives" | python3 -m json.tool
echo ""

echo "[11] 骑手提交申诉工单"
APPEAL=$(curl -sS -X POST -H "Authorization: Bearer $RIDER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"order_id":4,"type":"timeout","description":"商家出餐慢导致超时","evidence_url":"photo://xxx"}' \
  "$BASE_URL/platform/appeals")
echo "$APPEAL" | python3 -m json.tool
APPEAL_ID=$(echo "$APPEAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('appealId', json.load(sys.stdin).get('data', {}).get('id', '1'))")
echo ""

echo "[12] 管理员处理申诉 (闭环)"
curl -sS -X POST -H "Authorization: Bearer $ADMIN_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved","resolution":"补贴2元","resolution_note":"确认商家出餐慢","compensation_amount":2.00}' \
  "$BASE_URL/platform/appeals/$APPEAL_ID/process" | python3 -m json.tool
echo ""

echo "[13] 申诉列表"
curl -sS -H "Authorization: Bearer $ADMIN_ACCESS" "$BASE_URL/platform/appeals" | python3 -m json.tool
echo ""

echo "======================================"
echo "  财务+平台模块验证完成 ✅"
echo "======================================"
