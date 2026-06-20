#!/bin/bash
set -e
BASE="http://localhost:3000/api"

# Courier 登录
COURIER_TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"username":"courier1","password":"courier123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))")
echo "===== Courier1 token: ${COURIER_TOKEN:0:20}..."

echo ""
echo "===== Courier1 Dashboard ====="
curl -s "$BASE/dashboard" -H "Authorization: Bearer $COURIER_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin).get('data', {})
print('stats:', json.dumps(d.get('stats'), ensure_ascii=False))
print('recentTasks count:', len(d.get('recentTasks', [])))
print('alerts count:', len(d.get('alerts', [])))
for a in d.get('alerts', []):
    print('  -', a.get('level'), a.get('title'))
print('unreadCount:', d.get('unreadCount'))
"

echo ""
echo "===== Courier1 Tasks (本人任务) ====="
curl -s "$BASE/tasks?pageSize=5" -H "Authorization: Bearer $COURIER_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin).get('data', {})
print('total:', d.get('total'))
for t in d.get('list', []):
    print(' -', t.get('taskNo'), t.get('status'), 'courier:', t.get('courierName'), 'time:', t.get('appointmentTime'))
"

# Admin 登录
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"username":"admin1","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))")
echo ""
echo "===== Admin1 token: ${ADMIN_TOKEN:0:20}..."

echo ""
echo "===== Admin1 Dashboard ====="
curl -s "$BASE/dashboard" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin).get('data', {})
print('stats:', json.dumps(d.get('stats'), ensure_ascii=False))
print('waybill:', json.dumps(d.get('waybill'), ensure_ascii=False))
print('alerts count:', len(d.get('alerts', [])))
for a in d.get('alerts', []):
    print('  -', a.get('level'), a.get('title'))
"

echo ""
echo "===== Admin Finance Overview ====="
curl -s "$BASE/finance/overview" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

echo ""
echo "===== Admin Finance Daily (本网点) ====="
curl -s "$BASE/finance/daily?pageSize=3" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin).get('data', {})
print('total:', d.get('total'))
for r in d.get('list', []):
    print(' -', r.get('date'), 'orders:', r.get('totalOrders'), 'net:', r.get('netIncome'))
"

# Operator 登录
OPERATOR_TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"username":"operator1","password":"operator123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))")
echo ""
echo "===== Operator1 token: ${OPERATOR_TOKEN:0:20}..."

echo ""
echo "===== Operator Finance Daily (全局) ====="
curl -s "$BASE/finance/daily?pageSize=3" -H "Authorization: Bearer $OPERATOR_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin).get('data', {})
print('total (global):', d.get('total'))
for r in d.get('list', []):
    print(' -', r.get('date'), r.get('outletName'), 'orders:', r.get('totalOrders'), 'net:', r.get('netIncome'))
"

echo ""
echo "===== Operator Global Dashboard ====="
curl -s "$BASE/dashboard/global" -H "Authorization: Bearer $OPERATOR_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin).get('data', {})
print('totalTasks:', d.get('totalTasks'))
print('pending:', d.get('pending'))
print('exception:', d.get('exception'))
print('recentExceptions count:', len(d.get('recentExceptions', [])))
for e in d.get('recentExceptions', []):
    print('  -', e.get('orderNo'), e.get('outletName'), e.get('status'), e.get('exceptionReason'))
"

echo ""
echo "===== Test Print (余额检查 (courier1越权尝试 (打印任务 print test ====="
# 找个 pending 任务
TASKID=$(curl -s "$BASE/tasks?status=pending&pageSize=1" -H "Authorization: Bearer $COURIER_TOKEN" | python3 -c "import sys,json; l=json.load(sys.stdin).get('data',{}).get('list',[]); print(l[0].get('id','') if l else ''")
echo "pending task id: $TASKID"
curl -s -X POST "$BASE/tasks/$TASKID/print" -H "Authorization: Bearer $COURIER_TOKEN" -H 'Content-Type: application/json' -d '{"waybillNo":"SF1234567890","printerName":"HP_LabelPrinter","paperSize":"100x180"}' | python3 -m json.tool
