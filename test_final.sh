#!/bin/bash
set -e
BASE=http://127.0.0.1:58919/api
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138001","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

function call_api() {
  local NAME=$1
  local URL=$2
  local EXPR=$3
  local RES=$(curl -s "$URL" -H "Authorization: Bearer $TOKEN")
  echo "$NAME: $(echo "$RES" | python3 -c "import sys,json;d=json.load(sys.stdin);$EXPR")"
}

echo "========== 以司机 13800138001 登录测试 =========="
call_api "货源列表"    "$BASE/freights?page=1&size=3"       "print('success=%s count=%s' % (d.get('success'), len(d.get('list',[]))))"
call_api "我的运单"     "$BASE/orders?role=driver&page=1"    "print('success=%s count=%s' % (d.get('success'), d.get('total')))"
call_api "运单详情(o_001)" "$BASE/orders/o_001"            "d.get('data',{}); print('success=%s status=%s waybill=%s' % (d.get('success'), d.get('data',{}).get('status'), d.get('data',{}).get('waybill_no')))"
call_api "结算流水"     "$BASE/settlements?page=1"           "print('success=%s count=%s' % (d.get('success'), d.get('total')))"
call_api "结算汇总"     "$BASE/settlements/summary"          "d=json.load(sys.stdin); print('success=%s bal=%.1f income=%.1f' % (d.get('success'), d.get('data',{}).get('availableBalance',0), d.get('data',{}).get('totalIncome',0)))"
call_api "发票列表"     "$BASE/invoices?page=1"              "print('success=%s count=%s' % (d.get('success'), d.get('total')))"
call_api "安全检查"     "$BASE/safety/checks?role=driver&page=1" "print('success=%s count=%s' % (d.get('success'), d.get('total')))"
call_api "行车日志"     "$BASE/safety/logs?role=driver&page=1"   "print('success=%s count=%s' % (d.get('success'), d.get('total')))"
call_api "电子路单"     "$BASE/safety/waybills?page=1"        "print('success=%s count=%s' % (d.get('success'), len(d.get('list',[]))))"
call_api "认证状态"     "$BASE/certification/status"         "print('success=%s overall=%s' % (d.get('success'), d.get('data',{}).get('overall')))"
call_api "提现记录"     "$BASE/settlements/withdrawals?page=1"   "print('success=%s count=%s' % (d.get('success'), d.get('total')))"
call_api "个人资料"     "$BASE/auth/me"                      "d=json.load(sys.stdin); print('success=%s id=%s name=%s role=%s phone=%s' % (d.get('success'), d.get('data',{}).get('id'), d.get('data',{}).get('name'), d.get('data',{}).get('role'), d.get('data',{}).get('phone')))"

echo ""
echo "========== 切换到货主 13900139001 测试开票主体 =========="
T2=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13900139001","code":"123456","role":"shipper"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
call_api "开票主体(货主)" "$BASE/invoices/invoice-entities"  "print('success=%s count=%s' % (d.get('success'), len(d.get('list',[]))))"
call_api "货主发布的货源" "$BASE/freights?page=1"            "print('success=%s count=%s' % (d.get('success'), len(d.get('list',[]))))"

echo ""
echo "========== 管理员 13700137001 测试台账导出 =========="
T3=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13700137001","code":"123456","role":"admin"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
RES=$(curl -s "$BASE/safety/export" -H "Authorization: Bearer $T3")
echo "安全台账导出: success=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))")"

echo ""
echo "========== 以司机李建军 13800138002 测试有结算/发票的运单 =========="
T4=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138002","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
RES=$(curl -s "$BASE/orders?role=driver&page=1&size=5" -H "Authorization: Bearer $T4")
echo "李建军的运单: success=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))") total=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('total'))")"
RES=$(curl -s "$BASE/settlements?page=1" -H "Authorization: Bearer $T4")
echo "李建军的结算: success=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))") total=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('total'))")"
RES=$(curl -s "$BASE/invoices?page=1" -H "Authorization: Bearer $T4")
echo "李建军的发票: success=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('success'))") total=$(echo $RES | python3 -c "import sys,json;print(json.load(sys.stdin).get('total'))")"

echo ""
echo "=== 全部核心接口验收完成 ==="
