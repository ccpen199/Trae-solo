#!/bin/bash
cd /Users/chen/Documents/trae_projects/local_projects/may-88938
source .env
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"

echo "=== 1. 登录获取Token ==="
LOGIN_RES=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123456"}')
echo "Login response received: $(echo "$LOGIN_RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('token_len=%d, username=%s' % (len(d.get('token','')), d.get('user',{}).get('username','')))")"
TOKEN=$(echo "$LOGIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

echo ""
echo "=== 2. 户号档案核验API（成功） ==="
curl -s -X POST "$BACKEND_URL/api/accounts/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"account_number":"11010120240001","account_name":"张三","meter_number":"METER20240001"}' \
  | python3 -c "
import sys,json
d = json.load(sys.stdin)
print('verify_status:', d.get('verify_status'))
print('confidence:', d.get('confidence'))
print('verified_items:', len(d.get('verified_items', [])))
print('has archive_info:', 'archive_info' in d)
print('region:', d.get('archive_info',{}).get('region','N/A'))
"

echo ""
echo "=== 3. 户号档案核验API（失败-户号不存在） ==="
curl -s -w "\nHTTP_CODE=%{http_code}" -X POST "$BACKEND_URL/api/accounts/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"account_number":"0000000000000000","account_name":"测试","meter_number":"TEST001"}' \
  | python3 -c "
import sys,json
lines = sys.stdin.read().splitlines()
code_line = lines[-1]
d = json.loads(''.join(lines[:-1]))
print('verify_status:', d.get('verify_status'))
print('verify_code:', d.get('verify_code'))
print('verify_step:', d.get('verify_step'))
print('suggestion:', d.get('suggestion'))
print('errors count:', len(d.get('errors', [])))
print(code_line)
"

echo ""
echo "=== 4. 缴费记录API（带summary） ==="
curl -s "$BACKEND_URL/api/payment/records?page_size=2" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d = json.load(sys.stdin)
print('total:', d.get('total'))
s = d.get('summary', {})
print('summary: total_count=%s, total_amount=%s, agent_count=%s, agent_amount=%s' % (s.get('total_count'), s.get('total_amount'), s.get('agent_count'), s.get('agent_amount')))
if d.get('records'):
    r = d['records'][0]
    print('record[0]: category=%s, is_agent=%s, invoice_status=%s' % (r.get('category'), r.get('is_agent'), r.get('invoice_status')))
"

echo ""
echo "=== 5. 缴费记录API（代缴筛选） ==="
curl -s "$BACKEND_URL/api/payment/records?is_agent=1&page_size=3" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d = json.load(sys.stdin)
print('total:', d.get('total'))
for i, r in enumerate(d.get('records', [])):
    print('  [%d] is_agent=%s, relation=%s, payer=%s, payee=%s' % (i, r.get('is_agent'), r.get('agent_relation'), r.get('payer_name'), r.get('payee_name')))
"

echo ""
echo "=== 6. 积分商品列表 ==="
curl -s "$BACKEND_URL/api/mall/products" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "
import sys,json
d = json.load(sys.stdin)
print('products count:', len(d.get('products', [])))
for p in d.get('products', [])[:3]:
    print('  - %s: %d积分, market_value=%s' % (p.get('name'), p.get('points_price'), p.get('market_value')))
"

echo ""
echo "=== 所有API验证完成 ==="
