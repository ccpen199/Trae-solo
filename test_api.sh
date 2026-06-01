#!/bin/bash
set -e

BACKEND_URL="http://127.0.0.1:53481"
START_TIME=$(date -v-1d +"%Y-%m-%d 00:00:00")
END_TIME=$(date -v+30d +"%Y-%m-%d 23:59:59")

echo "========================================"
echo " API 业务链路测试"
echo "========================================"
echo "活动时间: $START_TIME ~ $END_TIME"
echo ""

# 1. 登录
echo "=== 1. 管理员登录 ==="
LOGIN_RESP=$(curl -sS -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "登录成功"
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo ""

# 2. 创建活动
echo "=== 2. 创建抽奖活动 ==="
ACTIVITY_DATA='{
  "name": "618年中大促抽奖活动",
  "description": "618狂欢节，购物满199即可参与抽奖，100%中奖！",
  "theme": "festival",
  "startTime": "'"$START_TIME"'",
  "endTime": "'"$END_TIME"'",
  "participationRules": {
    "minAmount": 199,
    "channels": ["wechat", "app", "web"],
    "dailyLimit": 3,
    "totalLimit": 10
  },
  "lotteryRules": {
    "type": "wheel",
    "costPerDraw": 0
  },
  "prizeConfigs": [
    {"prizeId": 1, "probability": 0.5, "position": 1},
    {"prizeId": 2, "probability": 1, "position": 2},
    {"prizeId": 3, "probability": 5, "position": 3},
    {"prizeId": 4, "probability": 10, "position": 4},
    {"prizeId": 5, "probability": 83.5, "position": 5}
  ]
}'
CREATE_RESP=$(curl -sS -X POST "$BACKEND_URL/api/activities" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ACTIVITY_DATA")
ACTIVITY_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "活动创建成功，ID: $ACTIVITY_ID"
echo ""

# 3. 发布活动
echo "=== 3. 发布活动 ==="
curl -sS -X PATCH "$BACKEND_URL/api/activities/$ACTIVITY_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"published"}' > /dev/null
echo "活动已发布"
echo ""

# 4. 获取公开活动列表
echo "=== 4. 获取公开活动列表 ==="
PUBLIC_LIST=$(curl -sS "$BACKEND_URL/api/activities/public")
echo "$PUBLIC_LIST" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'公开活动数量: {len(d[\"data\"])}')"
echo ""

# 5. 获取活动详情（用户端）
echo "=== 5. 获取活动详情（用户端） ==="
ACTIVITY_DETAIL=$(curl -sS "$BACKEND_URL/api/activities/public/$ACTIVITY_ID")
echo "$ACTIVITY_DETAIL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'活动名称: {d[\"data\"][\"name\"]}'); print(f'奖品配置数量: {len(d[\"data\"][\"prizeConfigs\"])}')"
echo ""

# 6. 用户资格校验
echo "=== 6. 用户资格校验 ==="
QUALIFY_DATA='{"activityId":'$ACTIVITY_ID',"userId":"test_user_001","channel":"web","deviceId":"device_001","ip":"127.0.0.1","orderAmount":299}'
QUALIFY_RESP=$(curl -sS -X POST "$BACKEND_URL/api/lottery/qualify" \
  -H "Content-Type: application/json" \
  -d "$QUALIFY_DATA")
echo "$QUALIFY_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'资格校验: {d[\"data\"][\"qualified\"]}, 原因: {d[\"data\"][\"reason\"]}')"
echo ""

# 7. 完成任务（获得抽奖次数）
echo "=== 7. 完成任务获得抽奖次数 ==="
TASK_DATA='{"activityId":'$ACTIVITY_ID',"userId":"test_user_001","taskId":"share_001","taskType":"share","channel":"web","deviceId":"device_001"}'
TASK_RESP=$(curl -sS -X POST "$BACKEND_URL/api/lottery/task" \
  -H "Content-Type: application/json" \
  -d "$TASK_DATA")
echo "$TASK_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'任务完成: code={d[\"code\"]}, message={d[\"message\"]}')"
echo ""

# 8. 执行抽奖
echo "=== 8. 执行抽奖 ==="
DRAW_DATA='{"activityId":'$ACTIVITY_ID',"userId":"test_user_001","channel":"web","deviceId":"device_001","ip":"127.0.0.1"}'
DRAW_RESP=$(curl -sS -X POST "$BACKEND_URL/api/lottery/draw" \
  -H "Content-Type: application/json" \
  -d "$DRAW_DATA")
echo "$DRAW_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d['code'] == 200:
    data = d['data']
    print(f'抽奖结果: 中奖={data[\"isWin\"]}')
    if data['isWin']:
        print(f'奖品: {data[\"prize\"][\"name\"]}')
    print(f'风险状态: {data[\"riskStatus\"]}')
else:
    print(f'抽奖失败: {d[\"message\"]}')
"
echo ""

# 9. 查看用户抽奖记录
echo "=== 9. 查看用户抽奖记录 ==="
RECORDS_RESP=$(curl -sS "$BACKEND_URL/api/lottery/user/records?userId=test_user_001&activityId=$ACTIVITY_ID")
echo "$RECORDS_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d['code'] == 200:
    print(f'抽奖记录数: {len(d[\"data\"])}')
    for r in d['data']:
        print(f'  - {r[\"drawTime\"]}: 中奖={r[\"isWin\"]}, 风险={r[\"riskStatus\"]}')
else:
    print(f'查询失败: code={d[\"code\"]}, msg={d[\"message\"]}')
"
echo ""

# 10. 查看用户中奖记录
echo "=== 10. 查看用户中奖记录 ==="
WINNERS_RESP=$(curl -sS "$BACKEND_URL/api/prizes/user/winners?userId=test_user_001")
echo "$WINNERS_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d['code'] == 200:
    data = d['data']
    if isinstance(data, dict):
        print(f'中奖记录数: {data[\"total\"]}')
        for w in data['items']:
            print(f'  - {w[\"createdAt\"]}: {w[\"prize\"][\"name\"]}, 状态={w[\"status\"]}')
    else:
        print(f'中奖记录数: {len(data)}')
else:
    print(f'查询失败: code={d[\"code\"]}, msg={d[\"message\"]}')
"
echo ""

# 11. 运营后台查看中奖列表
echo "=== 11. 运营后台查看中奖列表 ==="
ADMIN_WINNERS=$(curl -sS "$BACKEND_URL/api/prizes/winners?activityId=$ACTIVITY_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$ADMIN_WINNERS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'中奖总数: {d[\"data\"][\"total\"]}')"
echo ""

# 12. 查看风控队列
echo "=== 12. 查看风控队列 ==="
RISK_QUEUE=$(curl -sS "$BACKEND_URL/api/risk/queue" \
  -H "Authorization: Bearer $TOKEN")
echo "$RISK_QUEUE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'风控待处理: {d[\"data\"][\"total\"]}')"
echo ""

# 13. 查看报表数据
echo "=== 13. 查看报表汇总 ==="
SUMMARY=$(curl -sS "$BACKEND_URL/api/reports/summary?activityId=$ACTIVITY_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$SUMMARY" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'参与人数: {d[\"totalParticipants\"]}')
print(f'抽奖次数: {d[\"drawCount\"]}')
print(f'中奖数: {d[\"totalWinCount\"]}')
print(f'中奖率: {d[\"winRate\"]}%')
print(f'总成本: ¥{d[\"totalCost\"]}')
"
echo ""

# 14. 查看仪表盘数据
echo "=== 14. 查看仪表盘数据 ==="
DASHBOARD=$(curl -sS "$BACKEND_URL/api/reports/dashboard" \
  -H "Authorization: Bearer $TOKEN")
echo "$DASHBOARD" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
print(f'活动总数: {d[\"totalActivities\"]}')
print(f'进行中: {d[\"publishedActivities\"]}')
print(f'总参与: {d[\"totalParticipants\"]}')
print(f'总成本: ¥{d[\"totalCost\"]}')
"
echo ""

echo "========================================"
echo " 测试完成！活动ID: $ACTIVITY_ID"
echo " 用户抽奖页: http://127.0.0.1:43481/lottery/$ACTIVITY_ID"
echo " 管理后台: http://127.0.0.1:43481/"
echo "========================================"
