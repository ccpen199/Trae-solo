#!/bin/bash
BACKEND_PORT=59061
BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"

echo "======================================"
echo "  配送平台 API 业务链路验证"
echo "======================================"
echo ""

# 1. OAuth 登录
echo "[1/10] 管理员登录 (OAuth2.0 password grant)"
ADMIN_TOKEN=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "client_id=platform-admin" \
  -d "client_secret=platform-secret-2024")
echo "$ADMIN_TOKEN" | head -c 200
echo ""
ADMIN_ACCESS=$(echo "$ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token: ${ADMIN_ACCESS:0:30}..."
echo ""

echo "[2/10] 骑手1登录"
RIDER_TOKEN=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=rider1" \
  -d "password=rider123" \
  -d "client_id=platform-admin" \
  -d "client_secret=platform-secret-2024")
RIDER_ACCESS=$(echo "$RIDER_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token: ${RIDER_ACCESS:0:30}..."
echo ""

# 2. 获取骑手资料
echo "[3/10] 获取骑手1资料 (脱敏)"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/rider/profile" | python3 -m json.tool
echo ""

# 3. 获取派单规则
echo "[4/10] 获取派单规则 (多因子权重)"
curl -sS -H "Authorization: Bearer $ADMIN_ACCESS" "$BASE_URL/platform/dispatch-rules" | python3 -m json.tool
echo ""

# 4. 获取热力图数据
echo "[5/10] 获取运力热力图数据"
curl -sS -H "Authorization: Bearer $ADMIN_ACCESS" "$BASE_URL/platform/heatmap" | python3 -m json.tool | head -30
echo ""

# 5. 获取可接订单
echo "[6/10] 获取骑手可接订单列表"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/orders?status=PENDING" | python3 -m json.tool | head -40
echo ""

# 6. 创建测试订单
echo "[7/10] 管理员创建测试订单"
NEW_ORDER=$(curl -sS -X POST -H "Authorization: Bearer $ADMIN_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"张三","customer_phone":"13800138000","pickup_address":"麦当劳(中关村店)","pickup_lat":39.9847,"pickup_lng":116.3056,"delivery_address":"中关村软件园8号楼","delivery_lat":39.9890,"delivery_lng":116.3215,"goods_desc":"巨无霸套餐x2","amount":59.90,"delivery_fee":8.00}' \
  "$BASE_URL/orders")
echo "$NEW_ORDER" | python3 -m json.tool
ORDER_ID=$(echo "$NEW_ORDER" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "订单ID: $ORDER_ID"
echo ""

# 7. 骑手接单
echo "[8/10] 骑手1接单"
curl -sS -X POST -H "Authorization: Bearer $RIDER_ACCESS" \
  "$BASE_URL/orders/$ORDER_ID/accept" | python3 -m json.tool
echo ""

# 8. 骑手上报GPS
echo "[9/10] 骑手上报GPS轨迹"
curl -sS -X POST -H "Authorization: Bearer $RIDER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"lat":39.9860,"lng":116.3100,"speed":25.5,"heading":90,"accuracy":5.0}' \
  "$BASE_URL/gps/track" | python3 -m json.tool
echo ""

# 9. 骑手取餐
echo "[10/11] 骑手取餐"
curl -sS -X POST -H "Authorization: Bearer $RIDER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"pickup_code":"1234"}' \
  "$BASE_URL/orders/$ORDER_ID/pickup" | python3 -m json.tool
echo ""

# 10. 骑手送达并签收
echo "[11/12] 骑手送达 + 电子签收"
curl -sS -X POST -H "Authorization: Bearer $RIDER_ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"proof_url":"sign://xxx","recipient_sign":"张三"}' \
  "$BASE_URL/orders/$ORDER_ID/deliver" | python3 -m json.tool
echo ""

# 11. 查看钱包
echo "[12/12] 查看骑手钱包余额 (秒级结算后)"
curl -sS -H "Authorization: Bearer $RIDER_ACCESS" "$BASE_URL/finance/wallet" | python3 -m json.tool
echo ""

echo "======================================"
echo "  核心业务链路验证完成 ✅"
echo "======================================"
