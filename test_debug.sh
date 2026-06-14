#!/bin/bash
set -e
BASE=http://127.0.0.1:58919/api
D1=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138001","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
S1=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13900139001","code":"123456","role":"shipper"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

echo "==== 司机行车日志 /api/safety/logs?role=driver ===="
curl -s "$BASE/safety/logs?role=driver&page=1" -H "Authorization: Bearer $D1" | python3 -m json.tool | head -30

echo ""
echo "==== 司机提现 /api/settlements/withdrawals ===="
curl -s "$BASE/settlements/withdrawals?page=1" -H "Authorization: Bearer $D1" | python3 -m json.tool | head -30

echo ""
echo "==== 司机结算汇总 /api/settlements/summary ===="
curl -s "$BASE/settlements/summary" -H "Authorization: Bearer $D1" | python3 -m json.tool | head -30

echo ""
echo "==== 司机个人资料 /api/auth/me ===="
curl -s "$BASE/auth/me" -H "Authorization: Bearer $D1" | python3 -m json.tool | head -30

echo ""
echo "==== 货主开票主体 /api/invoices/invoice-entities ===="
curl -s "$BASE/invoices/invoice-entities" -H "Authorization: Bearer $S1" | python3 -m json.tool | head -30

echo ""
echo "==== 货主个人资料 /api/auth/me ===="
curl -s "$BASE/auth/me" -H "Authorization: Bearer $S1" | python3 -m json.tool | head -30

echo ""
echo "==== 司机李建军结算汇总 /api/settlements/summary ===="
D2=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138002","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "$BASE/settlements/summary" -H "Authorization: Bearer $D2" | python3 -m json.tool | head -30
echo ""
echo "==== 李建军发票第一张 ===="
RES=$(curl -s "$BASE/invoices?page=1" -H "Authorization: Bearer $D2")
INV_ID=$(echo $RES | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('list',[{}])[0].get('id'))")
echo "第一张发票id=$INV_ID"
curl -s "$BASE/invoices/$INV_ID" -H "Authorization: Bearer $D2" | python3 -m json.tool | head -50
