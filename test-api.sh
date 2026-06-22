#!/bin/bash
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$ROOT_DIR/.env" ]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
fi

BACKEND_PORT="${BACKEND_PORT:-60306}"
API="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}/api"

WT=$(curl -sS --max-time 5 -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"phone":"13900001111","password":"worker123","role":"worker"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
ET=$(curl -sS --max-time 5 -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"phone":"13800002222","password":"ent123456","role":"enterprise"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
AT=$(curl -sS --max-time 5 -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"phone":"13800000000","password":"admin123","role":"admin"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

echo "=== 企业审核申请 ==="
APPS=$(curl -sS --max-time 5 "$API/job/my-applications" -H "Authorization: Bearer $WT")
APP_ID=$(echo "$APPS" | python3 -c "import sys,json;d=json.load(sys.stdin);items=d.get('data',[]);print(items[0]['id'] if items else '')" 2>/dev/null)
echo "APP_ID=$APP_ID"

if [ -n "$APP_ID" ]; then
  curl -sS --max-time 5 -X PUT "$API/job/applications/$APP_ID/review" -H "Content-Type: application/json" -H "Authorization: Bearer $ET" -d '{"status":"accepted"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('review:',d['code'],d['message'])"
fi

echo "=== 工人签合同 ==="
if [ -n "$APP_ID" ]; then
  curl -sS --max-time 5 -X POST "$API/job/applications/$APP_ID/sign-contract" -H "Authorization: Bearer $WT" | python3 -c "import sys,json;d=json.load(sys.stdin);print('sign:',d['code'],d['message'])"
fi

echo "=== 企业签合同 ==="
if [ -n "$APP_ID" ]; then
  curl -sS --max-time 5 -X POST "$API/job/applications/$APP_ID/sign-contract" -H "Authorization: Bearer $ET" | python3 -c "import sys,json;d=json.load(sys.stdin);print('sign:',d['code'],d['message'])"
fi

echo "=== 工人打卡 ==="
if [ -n "$APP_ID" ]; then
  curl -sS --max-time 5 -X POST "$API/worker/attendance/$APP_ID/check-in" -H "Content-Type: application/json" -H "Authorization: Bearer $WT" -d '{"latitude":39.9042,"longitude":116.4074}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('checkin:',d['code'],d['message'])"
fi

echo "=== 工人完工签收 ==="
if [ -n "$APP_ID" ]; then
  curl -sS --max-time 5 -X POST "$API/job/applications/$APP_ID/signoff" -H "Authorization: Bearer $WT" | python3 -c "import sys,json;d=json.load(sys.stdin);print('signoff:',d['code'],d['message'])"
fi

echo "=== 企业确认完工 ==="
if [ -n "$APP_ID" ]; then
  curl -sS --max-time 5 -X POST "$API/job/applications/$APP_ID/confirm" -H "Authorization: Bearer $ET" | python3 -c "import sys,json;d=json.load(sys.stdin);print('confirm:',d['code'],d['message'])"
fi

echo "=== 风控扫描 ==="
curl -sS --max-time 5 -X POST "$API/risk/alerts/scan" -H "Authorization: Bearer $AT" | python3 -c "import sys,json;d=json.load(sys.stdin);print('scan:',d['code'],d['message'])"

echo "=== 个体户执照申请 ==="
curl -sS --max-time 5 -X POST "$API/service/license/apply" -H "Content-Type: application/json" -H "Authorization: Bearer $WT" -d '{"business_name":"张三建筑劳务","business_scope":"建筑劳务分包","business_address":"北京市朝阳区"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('license:',d['code'],d['message'])"

echo "=== 发票申请 ==="
curl -sS --max-time 5 -X POST "$API/service/invoice/apply" -H "Content-Type: application/json" -H "Authorization: Bearer $ET" -d '{"amount":10000,"buyer_name":"某甲方公司","service_content":"建筑劳务服务"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print('invoice:',d['code'],d['message'])"

echo "=== 保证金列表 ==="
curl -sS --max-time 5 "$API/wage/guarantees" -H "Authorization: Bearer $ET" | python3 -c "import sys,json;d=json.load(sys.stdin);print('guarantees:',d['code'])"

echo "=== 工人薪资 ==="
curl -sS --max-time 5 "$API/worker/wages" -H "Authorization: Bearer $WT" | python3 -c "import sys,json;d=json.load(sys.stdin);print('wages:',d['code'])"

echo ""
echo "=== 完整业务链路验证完成 ==="
