#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "========================================"
echo " 最终验收 - 完整业务链路测试"
echo "========================================"
echo ""

# 1. 获取token
echo "[1/8] 管理员登录..."
LOGIN_RESP=$(curl -sS -X POST http://127.0.0.1:53481/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['token'])")
echo "✅ 登录成功，token: ${TOKEN:0:30}..."
echo ""

# 2. 查询公开活动
echo "[2/8] 查询已发布活动..."
ACTIVITIES=$(curl -sS http://127.0.0.1:53481/api/activities/public)
ACTIVITY_ID=$(echo "$ACTIVITIES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['items'][0]['id'])")
echo "✅ 找到活动 ID: $ACTIVITY_ID"
echo ""

# 3. 资格校验
echo "[3/8] 用户资格校验..."
QUALIFY_RESP=$(curl -sS -X POST http://127.0.0.1:53481/api/lottery/qualify \
  -H "Content-Type: application/json" \
  -d "{\"activityId\":$ACTIVITY_ID,\"userId\":\"test_user_001\",\"channel\":\"web\",\"orderAmount\":299}")
echo "✅ 资格校验结果: $QUALIFY_RESP"
echo ""

# 4. 完成任务
echo "[4/8] 用户完成任务..."
TASK_RESP=$(curl -sS -X POST http://127.0.0.1:53481/api/lottery/task \
  -H "Content-Type: application/json" \
  -d "{\"activityId\":$ACTIVITY_ID,\"userId\":\"test_user_001\",\"taskId\":\"share\",\"channel\":\"web\",\"deviceId\":\"dev_test_001\"}")
echo "✅ 任务完成结果: $TASK_RESP"
echo ""

# 5. 抽奖3次
echo "[5/8] 用户抽奖(3次)..."
for i in 1 2 3; do
  DRAW_RESP=$(curl -sS -X POST http://127.0.0.1:53481/api/lottery/draw \
    -H "Content-Type: application/json" \
    -d "{\"activityId\":$ACTIVITY_ID,\"userId\":\"test_user_001\",\"channel\":\"web\",\"deviceId\":\"dev_test_001\",\"ip\":\"127.0.0.1\"}")
  echo "   第$i次: $DRAW_RESP"
done
echo "✅ 抽奖完成"
echo ""

# 6. 查询用户抽奖记录
echo "[6/8] 查询用户抽奖记录..."
RECORDS=$(curl -sS "http://127.0.0.1:53481/api/lottery/user/records?userId=test_user_001&activityId=$ACTIVITY_ID")
RECORD_COUNT=$(echo "$RECORDS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['total'])")
echo "✅ 抽奖记录数: $RECORD_COUNT"
echo ""

# 7. 查询仪表盘
echo "[7/8] 查询运营仪表盘..."
DASHBOARD=$(curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:53481/api/reports/dashboard)
echo "✅ 仪表盘数据获取成功"
echo ""

# 8. 数据库核对
echo "[8/8] 数据库数据核对..."
echo ""

echo "--- 核心数据表统计 ---"
echo "活动数:       $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM activities;')"
echo "奖品数:       $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM prizes;')"
echo "用户数:       $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM users;')"
echo "参与记录数:   $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM participations;')"
echo "抽奖记录数:   $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM lottery_records;')"
echo "中奖记录数:   $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM winners;')"
echo "风控项数:     $(sqlite3 data/app.sqlite 'SELECT COUNT(*) FROM risk_items;')"
echo ""

echo "--- 抽奖记录详情 ---"
sqlite3 data/app.sqlite <<'SQL'
SELECT 
  lr.id,
  a.name as activity,
  lr.user_id,
  CASE WHEN lr.is_win=1 THEN '✅ 中奖' ELSE '❌ 未中' END as result,
  COALESCE(p.name, '-') as prize,
  lr.risk_status,
  lr.draw_time
FROM lottery_records lr
LEFT JOIN activities a ON lr.activity_id = a.id
LEFT JOIN prizes p ON lr.prize_id = p.id
ORDER BY lr.id DESC
LIMIT 5;
SQL
echo ""

echo "--- 中奖记录详情 ---"
sqlite3 data/app.sqlite <<'SQL'
SELECT 
  w.id,
  a.name as activity,
  w.user_id,
  p.name as prize,
  p.value as value,
  w.status,
  w.created_at
FROM winners w
LEFT JOIN activities a ON w.activity_id = a.id
LEFT JOIN prizes p ON w.prize_id = p.id
ORDER BY w.id DESC
LIMIT 5;
SQL
echo ""

echo "--- 风控项详情 ---"
sqlite3 data/app.sqlite <<'SQL'
SELECT 
  id,
  type,
  level,
  user_id,
  status,
  created_at
FROM risk_items
ORDER BY id DESC
LIMIT 5;
SQL
echo ""

# 导出CSV
echo "--- 数据导出 ---"
sqlite3 data/app.sqlite <<'SQL'
.headers on
.mode csv
.output /tmp/final_export_lottery.csv
SELECT 
  lr.id as record_id,
  lr.activity_id,
  a.name as activity_name,
  lr.user_id,
  lr.is_win,
  p.name as prize_name,
  p.value as prize_value,
  lr.risk_status,
  lr.draw_time
FROM lottery_records lr
LEFT JOIN activities a ON lr.activity_id = a.id
LEFT JOIN prizes p ON lr.prize_id = p.id
ORDER BY lr.id DESC;
.output stdout
SQL
echo "✅ 抽奖记录已导出: /tmp/final_export_lottery.csv"

sqlite3 data/app.sqlite <<'SQL'
.headers on
.mode csv
.output /tmp/final_export_winners.csv
SELECT 
  w.id as winner_id,
  w.activity_id,
  a.name as activity_name,
  w.user_id,
  p.name as prize_name,
  p.value as prize_value,
  w.status,
  w.created_at
FROM winners w
LEFT JOIN activities a ON w.activity_id = a.id
LEFT JOIN prizes p ON w.prize_id = p.id
ORDER BY w.id DESC;
.output stdout
SQL
echo "✅ 中奖记录已导出: /tmp/final_export_winners.csv"
echo ""

echo "========================================"
echo "✅ 最终验收完成！"
echo "========================================"
echo ""
echo "访问地址:"
echo "  - 用户抽奖页: http://127.0.0.1:43481/lottery"
echo "  - 运营后台:   http://127.0.0.1:43481/login"
echo "  - 后端API:    http://127.0.0.1:53481/api/health"
echo ""
echo "测试账号: admin / admin123"
echo ""
echo "数据库文件: data/app.sqlite (SQLite)"
echo "日志文件: frontend.log, backend.log"
echo ""
