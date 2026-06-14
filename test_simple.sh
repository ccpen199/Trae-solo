#!/bin/bash
API="http://127.0.0.1:61091/api"
TOKEN="local-token-1"
ADMIN_TOKEN="local-token-2"

echo "========================================="
echo "  数字请柬 SaaS 全链路测试"
echo "========================================="
echo ""

echo "[1] 健康检查"
curl -s "$API/health"
echo ""
echo ""

echo "[2] 登录"
curl -s -X POST "$API/login" -H "Content-Type: application/json" \
  -d '{"name":"User","phone":"13800138000"}'
echo ""
echo ""

echo "[3] 模板分类"
curl -s "$API/template-categories" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "[4] 模板列表（前2个）"
curl -s "$API/templates" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for t in d[:2]:
    print(f'  [{t[\"id\"]}] {t[\"name\"]} - {t[\"category\"]} - ¥{t[\"price\"]}')
"
echo ""

echo "[5] 创建请柬"
INV_ID=$(curl -s -X POST "$API/invitations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"template_id":1,"title":"Wedding Invitation","category":"婚礼","event_date":"2026-08-08","event_time":"18:00","location":"Shanghai"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "  请柬ID: $INV_ID"
echo ""

echo "[6] 添加收件人"
for i in 1 2 3; do
  curl -s -X POST "$API/invitations/$INV_ID/recipients" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Guest$i\",\"phone\":\"1380000000$i\",\"email\":\"g$i@test.com\"}" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  ✓ {d[\"name\"]}')"
done
echo ""

echo "[7] 发送请柬（自动生成订单+分成）"
curl -s -X POST "$API/invitations/$INV_ID/send" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "[8] 模拟收件人打开（记录位置）"
RECIPS=$(curl -s "$API/invitations/$INV_ID/recipients" -H "Authorization: Bearer $TOKEN")
for i in 1 2; do
  RID=$(echo "$RECIPS" | python3 -c "import sys,json;print(json.load(sys.stdin)[$i-1]['id'])")
  curl -s -X POST "$API/invitations/$INV_ID/open" \
    -H "Content-Type: application/json" \
    -d "{\"recipient_id\":$RID,\"latitude\":31.23$i,\"longitude\":121.43$i}" > /dev/null
  echo "  收件人 $RID 已打开"
done
echo ""

echo "[9] 添加祝福"
curl -s -X POST "$API/invitations/$INV_ID/blessings" \
  -H "Content-Type: application/json" \
  -d '{"name":"Guest1","content":"Best wishes! Happy forever!"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  ✓ 祝福: {d[\"content\"]}')"
echo ""

echo "[10] 请柬统计"
curl -s "$API/invitations/$INV_ID/stats" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "[11] 热力图数据"
curl -s "$API/invitations/$INV_ID/heatmap" -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "========================================="
echo "  后台管理验证"
echo "========================================="
echo ""

echo "[12] 管理员登录"
curl -s -X POST "$API/login" -H "Content-Type: application/json" \
  -d '{"name":"Admin","phone":"13900139000"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  管理员: {d[\"user\"][\"name\"]}')"
echo ""

echo "[13] 后台统计"
curl -s "$API/admin/summary" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

echo "[14] 待审核模板"
curl -s "$API/templates?status=pending" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for t in d:
    print(f'  [{t[\"id\"]}] {t[\"name\"]} ({t[\"category\"]})')
"
echo ""

echo "[15] 审核模板 #6"
curl -s -X POST "$API/templates/6/review" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"approved","note":"OK"}'
echo ""
echo ""

echo "[16] 设计师分成"
curl -s "$API/commissions" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for c in d:
    print(f'  [{c[\"id\"]}] {c[\"designer_name\"]} - ¥{c[\"amount\"]} - {c[\"status\"]}')
"
echo ""

echo "[17] 结算分成 #1"
curl -s -X POST "$API/commissions/1/settle" -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""
echo ""

echo "[18] 待审核祝福"
curl -s "$API/admin/blessings?status=pending" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for b in d:
    print(f'  [{b[\"id\"]}] {b[\"name\"]}: {b[\"content\"]}')
"
echo ""

echo "[19] 审核祝福 #1"
curl -s -X POST "$API/blessings/1/review" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"approved"}'
echo ""
echo ""

echo "[20] 导出收件人"
curl -s -X POST "$API/export" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"type\":\"recipients\",\"invitation_id\":$INV_ID}" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'  导出文件: {d[\"file_name\"]} ({d[\"record_count\"]}条)')"
echo ""

echo "========================================="
echo "  ✅ 全链路测试完成！"
echo "========================================="
echo "前端: http://127.0.0.1:51091"
echo "后端: http://127.0.0.1:61091"
