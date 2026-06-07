#!/bin/bash
BACKEND_PORT=60065

echo "=== 登录 ==="
RESPONSE=$(curl -sS -X POST http://127.0.0.1:$BACKEND_PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jobseeker1","password":"123456"}')
TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token obtained"

echo ""
echo "=== 1. 好友列表 ==="
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:$BACKEND_PORT/api/users/friends | python3 -m json.tool

echo ""
echo "=== 2. 内推列表 ==="
curl -sS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:$BACKEND_PORT/api/referrals?type=received" | python3 -m json.tool

echo ""
echo "=== 3. 消息会话 ==="
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:$BACKEND_PORT/api/messages/conversations | python3 -m json.tool

echo ""
echo "=== 4. 入职流程 ==="
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:$BACKEND_PORT/api/onboarding | python3 -m json.tool

echo ""
echo "=== 5. 管理后台统计(admin) ==="
ADMIN_RESP=$(curl -sS -X POST http://127.0.0.1:$BACKEND_PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}')
ADMIN_TOKEN=$(echo $ADMIN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -sS -H "Authorization: Bearer $ADMIN_TOKEN" http://127.0.0.1:$BACKEND_PORT/api/admin/dashboard | python3 -m json.tool

echo ""
echo "=== 6. 职位列表 ==="
curl -sS "http://127.0.0.1:$BACKEND_PORT/api/jobs" | python3 -m json.tool | head -80
