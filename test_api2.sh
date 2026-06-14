#!/bin/bash
set -e
BASE=http://127.0.0.1:58919/api
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"phone":"13800138001","code":"123456","role":"driver"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

function call_api() {
  local NAME=$1
  local URL=$2
  echo "===== $NAME ($URL) ====="
  curl -s "$URL" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d, ensure_ascii=False, indent=2)[:1000])"
  echo
}

call_api "登录"        "$BASE/auth/me"
call_api "货源列表"    "$BASE/freights?page=1&size=2"
call_api "我的运单"    "$BASE/orders?role=driver&page=1&size=5"
call_api "结算"        "$BASE/settlements?page=1"
call_api "发票"        "$BASE/invoices?page=1"
call_api "安全检查"    "$BASE/safety/checks?role=driver&page=1"
call_api "行车日志"    "$BASE/safety/driving-logs?role=driver&page=1"
call_api "电子路单"    "$BASE/safety/waybills?page=1"
call_api "认证状态"    "$BASE/certification/status"
call_api "开票主体"    "$BASE/invoice-entities"
call_api "提现"        "$BASE/withdrawals?page=1"
echo "=== 结束 ==="
