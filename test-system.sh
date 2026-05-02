#!/bin/bash

echo "========================================"
echo "代码托管平台协作系统 - 功能测试"
echo "========================================"
echo ""

# 后端地址
BACKEND_URL="http://localhost:11731"

echo "1. 测试健康检查接口..."
HEALTH=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✓ 健康检查通过"
else
    echo "   ✗ 健康检查失败: $HEALTH"
    exit 1
fi

echo ""
echo "2. 测试登录接口 (admin/admin123)..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")
USER_ROLE=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('role',''))")

if [ -n "$TOKEN" ] && [ "$USER_ROLE" = "admin" ]; then
    echo "   ✓ 登录成功，角色: $USER_ROLE"
    echo "   Token 前缀: ${TOKEN:0:40}..."
else
    echo "   ✗ 登录失败: $LOGIN_RESPONSE"
    exit 1
fi

echo ""
echo "3. 测试获取仓库列表..."
REPOS=$(curl -s "$BACKEND_URL/api/repositories" \
    -H "Authorization: Bearer $TOKEN")

echo "   响应: $(echo "$REPOS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'总数: {len(d.get(\"data\",[]))}')")"

echo ""
echo "4. 测试创建仓库..."
CREATE_REPO=$(curl -s -X POST "$BACKEND_URL/api/repositories" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"demo-repo","description":"这是一个演示仓库"}')

echo "   响应: $CREATE_REPO"

if echo "$CREATE_REPO" | grep -q '"id"'; then
    echo "   ✓ 仓库创建成功"
else
    echo "   ⚠ 仓库可能创建失败或已存在"
fi

echo ""
echo "5. 再次获取仓库列表..."
REPOS_AFTER=$(curl -s "$BACKEND_URL/api/repositories" \
    -H "Authorization: Bearer $TOKEN")

echo "   响应: $(echo "$REPOS_AFTER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'总数: {len(d.get(\"data\",[]))}')")"

echo ""
echo "6. 测试获取统计信息..."
STATS=$(curl -s "$BACKEND_URL/api/stats" \
    -H "Authorization: Bearer $TOKEN")

echo "   统计信息: $STATS"

echo ""
echo "========================================"
echo "测试完成！"
echo "========================================"
echo ""
echo "服务地址:"
echo "  - 后端: http://localhost:11731"
echo "  - 前端: http://localhost:11732"
echo ""
echo "默认账号:"
echo "  - admin / admin123    (管理员)"
echo "  - developer / admin123 (开发者)"
echo "  - reviewer / admin123  (审查者)"
echo "  - devops / admin123    (运维)"
echo ""
