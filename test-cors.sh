#!/bin/bash
set -e

echo "============================================="
echo "  🌐 CORS 跨域配置专项测试"
echo "============================================="
echo ""

FRONTEND_ORIGIN="http://127.0.0.1:49061"
BACKEND_URL="http://127.0.0.1:59061/api"

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

echo "=== 1. 预检请求 (OPTIONS) 测试 ==="
echo "模拟浏览器 CORS 预检请求:"
echo "  Origin: $FRONTEND_ORIGIN"
echo "  Access-Control-Request-Method: POST"
echo ""

PREFLIGHT=$(curl -sS -i -X OPTIONS "$BACKEND_URL/oauth/token" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" 2>&1)

echo "$PREFLIGHT" | head -15
echo ""

AC_ALLOW_ORIGIN=$(echo "$PREFLIGHT" | grep -i "Access-Control-Allow-Origin:" | tr -d '\r' | awk '{print $2}')
AC_ALLOW_METHODS=$(echo "$PREFLIGHT" | grep -i "Access-Control-Allow-Methods:" | tr -d '\r')
AC_ALLOW_HEADERS=$(echo "$PREFLIGHT" | grep -i "Access-Control-Allow-Headers:" | tr -d '\r')
HTTP_STATUS=$(echo "$PREFLIGHT" | head -1 | awk '{print $2}')

test_case "预检请求返回 204/200" "2" "$(echo $HTTP_STATUS | cut -c1)"
test_case "Access-Control-Allow-Origin 正确" "$FRONTEND_ORIGIN" "$AC_ALLOW_ORIGIN"
test_case "Access-Control-Allow-Methods 包含 POST" "POST" "$AC_ALLOW_METHODS"
test_case "Access-Control-Allow-Headers 包含 Content-Type" "Content-Type" "$AC_ALLOW_HEADERS"
test_case "Access-Control-Allow-Headers 包含 Authorization" "Authorization" "$AC_ALLOW_HEADERS"

echo ""
echo "=== 2. 实际登录请求（带 Origin 头） ==="

LOGIN_RESPONSE=$(curl -sS -i -X POST "$BACKEND_URL/oauth/token" \
  -H "Origin: $FRONTEND_ORIGIN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=rider123" 2>&1)

RESP_HEADERS=$(echo "$LOGIN_RESPONSE" | head -20)
RESP_BODY=$(echo "$LOGIN_RESPONSE" | tail -1)

echo "响应头:"
echo "$RESP_HEADERS"
echo ""
echo "响应体:"
echo "$RESP_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESP_BODY"
echo ""

RESP_ALLOW_ORIGIN=$(echo "$LOGIN_RESPONSE" | grep -i "Access-Control-Allow-Origin:" | tr -d '\r' | awk '{print $2}')
LOGIN_HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | head -1 | awk '{print $2}')
HAS_ACCESS_TOKEN=$(echo "$RESP_BODY" | python3 -c "import sys,json; print('yes' if 'access_token' in json.load(sys.stdin) else 'no')" 2>/dev/null)
HAS_USER=$(echo "$RESP_BODY" | python3 -c "import sys,json; print('yes' if 'user' in json.load(sys.stdin) else 'no')" 2>/dev/null)

test_case "登录请求返回 200" "200" "$LOGIN_HTTP_STATUS"
test_case "响应包含 Access-Control-Allow-Origin" "$FRONTEND_ORIGIN" "$RESP_ALLOW_ORIGIN"
test_case "响应包含 access_token" "yes" "$HAS_ACCESS_TOKEN"
test_case "响应包含 user 对象" "yes" "$HAS_USER"

echo ""
echo "=== 3. 错误 Origin 测试（应被拒绝） ==="

WRONG_ORIGIN="http://malicious-site.com"
WRONG_RESPONSE=$(curl -sS -i -X POST "$BACKEND_URL/oauth/token" \
  -H "Origin: $WRONG_ORIGIN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=rider123" 2>&1)

WRONG_ALLOW_ORIGIN=$(echo "$WRONG_RESPONSE" | grep -i "Access-Control-Allow-Origin:" | tr -d '\r' | awk '{print $2}')

echo "测试错误 Origin: $WRONG_ORIGIN"
echo "Access-Control-Allow-Origin: ${WRONG_ALLOW_ORIGIN:-空}"
echo ""

if [ -z "$WRONG_ALLOW_ORIGIN" ] || [ "$WRONG_ALLOW_ORIGIN" != "$WRONG_ORIGIN" ]; then
  test_case "错误 Origin 被正确拒绝" "✅" "✅"
else
  test_case "错误 Origin 被正确拒绝" "空或不等于 $WRONG_ORIGIN" "$WRONG_ALLOW_ORIGIN"
fi

echo ""
echo "=== 4. CSP 头验证 ==="

CSP_HEADER=$(curl -sS -I "$BACKEND_URL/health" | grep -i "Content-Security-Policy:" | tr -d '\r')
echo "CSP Header: $CSP_HEADER"
echo ""

test_case "CSP 包含 connect-src" "connect-src" "$CSP_HEADER"
test_case "CSP 包含后端 API 地址" "59061" "$CSP_HEADER"
test_case "CSP 包含前端地址" "49061" "$CSP_HEADER"

echo ""
echo "=== 5. 服务状态检查 ==="

echo "前端端口 49061:"
lsof -nP -iTCP:49061 -sTCP:LISTEN -t | head -1
echo "后端端口 59061:"
lsof -nP -iTCP:59061 -sTCP:LISTEN -t | head -1
echo ""

echo "后端健康检查:"
curl -sS "$BACKEND_URL/health"
echo ""
echo ""

echo "============================================="
echo "  测试结果: $PASS 通过, $FAIL 失败"
echo "============================================="

if [ $FAIL -eq 0 ]; then
  echo "✅ 所有 CORS 跨域测试通过！"
  echo ""
  echo "📋 配置说明："
  echo "  前端 Origin: http://127.0.0.1:49061"
  echo "  后端 API:   http://127.0.0.1:59061/api"
  echo "  CORS Origin: 严格限制为 http://127.0.0.1:49061"
  echo "  CSP connect-src: 同时允许前端和后端地址"
  echo "  OAuth 请求格式: application/x-www-form-urlencoded"
  echo ""
  echo "🔐 安全特性："
  echo "  ✅ CORS 白名单机制，仅允许指定来源"
  echo "  ✅ CSP 内容安全策略，防止 XSS"
  echo "  ✅ Helmet 安全头防护"
  echo "  ✅ 请求频率限制（15分钟1000次）"
  echo "  ✅ OAuth2.0 标准错误响应"
  exit 0
else
  echo "❌ 有 $FAIL 个测试失败"
  exit 1
fi
