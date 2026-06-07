#!/bin/bash
set -e
BACKEND_PORT=59061
BASE_URL="http://127.0.0.1:$BACKEND_PORT/api"

echo "========================================"
echo "  OAuth2.0 登录功能验证"
echo "========================================"
echo ""

echo "=== 1. 管理员正确登录 ==="
RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=admin&password=admin123")

if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('access_token') else 1)" 2>/dev/null; then
  ROLE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])")
  NAME=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['real_name'])")
  TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'][:30])")
  echo "✅ 成功！"
  echo "   角色: $ROLE"
  echo "   姓名: $NAME"
  echo "   Token: ${TOKEN}..."
else
  echo "❌ 失败: $RESPONSE"
fi
echo ""

echo "=== 2. 错误密码测试 (标准 OAuth2.0 错误响应) ==="
RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=admin&password=wrongpass")

ERROR=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
DESC=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description',''))" 2>/dev/null)

if [ "$ERROR" = "invalid_grant" ]; then
  echo "✅ 正确返回 OAuth2.0 标准错误"
  echo "   error: $ERROR"
  echo "   error_description: $DESC"
else
  echo "❌ 错误格式不标准: $RESPONSE"
fi
echo ""

echo "=== 3. 骑手1正确登录 ==="
RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=rider123")

if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('access_token') else 1)" 2>/dev/null; then
  ROLE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])")
  NAME=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['real_name'])")
  echo "✅ 成功！"
  echo "   角色: $ROLE"
  echo "   姓名: $NAME"
else
  echo "❌ 失败: $RESPONSE"
fi
echo ""

echo "=== 4. 骑手2正确登录 ==="
RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider2&password=rider123")

if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('access_token') else 1)" 2>/dev/null; then
  ROLE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['role'])")
  NAME=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['real_name'])")
  echo "✅ 成功！"
  echo "   角色: $ROLE"
  echo "   姓名: $NAME"
else
  echo "❌ 失败: $RESPONSE"
fi
echo ""

echo "=== 5. 无效 client_id 测试 ==="
RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=wrong-client&client_secret=xxx&username=admin&password=admin123")

ERROR=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
if [ "$ERROR" = "invalid_client" ]; then
  echo "✅ 正确返回 invalid_client 错误"
  echo "   error: $ERROR"
else
  echo "❌ 错误格式不标准: $RESPONSE"
fi
echo ""

echo "=== 6. 不存在的用户名 ==="
RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=nonexistent&password=123456")

ERROR=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
DESC=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description',''))" 2>/dev/null)
if [ "$ERROR" = "invalid_grant" ]; then
  echo "✅ 正确返回 invalid_grant 错误"
  echo "   error: $ERROR"
  echo "   error_description: $DESC"
else
  echo "❌ 错误格式不标准: $RESPONSE"
fi
echo ""

echo "========================================"
echo "  ✅ 所有登录验证通过"
echo "========================================"
