#!/bin/bash
BASE_URL="http://127.0.0.1:59072/api"

echo "========================================"
echo "  功能验收 - 第二批问题修复验证"
echo "========================================"
echo ""

# 1. 登录 admin
echo "[1/6] 登录链路验证 (admin)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}')
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','ERROR'))")
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token',''))")
USER_ROLES=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); u=d.get('data',{}).get('user',{}); print([r.get('code') for r in u.get('roles',[])])")
echo "  登录状态: $LOGIN_CODE"
echo "  Token: ${TOKEN:0:20}..."
echo "  用户角色: $USER_ROLES"
echo ""

# 2. 登录 agent01
echo "[2/6] 登录链路验证 (agent01 客服坐席)..."
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"agent01","password":"123456"}')
AGENT_CODE=$(echo "$AGENT_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','ERROR'))")
AGENT_ROLES=$(echo "$AGENT_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); u=d.get('data',{}).get('user',{}); print([r.get('code') for r in u.get('roles',[])])")
echo "  登录状态: $AGENT_CODE"
echo "  用户角色: $AGENT_ROLES"
echo ""

# 3. 错误密码验证
echo "[3/6] 登录错误提示验证 (错误密码)..."
BAD_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}')
BAD_CODE=$(echo "$BAD_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','ERROR'))")
BAD_MSG=$(echo "$BAD_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message',''))")
echo "  返回码: $BAD_CODE"
echo "  错误信息: $BAD_MSG"
echo ""

# 4. 事项管理验证
echo "[4/6] 事项结构化数据验证..."
ITEM_RESPONSE=$(curl -s "$BASE_URL/service-items?page=1&pageSize=3" \
  -H "Authorization: Bearer $TOKEN")
ITEM_CODE=$(echo "$ITEM_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code','ERROR'))")
ITEM_TOTAL=$(echo "$ITEM_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('total',0))")
echo "  接口状态: $ITEM_CODE"
echo "  事项总数: $ITEM_TOTAL"
echo ""

# 5. 办件详情时间轴验证
echo "[5/6] 办件详情时间轴验证..."
APP_LIST=$(curl -s "$BASE_URL/applications?page=1&pageSize=1" \
  -H "Authorization: Bearer $TOKEN")
APP_ID=$(echo "$APP_LIST" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',{}).get('list',[]); print(items[0].get('id') if items else '')")
if [ -n "$APP_ID" ]; then
  APP_DETAIL=$(curl -s "$BASE_URL/applications/$APP_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "$APP_DETAIL" | python3 -c "
import sys,json
d=json.load(sys.stdin)
data=d.get('data',{})
print('  办件ID:', data.get('id'))
print('  材料上传:', 'YES' if data.get('materials') else 'NO')
print('  电子签名:', 'YES' if data.get('signature') else 'NO')
print('  在线支付:', 'YES' if data.get('payment') else 'NO')
print('  服务评价:', 'YES' if data.get('evaluation') else 'NO')
print('  差评整改:', 'YES' if data.get('rectification') else 'NO')
"
else
  echo "  未找到办件数据"
fi
echo ""

# 6. 统计分析验证
echo "[6/6] 统计分析接口验证..."
STATS_RESPONSE=$(curl -s "$BASE_URL/statistics/overview" \
  -H "Authorization: Bearer $TOKEN")
echo "$STATS_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
data=d.get('data',{})
print('  接口状态:', d.get('code'))
print('  总办件量:', data.get('total_applications'))
print('  今日办件:', data.get('today_applications'))
print('  办结率:', data.get('completion_rate'))
print('  满意度:', data.get('satisfaction_rate'))
print('  平均时长:', data.get('avg_processing_days'))
"
echo ""

echo "========================================"
echo "  功能验收完成"
echo "========================================"
