#!/bin/bash
# API 压测工具完整链路测试脚本

set -e

echo "=============================================="
echo "   API 压测工具 - 完整链路测试 Demo"
echo "=============================================="

API_BASE="http://127.0.0.1:53382/api"
DEMO_API="http://127.0.0.1:54383"

echo ""
echo "[1/8] 登录获取 Token"
echo "-------------------------"
LOGIN_RESP=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
USER=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['username'])")
echo "✅ 登录成功: $USER"
echo "✅ Token: ${TOKEN:0:40}..."

echo ""
echo "[2/8] 创建测试应用"
echo "-------------------------"
APP_RESP=$(curl -s -X POST "$API_BASE/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "电商平台-用户服务",
    "description": "电商平台核心用户服务，包含登录、注册、用户信息查询等接口",
    "owner_id": 1,
    "status": "active"
  }')
APP_ID=$(echo "$APP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
APP_NAME=$(echo "$APP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
echo "✅ 应用创建成功: $APP_NAME (ID: $APP_ID)"

echo ""
echo "[3/8] 创建测试环境"
echo "-------------------------"
ENV_RESP=$(curl -s -X POST "$API_BASE/environments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_id\": $APP_ID,
    \"name\": \"性能测试环境\",
    \"type\": \"test\",
    \"base_url\": \"$DEMO_API\",
    \"description\": \"用于性能压测专用环境\"
  }")
ENV_ID=$(echo "$ENV_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ENV_NAME=$(echo "$ENV_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
echo "✅ 环境创建成功: $ENV_NAME (ID: $ENV_ID)"
echo "✅ Base URL: $DEMO_API"

echo ""
echo "[4/8] 生成 API 密钥"
echo "-------------------------"
KEY_RESP=$(curl -s -X POST "$API_BASE/environments/$ENV_ID/keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "压测专用密钥"}')
KEY_ID=$(echo "$KEY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "✅ API 密钥创建成功 (ID: $KEY_ID)"

echo ""
echo "[5/8] 创建压测任务 - 健康检查接口"
echo "-------------------------"
TASK1_RESP=$(curl -s -X POST "$API_BASE/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_id\": $APP_ID,
    \"env_id\": $ENV_ID,
    \"name\": \"健康检查接口压测\",
    \"description\": \"验证服务可用性基础压测\",
    \"api_endpoint\": \"/api/health\",
    \"method\": \"GET\",
    \"concurrency\": 3,
    \"requests\": 30,
    \"timeout\": 5000
  }")
TASK1_ID=$(echo "$TASK1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
TASK1_NAME=$(echo "$TASK1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
echo "✅ 任务创建成功: $TASK1_NAME (ID: $TASK1_ID)"

echo ""
echo "[6/8] 创建压测任务 - 用户列表接口"
echo "-------------------------"
TASK2_RESP=$(curl -s -X POST "$API_BASE/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_id\": $APP_ID,
    \"env_id\": $ENV_ID,
    \"name\": \"用户列表接口压测\",
    \"description\": \"用户查询接口性能测试\",
    \"api_endpoint\": \"/api/users\",
    \"method\": \"GET\",
    \"concurrency\": 5,
    \"requests\": 50,
    \"timeout\": 5000
  }")
TASK2_ID=$(echo "$TASK2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
TASK2_NAME=$(echo "$TASK2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
echo "✅ 任务创建成功: $TASK2_NAME (ID: $TASK2_ID)"

echo ""
echo "[7/8] 执行压测任务 #1 - 健康检查"
echo "-------------------------"
curl -s -X POST "$API_BASE/tasks/$TASK1_ID/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" > /dev/null
echo "⏳ 压测任务启动中..."
sleep 6

TASK1_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/tasks/$TASK1_ID")
TASK1_STATUS=$(echo "$TASK1_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
TASK1_SUCCESS=$(echo "$TASK1_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success_count',0))")
TASK1_FAIL=$(echo "$TASK1_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('fail_count',0))")
TASK1_AVG=$(echo "$TASK1_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('avg_response_time',0))")
echo "✅ 任务完成状态: $TASK1_STATUS"
echo "✅ 成功请求: $TASK1_SUCCESS"
echo "✅ 失败请求: $TASK1_FAIL"
echo "✅ 平均响应: $TASK1_AVG ms"

echo ""
echo "[8/8] 执行压测任务 #2 - 用户列表"
echo "-------------------------"
curl -s -X POST "$API_BASE/tasks/$TASK2_ID/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" > /dev/null
echo "⏳ 压测任务启动中..."
sleep 8

TASK2_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/tasks/$TASK2_ID")
TASK2_STATUS=$(echo "$TASK2_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
TASK2_SUCCESS=$(echo "$TASK2_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success_count',0))")
TASK2_FAIL=$(echo "$TASK2_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('fail_count',0))")
TASK2_AVG=$(echo "$TASK2_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('avg_response_time',0))")
echo "✅ 任务完成状态: $TASK2_STATUS"
echo "✅ 成功请求: $TASK2_SUCCESS"
echo "✅ 失败请求: $TASK2_FAIL"
echo "✅ 平均响应: $TASK2_AVG ms"

echo ""
echo "=============================================="
echo "   测试完成！查看测试数据:"
echo "=============================================="
echo ""
echo "📊 调用日志统计:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/tasks/$TASK2_ID/logs" | python3 -c "
import sys, json
logs = json.load(sys.stdin)
print(f'   总日志数: {len(logs)}')
if len(logs) > 0 and print(f'   最近一条: {logs[0][\"status_code\"]} - {logs[0][\"response_time\"]}ms')
"

echo ""
echo "📋 审计日志:"
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/audit?limit=5" | python3 -c "
import sys, json
logs = json.load(sys.stdin)
for log in logs[:3]:
    print(f'   {log[\"action\"]} - {log[\"operator_name\"]}')
"

echo ""
echo "=============================================="
echo "   前端访问地址: http://127.0.0.1:43382"
echo "   测试账号: admin / admin123"
echo "=============================================="
