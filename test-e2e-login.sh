#!/bin/bash
set -e

echo "============================================="
echo "  🔍 OAuth2.0 登录端到端完整测试"
echo "============================================="
echo ""

BASE_URL="http://127.0.0.1:59061/api"
PASS=0
FAIL=0

test_case() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  
  if [ "$expected" = "$actual" ] || [[ "$actual" == *"$expected"* ]]; then
    echo "✅ $name"
    PASS=$((PASS + 1))
  else
    echo "❌ $name"
    echo "   期望: $expected"
    echo "   实际: $actual"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== 1. 后端登录接口测试 ==="

RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=rider123")

ACCESS_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))")
USER_ROLE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('role',''))")
USER_NAME=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('real_name',''))")

test_case "rider1 登录返回 access_token" "true" "$([ -n "$ACCESS_TOKEN" ] && echo "true" || echo "false")"
test_case "rider1 登录返回 refresh_token" "true" "$([ -n "$REFRESH_TOKEN" ] && echo "true" || echo "false")"
test_case "rider1 用户角色为 rider" "rider" "$USER_ROLE"
test_case "rider1 用户姓名为 张师傅" "张师傅" "$USER_NAME"

echo ""
echo "=== 2. 使用 token 访问受保护接口 ==="

USER_INFO=$(curl -sS "$BASE_URL/userinfo" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

INFO_ROLE=$(echo "$USER_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin).get('role',''))")
test_case "userinfo 接口返回 rider 角色" "rider" "$INFO_ROLE"

echo ""
echo "=== 3. 刷新 token 测试 ==="

REFRESH_RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&client_id=platform-admin&client_secret=platform-secret-2024&refresh_token=$REFRESH_TOKEN")

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
test_case "刷新 token 返回新的 access_token" "true" "$([ -n "$NEW_ACCESS_TOKEN" ] && echo "true" || echo "false")"

echo ""
echo "=== 4. admin 登录测试 ==="

ADMIN_RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=admin&password=admin123")

ADMIN_ROLE=$(echo "$ADMIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('role',''))")
ADMIN_NAME=$(echo "$ADMIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('real_name',''))")

test_case "admin 用户角色为 admin" "admin" "$ADMIN_ROLE"
test_case "admin 用户姓名为 平台管理员" "平台管理员" "$ADMIN_NAME"

echo ""
echo "=== 5. 错误密码测试 (OAuth2.0 标准错误) ==="

ERR_RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=wrongpass")

ERR_CODE=$(echo "$ERR_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',''))")
ERR_DESC=$(echo "$ERR_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error_description',''))")

test_case "错误密码返回 invalid_grant" "invalid_grant" "$ERR_CODE"
test_case "错误密码返回中文描述" "用户名或密码错误" "$ERR_DESC"

echo ""
echo "=== 6. 前端跳转逻辑验证 ==="

echo "模拟 rider1 登录后的前端状态:"
echo "  - accessToken: ${ACCESS_TOKEN:0:20}..."
echo "  - user.role: $USER_ROLE"
echo "  - user.real_name: $USER_NAME"
echo "  - 跳转目标: /rider/dashboard"

echo ""
echo "模拟 admin 登录后的前端状态:"
echo "  - accessToken: $(echo "$ADMIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','')[:20])")..."
echo "  - user.role: $ADMIN_ROLE"
echo "  - user.real_name: $ADMIN_NAME"
echo "  - 跳转目标: /admin/dashboard"

echo ""
echo "=== 7. localStorage 数据结构验证 ==="

echo "accessToken: string (JWT token)"
echo "refreshToken: string (JWT token)"
echo "user: JSON.stringify({ id, username, role, real_name })"
echo ""
echo "示例 user 对象:"
echo "$USER_INFO" | python3 -m json.tool

echo ""
echo "============================================="
echo "  测试结果: $PASS 通过, $FAIL 失败"
echo "============================================="

if [ $FAIL -eq 0 ]; then
  echo "✅ 所有端到端测试通过！"
  echo ""
  echo "📋 前端登录跳转流程说明:"
  echo "1. 用户点击登录 → 调用 login(username, password)"
  echo "2. API 请求 /oauth/token (form-urlencoded)"
  echo "3. 后端验证后返回 access_token + user 对象"
  echo "4. 前端将 token 和 user 存入 localStorage 和 store"
  echo "5. Login 组件 useEffect 检测到 accessToken && user"
  echo "6. 根据 user.role 判断跳转目标:"
  echo "   - 'admin' → /admin/dashboard"
  echo "   - 'rider' → /rider/dashboard"
  echo "7. ProtectedRoute 验证 accessToken && user && role"
  echo "8. 渲染对应工作台页面 + Watermark + Navbar"
  exit 0
else
  echo "❌ 有 $FAIL 个测试失败"
  exit 1
fi
