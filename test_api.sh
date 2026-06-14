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

call_api "登录/货源"    "$BASE/freights?page=1&size=3"       "print('success=%s count=%s sample=%s' % (d.get('success'), d.get('count'), d.get('items',[{}])[0].get('origin')+'->'+d.get('items',[{}])[0].get('destination')))"
call_api "我的运单"     "$BASE/orders?role=driver&page=1"    "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "分账流水"     "$BASE/settlements?page=1"           "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "发票列表"     "$BASE/invoices?page=1"              "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "安全检查"     "$BASE/safety/checks?role=driver"    "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "行车日志"     "$BASE/safety/driving-logs?role=driver" "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "电子路单"     "$BASE/safety/waybills"              "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "认证状态"     "$BASE/certification/status"         "print('success=%s status=%s' % (d.get('success'), d.get('status')))"
call_api "开票主体"     "$BASE/invoice-entities"             "print('success=%s count=%s' % (d.get('success'), len(d.get('items',[]))))"
call_api "提现记录"     "$BASE/withdrawals?page=1"           "print('success=%s count=%s' % (d.get('success'), d.get('count')))"
call_api "个人资料"     "$BASE/auth/me"                      "print('id=%s name=%s role=%s phone=%s' % (d.get('data',{}).get('id'), d.get('data',{}).get('name'), d.get('data',{}).get('role'), d.get('data',{}).get('phone')))"
echo "=== 全部核心接口验收完成 ==="
