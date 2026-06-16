#!/bin/bash
BASE_URL="http://localhost:3050/api"

echo "=== 1. Login Test ==="
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"123456"}')
echo "Login: $LOGIN_RESP" | head -c 200
echo ""

TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Token obtained: ${TOKEN:0:30}..."

echo ""
echo "=== 2. GET /pets ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/pets" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
    for p in items[:2]:
        print(f'  - {p.get(\"name\")} ({p.get(\"species\")})')
"

echo ""
echo "=== 3. GET /doctors ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/doctors" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
    for p in items[:2]:
        print(f'  - {p.get(\"name\")} - {p.get(\"department\")}')
"

echo ""
echo "=== 4. GET /hospitals ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/hospitals" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
    for p in items[:2]:
        print(f'  - {p.get(\"name\")} 评分:{p.get(\"rating\")}')
"

echo ""
echo "=== 5. GET /products ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/products" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
    for p in items[:2]:
        print(f'  - {p.get(\"name\")} ¥{p.get(\"price\")} 处方:{p.get(\"isPrescription\")}')
"

echo ""
echo "=== 6. GET /consultations ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/consultations" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
"

echo ""
echo "=== 7. GET /calendar/events ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/calendar/events" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
"

echo ""
echo "=== 8. GET /community/posts ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/community/posts" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
"

echo ""
echo "=== 9. GET /community/lost-pets ==="
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/community/lost-pets" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, dict):
    items = data.get('data', [])
    print(f'Count: {len(items)}')
"

echo ""
echo "=== API Tests Complete ==="
