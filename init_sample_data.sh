#!/bin/bash

BASE_URL="http://127.0.0.1:56383/api"

# 登录获取token
echo "=== 登录获取token ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
echo ""
echo "Token: $TOKEN"
echo ""

# 创建订单服务应用
echo "=== 创建订单服务应用 ==="
APP1=$(curl -s -X POST "$BASE_URL/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"订单服务","description":"电商订单核心服务，处理用户下单、支付、发货等流程","environment":"prod","version":"2.1.0","owner_id":1,"status":"active"}')
echo "$APP1" | python3 -m json.tool
APP1_ID=$(echo "$APP1" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""

# 创建用户中心应用
echo "=== 创建用户中心应用 ==="
APP2=$(curl -s -X POST "$BASE_URL/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"用户中心","description":"用户认证与信息管理服务，包含登录、注册、用户信息维护","environment":"prod","version":"1.5.2","owner_id":5,"status":"active"}')
echo "$APP2" | python3 -m json.tool
APP2_ID=$(echo "$APP2" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""

# 为订单服务创建脱敏规则
echo "=== 为订单服务创建脱敏规则 ==="

# 手机号脱敏
curl -s -X POST "$BASE_URL/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":$APP1_ID,\"name\":\"手机号脱敏\",\"description\":\"订单日志中手机号脱敏\",\"rule_type\":\"phone\",\"pattern\":\"1[3-9]\\\\d{9}\",\"replacement\":\"138****0000\"}" | python3 -m json.tool

# 身份证号脱敏
curl -s -X POST "$BASE_URL/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":$APP1_ID,\"name\":\"身份证号脱敏\",\"description\":\"订单收货人身份证脱敏\",\"rule_type\":\"idCard\",\"pattern\":\"\\\\d{17}[\\\\dXx]\",\"replacement\":\"****************\"}" | python3 -m json.tool

# 银行卡号脱敏
curl -s -X POST "$BASE_URL/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":$APP1_ID,\"name\":\"银行卡号脱敏\",\"description\":\"支付银行卡号脱敏\",\"rule_type\":\"bankCard\",\"pattern\":\"\\\\d{16,19}\",\"replacement\":\"**** **** **** ****\"}" | python3 -m json.tool

# 邮箱地址脱敏
curl -s -X POST "$BASE_URL/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":$APP1_ID,\"name\":\"邮箱地址脱敏\",\"description\":\"用户邮箱脱敏\",\"rule_type\":\"email\",\"pattern\":\"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}\",\"replacement\":\"***@example.com\"}" | python3 -m json.tool

echo ""

# 为用户中心创建脱敏规则
echo "=== 为用户中心创建脱敏规则 ==="

# 用户姓名脱敏
curl -s -X POST "$BASE_URL/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":$APP2_ID,\"name\":\"用户姓名脱敏\",\"description\":\"用户真实姓名脱敏\",\"rule_type\":\"name\",\"pattern\":\"([\\\\u4e00-\\\\u9fa5]{2,4})\",\"replacement\":\"*先生/女士\"}" | python3 -m json.tool

# 手机号脱敏
curl -s -X POST "$BASE_URL/rules" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\":$APP2_ID,\"name\":\"手机号脱敏\",\"description\":\"用户手机号脱敏\",\"rule_type\":\"phone\",\"pattern\":\"1[3-9]\\\\d{9}\",\"replacement\":\"139****8888\"}" | python3 -m json.tool

echo ""
echo "=== 示例数据初始化完成 ==="
echo "应用1 ID: $APP1_ID (订单服务)"
echo "应用2 ID: $APP2_ID (用户中心)"
echo ""
echo "每个应用都已配置了对应的脱敏规则"
