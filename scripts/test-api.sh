#!/bin/bash
BACKEND_URL="http://127.0.0.1:59088/api"

echo "========================================"
echo "  国家级人社政务服务平台 - API 业务验证"
echo "========================================"
echo ""

echo "=== 1. 用户登录 ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}')

echo "登录响应: $(echo "$LOGIN_RESPONSE" | head -c 200)..."
echo ""

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(d['data']['token'])
    else:
        print('')
except:
    print('')
")

if [ -z "$TOKEN" ]; then
    echo "❌ 登录失败"
    exit 1
fi

echo "✅ 登录成功，Token: ${TOKEN:0:30}..."
echo ""

AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "=== 2. 获取首页推荐政策 ==="
RESP=$(curl -s "$BACKEND_URL/home/policies/recommend?page=1&pageSize=10" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 政策数量: {len(d[\"data\"][\"list\"])}, 总数: {d[\"data\"][\"total\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 3. 获取首页热门服务 ==="
RESP=$(curl -s "$BACKEND_URL/home/services/hot" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 热门服务: {len(d[\"data\"][\"hot_services\"])}, 快捷服务: {len(d[\"data\"][\"quick_services\"])}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 4. 获取首页待办事项 ==="
RESP=$(curl -s "$BACKEND_URL/home/todos" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 待办数量: {len(d[\"data\"][\"todos\"])}, 未读消息: {d[\"data\"][\"unread_notifications\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 5. 获取服务大厅列表 ==="
RESP=$(curl -s "$BACKEND_URL/services" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 服务数量: {len(d[\"data\"][\"list\"])}, 分类: {d[\"data\"][\"categories\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 6. 敏感操作二次验证（养老金认证 - 首次请求） ==="
RESP=$(curl -s -X GET "$BACKEND_URL/services/pension/verify?verify_method=face" \
  -H "$AUTH_HEADER" -H "Content-Type: application/json")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 202:
        print(f'✅ 成功返回 202 - 需要二次验证: {d[\"message\"]}')
        print(f'   测试验证码: {d.get(\"test_code\", \"123456\")}')
    else:
        print(f'❌ 预期返回 202，实际返回: {d.get(\"code\")} - {d.get(\"message\", \"\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 7. 养老金认证 - 带验证码 ==="
RESP=$(curl -s -X GET "$BACKEND_URL/services/pension/verify?verify_method=face" \
  -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  -d '{"verify_code":"123456"}')
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - {d[\"message\"]}')
        print(f'   跟踪ID: {d[\"data\"][\"trace_id\"]}')
        print(f'   下次认证日期: {d[\"data\"][\"next_verify_date\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"code\")}: {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 8. 获取电子社保卡 ==="
RESP=$(curl -s "$BACKEND_URL/services/social-card" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 卡号: {d[\"data\"][\"card_no\"]}, 余额: ¥{d[\"data\"][\"balance\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 9. 获取资讯列表 ==="
RESP=$(curl -s "$BACKEND_URL/news?page=1&pageSize=10" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 资讯数量: {len(d[\"data\"][\"list\"])}, 分类: {d[\"data\"][\"categories\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 10. 获取问答列表 ==="
RESP=$(curl -s "$BACKEND_URL/news/faq/list?pageSize=5" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 问答数量: {len(d[\"data\"][\"list\"])}, 总数: {d[\"data\"][\"total\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 11. 获取个人信息 ==="
RESP=$(curl -s "$BACKEND_URL/profile/info" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 姓名: {d[\"data\"][\"real_name\"]}, 省份: {d[\"data\"][\"province\"]}')
        print(f'   服务记录数: {d[\"data\"][\"service_count\"]}, 未读消息: {d[\"data\"][\"unread_notifications\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 12. 获取服务记录 ==="
RESP=$(curl -s "$BACKEND_URL/services/records?page=1&pageSize=10" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 记录数量: {len(d[\"data\"][\"list\"])}, 总数: {d[\"data\"][\"total\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 13. 获取个人数字档案 ==="
RESP=$(curl -s "$BACKEND_URL/profile/archives?pageSize=5" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 档案数量: {len(d[\"data\"][\"list\"])}, 总数: {d[\"data\"][\"total\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "=== 14. 获取操作审计日志 ==="
RESP=$(curl -s "$BACKEND_URL/profile/audit-logs?pageSize=5" -H "$AUTH_HEADER")
echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('code') == 200:
        print(f'✅ 成功 - 审计记录: {len(d[\"data\"][\"list\"])}, 总数: {d[\"data\"][\"total\"]}')
    else:
        print(f'❌ 失败 - {d.get(\"message\", \"未知错误\")}')
except Exception as e:
    print(f'❌ 解析错误: {e}')
"
echo ""

echo "========================================"
echo "  API 业务验证完成"
echo "========================================"
echo ""
echo "前端访问地址: http://127.0.0.1:49088"
echo "后端API地址:  http://127.0.0.1:59088/api"
echo "健康检查:     http://127.0.0.1:59088/api/health"
echo ""
echo "测试账号: 13800138000 / 123456"
echo "测试验证码: 123456"
echo ""
