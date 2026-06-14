#!/bin/bash
set -e
API="http://127.0.0.1:60091/api"
TOKEN="local-token-1"
ADMIN_TOKEN="local-token-2"

echo "========================================="
echo "  数字请柬 SaaS 全链路业务测试"
echo "========================================="
echo ""

echo "[1/8] 🔐 登录用户"
curl -s -X POST "$API/login" -H "Content-Type: application/json" \
  -d '{"name":"演示用户","phone":"13800138000"}' | python3 -m json.tool
echo ""

echo "[2/8] 📋 获取模板分类"
curl -s "$API/template-categories" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "[3/8] 🎨 获取婚礼分类模板"
curl -s "$API/templates?category=婚礼" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'共 {len(d)} 个婚礼模板:')
for t in d:
    print(f'  [{t[\"id\"]}] {t[\"name\"]} - ¥{t[\"price\"]} - {t[\"designer_name\"]}')
"
echo ""

echo "[4/8] ✉️  创建请柬"
INV_RESP=$(curl -s -X POST "$API/invitations" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "template_id": 1,
    "title": "李明&张美丽婚礼邀请",
    "category": "婚礼",
    "event_date": "2026-08-08",
    "event_time": "18:00",
    "location": "上海浦东香格里拉大酒店",
    "latitude": 31.2304,
    "longitude": 121.4737,
    "content": "[{\"id\":1,\"type\":\"text\",\"x\":120,\"y\":60,\"text\":\"喜结良缘\",\"fontSize\":28}]"
  }')
echo "$INV_RESP" | python3 -m json.tool
INV_ID=$(echo "$INV_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "请柬ID: $INV_ID"
echo ""

echo "[5/8] 👥 添加收件人 (3位)"
for i in 1 2 3; do
  case $i in
    1) NAME="王总" PHONE="13800000001" EMAIL="wang@example.com" LAT="31.2357" LNG="121.4345";;
    2) NAME="李经理" PHONE="13800000002" EMAIL="li@example.com" LAT="31.1932" LNG="121.4365";;
    3) NAME="张阿姨" PHONE="13800000003" EMAIL="zhang@example.com" LAT="31.2567" LNG="121.5241";;
  esac
  echo "  添加收件人 $i: $NAME"
  curl -s -X POST "$API/invitations/$INV_ID/recipients" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"$NAME\",\"phone\":\"$PHONE\",\"email\":\"$EMAIL\"}" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'    ✓ ID={d[\"id\"]} {d[\"name\"]}')"
done
echo ""

echo "[6/8] 📤 发送请柬（自动生成订单+设计师分成）"
curl -s -X POST "$API/invitations/$INV_ID/send" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "[7/8] 👁️  模拟收件人打开请柬（记录位置用于热力图）"
RECIPIENTS=$(curl -s "$API/invitations/$INV_ID/recipients" -H "Authorization: Bearer $TOKEN")
for i in 1 2; do
  RECIP_ID=$(echo "$RECIPIENTS" | python3 -c "import sys,json; print(json.load(sys.stdin)[$i-1]['id'])")
  LAT=$(echo "$RECIPIENTS" | python3 -c "import sys,json; print([31.2357, 31.1932][$i-1])")
  LNG=$(echo "$RECIPIENTS" | python3 -c "import sys,json; print([121.4345, 121.4365][$i-1])")
  echo "  收件人 $RECIP_ID 打开请柬 (位置: $LAT, $LNG)"
  curl -s -X POST "$API/invitations/$INV_ID/open" \
    -H "Content-Type: application/json" \
    -d "{\"recipient_id\":$RECIP_ID,\"latitude\":$LAT,\"longitude\":$LNG,\"ip\":\"192.168.1.$i\"}" > /dev/null
done
echo ""

echo "[8/8] 💝 添加宾客祝福"
curl -s -X POST "$API/invitations/$INV_ID/blessings" \
  -H "Content-Type: application/json" \
  -d '{"name":"王总","content":"祝新人百年好合，永结同心！早生贵子！"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  ✓ 祝福ID={d[\"id\"]} 来自{d[\"guest_name\"]}: {d[\"content\"]}')"
echo ""

echo "========================================="
echo "  📊 统计数据验证"
echo "========================================="
echo ""

echo "📈 请柬统计"
curl -s "$API/invitations/$INV_ID/stats" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "🗺️  热力图数据（已打开位置）"
curl -s "$API/invitations/$INV_ID/heatmap" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "📜 收件人列表"
curl -s "$API/invitations/$INV_ID/recipients" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for r in d:
    status = '✅ 已读 ' + r.get('opened_at','')[:16] if r.get('opened_at') else '⏳ 未读'
    pos = f'📍 {r[\"latitude\"]:.4f}, {r[\"longitude\"]:.4f}' if r.get('latitude') else ''
    print(f'  [{r[\"id\"]}] {r[\"name\"]:10} {status} {pos}')
"
echo ""

echo "💝 祝福墙"
curl -s "$API/invitations/$INV_ID/blessings" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for b in d:
    status = '⏳ 待审核' if b.get('status')=='pending' else '✅ 已通过'
    print(f'  [{b[\"id\"]}] {b[\"guest_name\"]}: {b[\"content\"]} {status}')
"
echo ""

echo "========================================="
echo "  👔 后台管理功能验证（管理员账号）"
echo "========================================="
echo ""

echo "📊 后台运营统计"
curl -s "$API/admin/summary" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo ""

echo "📝 待审核模板"
curl -s "$API/templates?status=pending" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for t in d:
    print(f'  [{t[\"id\"]}] {t[\"name\"]} ({t[\"category\"]}) - {t[\"designer_name\"]}')
"
echo ""

echo "✅ 审核模板 #6（金榜题名·升学宴）"
curl -s -X POST "$API/templates/6/review" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"approved","note":"设计精美，符合规范"}' | python3 -m json.tool
echo ""

echo "💰 设计师分成列表"
curl -s "$API/commissions" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for c in d:
    status = '⏳ 待结算' if c.get('status')=='pending' else '✅ 已结算'
    print(f'  [{c[\"id\"]}] {c[\"designer_name\"]} - {c[\"template_name\"]}: ¥{c[\"amount\"]} {status}')
"
echo ""

echo "💸 结算分成 #1"
curl -s -X POST "$API/commissions/1/settle" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo ""

echo "🔍 待审核祝福"
curl -s "$API/admin/blessings?status=pending" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for b in d:
    print(f'  [{b[\"id\"]}] {b[\"name\"]}: {b[\"content\"]}')
"
echo ""

echo "✅ 通过祝福审核 #1"
curl -s -X POST "$API/blessings/1/review" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"approved"}' | python3 -m json.tool
echo ""

echo "📊 模板使用频次/转化率"
curl -s "$API/templates" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'  {'模板名称':20} {'分类':6} {'使用':4} {'发送':4} 转化率')
print('  ' + '-'*50)
for t in d[:5]:
    conv = round((t['sent_count']/t['use_count']*100)) if t['use_count']>0 else 0
    print(f'  {t[\"name\"]:20} {t[\"category\"]:6} {t[\"use_count\"]:4} {t[\"sent_count\"]:4}  {conv}%')
"
echo ""

echo "📤 导出收件人列表"
curl -s -X POST "$API/export" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"type\":\"recipients\",\"invitation_id\":$INV_ID}" | python3 -m json.tool
echo ""

echo "📤 导出祝福墙"
curl -s -X POST "$API/export" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"type\":\"blessings\",\"invitation_id\":$INV_ID}" | python3 -m json.tool
echo ""

echo "📜 操作日志"
curl -s "$API/admin/logs" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
for l in d[:8]:
    actor = l.get('user_name') or l.get('actor')
    print(f'  [{l[\"id\"]}] {l[\"created_at\"][:16]} {actor:10} - {l[\"action\"]}')
"
echo ""

echo "========================================="
echo "  ✅ 全链路测试完成！"
echo "========================================="
echo ""
echo "🌐 前端地址: http://127.0.0.1:50091"
echo "🔌 后端地址: http://127.0.0.1:60091"
echo "👤 演示用户: 13800138000"
echo "👔 管理员:   13900139000"
echo ""
