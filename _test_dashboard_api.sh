#!/bin/bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3ODE1NzgwNTEsImV4cCI6MTc4MjE4Mjg1MX0.etO6ujbCDYEcK9DKwoAtq41nqe88t_V6cKVGSBB4MNQ"
BASE="http://127.0.0.1:59212/api"

echo "=== 1. /admin/dashboard ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/dashboard" > /tmp/api1.json
python3 -c "import json; d=json.load(open('/tmp/api1.json')); print(json.dumps(d, indent=2, ensure_ascii=False))"
echo ""

echo "=== 2. /admin/orders?page=1&pageSize=5 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/orders?page=1&pageSize=5" > /tmp/api2.json
python3 -c "import json; d=json.load(open('/tmp/api2.json')); print('keys:', list(d.get('data',{}).keys())); print('total:', d.get('data',{}).get('total')); print('list count:', len(d.get('data',{}).get('list',[]))); print(json.dumps(d.get('data',{}).get('list',[])[:2], indent=2, ensure_ascii=False))"
echo ""

echo "=== 3. /admin/suppliers ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/suppliers" > /tmp/api3.json
python3 -c "import json; d=json.load(open('/tmp/api3.json')); print('type:', type(d.get('data'))); print('count:', len(d.get('data',[]))); print(json.dumps(d.get('data',[])[:2], indent=2, ensure_ascii=False))"
echo ""

echo "=== 4. /admin/card-pool?page=1&pageSize=3 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/card-pool?page=1&pageSize=3" > /tmp/api4.json
python3 -c "import json; d=json.load(open('/tmp/api4.json')); print('keys:', list(d.get('data',{}).keys())); print('cryptoStats:', d.get('data',{}).get('cryptoStats')); print('list count:', len(d.get('data',{}).get('list',[])))"
echo ""

echo "=== 5. /admin/risk/logs?page=1&pageSize=5 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/risk/logs?limit=5" > /tmp/api5.json
python3 -c "import json; d=json.load(open('/tmp/api5.json')); print('type:', type(d.get('data'))); print('count:', len(d.get('data',[]))); print(json.dumps(d.get('data',[])[:2], indent=2, ensure_ascii=False))"
