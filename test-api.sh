#!/bin/bash
BASE_URL="http://127.0.0.1:59218/api"

echo "=== 1. 雇主登录 ==="
EMPLOYER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"employer1","password":"123456"}' | \
  /usr/bin/python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo "雇主Token: ${EMPLOYER_TOKEN:0:30}..."

echo ""
echo "=== 2. 发布用工订单 ==="
ORDER_ID=$(curl -s -X POST "$BASE_URL/labor" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d '{"title":"办公室装修水电改造","description":"需要水电工","skills":["水电工"],"pricing_type":"hourly","hourly_rate":80,"estimated_hours":8,"city":"北京市","address":"朝阳区望京SOHO"}' | \
  /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d.get('data',{}).get('id') or '')")
echo "订单ID: $ORDER_ID"

echo ""
echo "=== 3. 工人登录 ==="
WORKER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"worker1","password":"123456"}' | \
  /usr/bin/python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo "工人Token: ${WORKER_TOKEN:0:30}..."

echo ""
echo "=== 4. 工人接单 ==="
TAKE_RESULT=$(curl -s -X POST "$BASE_URL/labor/$ORDER_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN")
echo "接单结果: $TAKE_RESULT"

echo ""
echo "=== 5. 获取订单详情 ==="
DETAIL=$(curl -s "$BASE_URL/labor/$ORDER_ID" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN")
echo "$DETAIL" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print('标题:', d.get('title')); print('状态:', d.get('status'))"

echo ""
echo "=== 6. 开始服务 ==="
START_RESULT=$(curl -s -X POST "$BASE_URL/labor/$ORDER_ID/start" \
  -H "Authorization: Bearer $WORKER_TOKEN")
echo "开始服务结果: $START_RESULT"

echo ""
echo "=== 测试完成 ==="
