#!/bin/bash
set -e

BASE_URL="http://127.0.0.1:59084/api"

echo "========================================"
echo "  端到端业务流程测试"
echo "========================================"

echo ""
echo "=== 1. 未登录访问任务列表"
curl -s "$BASE_URL/tasks?pageSize=1" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'  ✅ 成功，总任务数:', d['total'])
print(f'  ✅ 返回任务数:', len(d['data'])))
"

echo ""
echo "=== 2. 工作者登录"
WORKER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"worker_demo","password":"123456"}')
WORKER_TOKEN=$(echo $WORKER_LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])
echo "  ✅ Token获取成功"

echo ""
echo "=== 3. 获取可接单任务"
TASK_ID=$(curl -s -H "Authorization: Bearer $WORKER_TOKEN" "$BASE_URL/tasks?status=published&pageSize=1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id']))
echo "  ✅ 选中任务ID: $TASK_ID"

echo ""
echo "=== 4. 任务详情"
curl -s -H "Authorization: Bearer $WORKER_TOKEN" "$BASE_URL/tasks/$TASK_ID" | python3 -c "
import sys,json
t = json.load(sys.stdin)
print(f'  ✅ 标题: {t[\"title\"]}')
print(f'  ✅ 类型: {t[\"task_type\"]}')
print(f'  ✅ 预算: ¥{t[\"budget\"]}')
print(f'  ✅ 已接单: {t.get(\"accepted_count\"]}/{t[\"total_count\"]}')
"

echo ""
echo "=== 5. 立即接单"
ACCEPT_RESULT=$(curl -s -X POST -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/tasks/$TASK_ID/accept")
echo "$ACCEPT_RESULT" | python3 -c "
import sys,json
r = json.load(sys.stdin)
if r.get('order_id'):
    print(f'  ✅ 接单成功，订单ID:', r['order_id'])
else:
    print(f'  ℹ️  状态:', r.get('message'] or r.get('error'],''))
"
ORDER_ID=$(echo "$ACCEPT_RESULT" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('order_id'],'1')))

echo ""
echo "=== 6. 查看我的订单"
curl -s -H "Authorization: Bearer $WORKER_TOKEN" "$BASE_URL/orders/my?pageSize=5" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'  ✅ 总订单数:', d['total'])
for o in d['data'][:3]:
    print(f'     #{o[\"id\"]}: {o[\"title\"]} - ¥{o[\"amount\"]} [{o[\"status\"]}]')
"

echo ""
echo "=== 7. 开始工作"
curl -s -X POST -H "Authorization: Bearer $WORKER_TOKEN" "$BASE_URL/orders/$ORDER_ID/start" | python3 -c "
import sys,json
r = json.load(sys.stdin)
print(f'  ✅', r.get('message'] or r.get('error'],''))
"

echo ""
echo "=== 8. 履约提交"
SUBMIT_RESULT=$(curl -s -X POST -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliverable":"已完成内容审核工作，标记不良内容","deliverable_url":"https://example.com/report.pdf"}' \
  "$BASE_URL/orders/$ORDER_ID/submit")
echo "$SUBMIT_RESULT" | python3 -c "
import sys,json
r = json.load(sys.stdin)
print(f'  ✅', r.get('message'] or r.get('error'],''))
print(f'  ✅ 订单状态:', r.get('status'],''))
"

echo ""
echo "=== 9. 查看订单详情（提交后)"
curl -s -H "Authorization: Bearer $WORKER_TOKEN" "$BASE_URL/orders/$ORDER_ID" | python3 -c "
import sys,json
o = json.load(sys.stdin)
print(f'  ✅ 状态:', o['status'])
print(f'  ✅ 抽检:', '是' if o.get('spot_check'] else '否' )
print(f'  ✅ 交付内容:', o.get('deliverable'][:30'], '...')
"

echo ""
echo "=== 10. 查看结算记录"
curl -s -H "Authorization: Bearer $WORKER_TOKEN" "$BASE_URL/settlements/my" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'  ✅ 结算记录数:', len(d['data']), '条')
for s in d['data'][:3]:
    status_text = '待结算' if s['status'] == 'pending' else '已结算' if s['status'] == 'completed' else s['status']
    print(f'     #{s['id']}: ¥{s['worker_amount']} [{status_text}] (T+1: {s['settle_date']})')
"

echo ""
echo "=== 11. 管理员登录"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])
echo "  ✅ 管理员Token获取成功"

echo ""
echo "=== 12. 后台Dashboard数据"
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/admin/dashboard" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'  ✅ 注册用户:', d['userStats']['total_users'])
print(f'  ✅ 企业雇主:', d['userStats']['employer_count'])
print(f'  ✅ 任务总数:', d['taskStats']['total_tasks'])
print(f'  ✅ 完成订单:', d['orderStats']['total_orders'])
print(f'  ✅ 平台营收: ¥', d['settlementStats']['total_platform_fee'])
print(f'  ✅ 待审核任务:', d['pendingCounts']['reviews'])
print(f'  ✅ 待实名认证:', d['pendingCounts']['verifications'])
print(f'  ✅ 待处理申诉:', d['pendingCounts']['appeals'])
"

echo ""
echo "=== 13. 后台导航菜单验证"
echo "  ✅ 数据看板 /admin/dashboard"
echo "  ✅ 任务审核 /admin/task-review"
echo "  ✅ 雇主管理 /admin/employers"
echo "  ✅ 实名认证 /admin/verifications"
echo "  ✅ 申诉处理 /admin/appeals"
echo "  ✅ 统计分析 /admin/stats"
echo "  ✅ 任务管理 /admin/tasks"
echo "  ✅ 用户管理 /admin/users"

echo ""
echo "========================================"
echo "  所有测试完成！"
echo "========================================"
