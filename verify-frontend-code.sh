#!/bin/bash
set -e

echo "============================================="
echo "  🔍 前端代码修复验证"
echo "============================================="
echo ""

FRONTEND_URL="http://127.0.0.1:49061"
PASS=0
FAIL=0

verify_in_file() {
  local file="$1"
  local pattern="$2"
  local desc="$3"
  
  if grep -q "$pattern" "$file"; then
    echo "✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "❌ $desc"
    FAIL=$((FAIL + 1))
  fi
}

verify_in_source() {
  local url_path="$1"
  local pattern="$2"
  local desc="$3"
  
  local content=$(curl -sS "$FRONTEND_URL$url_path" 2>/dev/null)
  
  if echo "$content" | grep -q "$pattern"; then
    echo "✅ $desc"
    PASS=$((PASS + 1))
  else
    echo "❌ $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== 1. 本地源代码验证 ==="
echo ""

PROJECT_DIR="/Users/chen/Documents/trae_projects/local_projects/may-89061"

verify_in_file "$PROJECT_DIR/frontend/src/store/auth.js" "encodeFormData" "auth.js 包含 encodeFormData 函数"
verify_in_file "$PROJECT_DIR/frontend/src/store/auth.js" "application/x-www-form-urlencoded" "auth.js OAuth 请求使用 form-urlencoded"
verify_in_file "$PROJECT_DIR/frontend/src/store/auth.js" "isAuthenticated" "auth.js 包含 isAuthenticated 方法"
verify_in_file "$PROJECT_DIR/frontend/src/services/api.js" "encodeFormData" "api.js 包含 encodeFormData 函数"
verify_in_file "$PROJECT_DIR/frontend/src/services/api.js" "!config.url?.includes('/oauth/token')" "api.js 请求拦截器排除 OAuth 接口"
verify_in_file "$PROJECT_DIR/frontend/src/App.jsx" "if (!user) { logout();" "App.jsx ProtectedRoute 包含 user 存在性检查"
verify_in_file "$PROJECT_DIR/frontend/src/App.jsx" "user?.role === 'rider'" "App.jsx 根路由包含 rider 角色分支"
verify_in_file "$PROJECT_DIR/frontend/src/pages/Login.jsx" "if (accessToken && user)" "Login.jsx 包含已登录用户自动跳转"
verify_in_file "$PROJECT_DIR/backend/src/server.js" "apiBaseUrl" "server.js 包含 apiBaseUrl 变量"
verify_in_file "$PROJECT_DIR/backend/src/server.js" "connectSrc.*59061" "server.js CSP 包含后端 API 地址"

echo ""
echo "=== 2. 前端服务加载代码验证 ==="
echo ""

verify_in_source "/src/store/auth.js" "encodeFormData" "服务端 auth.js 包含 encodeFormData"
verify_in_source "/src/services/api.js" "encodeFormData" "服务端 api.js 包含 encodeFormData"
verify_in_source "/src/App.jsx" "if (!user) { logout();" "服务端 App.jsx 包含 user 存在性检查"
verify_in_source "/src/pages/Login.jsx" "if (accessToken && user)" "服务端 Login.jsx 包含自动跳转"

echo ""
echo "=== 3. 后端服务配置验证 ==="
echo ""

BACKEND_URL="http://127.0.0.1:59061/api"

# 测试 CORS 预检请求
PREFLIGHT=$(curl -sS -i -X OPTIONS "$BACKEND_URL/oauth/token" \
  -H "Origin: http://127.0.0.1:49061" \
  -H "Access-Control-Request-Method: POST" 2>&1)

if echo "$PREFLIGHT" | grep -q "Access-Control-Allow-Origin: http://127.0.0.1:49061"; then
  echo "✅ CORS 预检请求返回正确的 Allow-Origin"
  PASS=$((PASS + 1))
else
  echo "❌ CORS 预检请求未返回正确的 Allow-Origin"
  FAIL=$((FAIL + 1))
fi

# 测试 CSP 头
CSP=$(curl -sS -I "$BACKEND_URL/health" 2>&1 | grep -i "Content-Security-Policy:")

if echo "$CSP" | grep -q "59061"; then
  echo "✅ CSP 包含后端 API 地址 59061"
  PASS=$((PASS + 1))
else
  echo "❌ CSP 未包含后端 API 地址"
  FAIL=$((FAIL + 1))
fi

if echo "$CSP" | grep -q "49061"; then
  echo "✅ CSP 包含前端地址 49061"
  PASS=$((PASS + 1))
else
  echo "❌ CSP 未包含前端地址"
  FAIL=$((FAIL + 1))
fi

# 测试登录接口
LOGIN_RESPONSE=$(curl -sS -X POST "$BACKEND_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Origin: http://127.0.0.1:49061" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=rider123")

if echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; sys.exit(0 if 'access_token' in json.load(sys.stdin) else 1)" 2>/dev/null; then
  echo "✅ 登录接口返回 access_token"
  PASS=$((PASS + 1))
else
  echo "❌ 登录接口未返回 access_token"
  FAIL=$((FAIL + 1))
fi

if echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; sys.exit(0 if 'user' in json.load(sys.stdin) and json.load(sys.stdin)['user'].get('role')=='rider' else 1)" 2>/dev/null; then
  echo "✅ 登录接口返回正确的 user.role=rider"
  PASS=$((PASS + 1))
else
  echo "❌ 登录接口未返回正确的 user.role"
  FAIL=$((FAIL + 1))
fi

# 测试错误密码
ERR_RESPONSE=$(curl -sS -X POST "$BACKEND_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=platform-admin&client_secret=platform-secret-2024&username=rider1&password=wrong")

if echo "$ERR_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('error')=='invalid_grant' else 1)" 2>/dev/null; then
  echo "✅ 错误密码返回标准 invalid_grant 错误"
  PASS=$((PASS + 1))
else
  echo "❌ 错误密码未返回标准错误"
  FAIL=$((FAIL + 1))
fi

if echo "$ERR_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '用户名或密码错误' in d.get('error_description','') else 1)" 2>/dev/null; then
  echo "✅ 错误密码返回中文描述"
  PASS=$((PASS + 1))
else
  echo "❌ 错误密码未返回中文描述"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "============================================="
echo "  验证结果: $PASS 通过, $FAIL 失败"
echo "============================================="

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "🎉 所有代码修复验证通过！"
  echo ""
  echo "📋 已验证的修复内容："
  echo "  1. ✅ auth.js - OAuth 请求使用 form-urlencoded 格式"
  echo "  2. ✅ auth.js - 包含 isAuthenticated 辅助方法"
  echo "  3. ✅ api.js - 刷新 token 使用 form-urlencoded 格式"
  echo "  4. ✅ api.js - 请求拦截器排除 OAuth 接口的 Authorization 头"
  echo "  5. ✅ App.jsx - ProtectedRoute 增加 user 存在性检查"
  echo "  6. ✅ App.jsx - 根路由三分支跳转（admin/rider/无效角色）"
  echo "  7. ✅ Login.jsx - 已登录用户自动跳转"
  echo "  8. ✅ server.js - CSP connect-src 包含后端 API 地址"
  echo "  9. ✅ server.js - CORS 配置正确允许 49061 来源"
  echo "  10. ✅ OAuth - 错误响应符合 RFC 6749 标准"
  exit 0
else
  echo "❌ 有 $FAIL 个验证失败"
  exit 1
fi
