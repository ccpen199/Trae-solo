#!/bin/bash
set -e

echo "=== 1. 居民登录 ==="
LOGIN=$(curl -s -X POST http://127.0.0.1:3011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138002","code":"123456"}')
echo "$LOGIN" | head -c 300
echo ""
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; sys.stdout.write(json.load(sys.stdin).get('token',''))")
if [ -z "$TOKEN" ]; then echo "登录失败"; exit 1; fi
echo "✅ token获取成功"

echo ""
echo "=== 2. 设备列表（枚举值检查） ==="
curl -s "http://127.0.0.1:3011/api/devices" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('items', d)
for x in items[:5]:
    print('  - %-14s type=%-16s status=%-10s online=%s' % (x['name'], x['type'], x['status'], x['isOnline']))"

echo ""
echo "=== 3. 居民订单列表（枚举值检查） ==="
curl -s "http://127.0.0.1:3011/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('items', d)
print('订单数:', len(items))
for x in items[:5]:
    print('  - id=%s status=%s amount=%s' % (x['id'][:8], x.get('status',''), x.get('amount', 0)))"

echo ""
echo "=== 4. 预约列表 ==="
curl -s "http://127.0.0.1:3011/api/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('items', d)
print('预约数:', len(items))
for x in items[:3]:
    print('  - id=%s status=%s start=%s' % (x['id'][:8], x.get('status',''), x.get('startTime','')[:16]))"

echo ""
echo "=== 5. 连续签到信息 ==="
curl -s "http://127.0.0.1:3011/api/rewards/streak" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('  currentStreak=%s totalPoints=%s canCheckIn=%s' % (d.get('currentStreak',''), d.get('totalPoints',''), d.get('canCheckIn','')))"

echo ""
echo "=== 6. 物业登录 + 工单列表 ==="
PLOGIN=$(curl -s -X POST http://127.0.0.1:3011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138001","code":"123456"}')
PTOKEN=$(echo "$PLOGIN" | python3 -c "import sys,json; sys.stdout.write(json.load(sys.stdin).get('token',''))")
curl -s "http://127.0.0.1:3011/api/workorders" \
  -H "Authorization: Bearer $PTOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('items', d)
print('物业看到工单数:', len(items))
for x in items:
    print('  - id=%s status=%s priority=%s handler=%s' % (x['id'][:8], x.get('status',''), x.get('priority',''), x.get('handlerId','')[:8] if x.get('handlerId') else '-'))"

echo ""
echo "=== 7. 运营登录 + 热力图统计 ==="
OLOGIN=$(curl -s -X POST http://127.0.0.1:3011/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"123456"}')
OTOKEN=$(echo "$OLOGIN" | python3 -c "import sys,json; sys.stdout.write(json.load(sys.stdin).get('token',''))")
echo "运营登录成功"
curl -s "http://127.0.0.1:3011/api/analytics/funnel" \
  -H "Authorization: Bearer $OTOKEN" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
for k in ['browse','viewDetail','reserve','pay','complete']:
    print('  %-10s: %s' % (k, d.get(k, 0)))"

echo ""
echo "✅ 全部接口测试完成"
