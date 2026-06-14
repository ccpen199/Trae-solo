#!/bin/bash
BASE=http://127.0.0.1:58919/api

D1=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138001","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
S1=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13900139001","code":"123456","role":"shipper"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
D2=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138002","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

OK=0; FAIL=0
check() { local n=$1 e=$2; if [ "$e" = "True" ] || [ "$e" = "true" ]; then echo "✅ $n"; OK=$((OK+1)); else echo "❌ $n => $e"; FAIL=$((FAIL+1)); fi; }

check "健康检查" $(curl -s $BASE/health | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "个人资料" $(curl -s $BASE/auth/me -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "货源列表" $(curl -s "$BASE/freights?page=1&size=3" -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "我的运单" $(curl -s "$BASE/orders?role=driver&page=1" -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "运单详情" $(curl -s $BASE/orders/o_001 -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "结算汇总" $(curl -s $BASE/settlements/summary -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "安全检查" $(curl -s "$BASE/safety/checks?pageSize=100" -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "行车日志" $(curl -s "$BASE/safety/logs?pageSize=100" -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "电子路单" $(curl -s "$BASE/safety/waybills?pageSize=100" -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "认证状态" $(curl -s $BASE/certification/status -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "提现记录" $(curl -s "$BASE/settlements/withdrawals?pageSize=100" -H "Authorization: Bearer $D1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "开票主体" $(curl -s $BASE/invoices/invoice-entities -H "Authorization: Bearer $S1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "发票列表" $(curl -s "$BASE/invoices?page=1" -H "Authorization: Bearer $D2" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")

INV_ID=$(curl -s "$BASE/invoices?page=1" -H "Authorization: Bearer $D2" | python3 -c "import sys,json;print(json.load(sys.stdin).get('list',[{}])[0].get('id','')")
check "发票详情" $(curl -s $BASE/invoices/$INV_ID -H "Authorization: Bearer $D2" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "李建军结算" $(curl -s "$BASE/settlements?page=1" -H "Authorization: Bearer $D2" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")
check "安全台账导出" $(curl -s $BASE/safety/export -H "Authorization: Bearer $S1" | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")

echo ""
echo "===== 结果: ✅ $OK 通过 / ❌ $FAIL 失败 ====="
