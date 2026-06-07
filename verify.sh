#!/bin/bash
BASE="http://127.0.0.1:59048"
echo "===== API VERIFICATION ====="

echo ""
echo "1. Health Check"
curl -sS --max-time 5 "$BASE/api/health"
echo ""

echo ""
echo "2. Admin Login"
ADMIN=$(curl -sS --max-time 5 -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"phone":"13800000001","password":"admin123"}')
ATOKEN=$(echo "$ADMIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -n "$ATOKEN" ]; then echo "OK - token obtained"; else echo "FAIL"; fi

echo ""
echo "3. Requester Login"
REQ=$(curl -sS --max-time 5 -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"phone":"13800000010","password":"user123"}')
RTOKEN=$(echo "$REQ" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -n "$RTOKEN" ]; then echo "OK - token obtained"; else echo "FAIL"; fi

echo ""
echo "4. Courier Login"
COUR=$(curl -sS --max-time 5 -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"phone":"13800000020","password":"courier123"}')
CTOKEN=$(echo "$COUR" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -n "$CTOKEN" ]; then echo "OK - token obtained"; else echo "FAIL"; fi

echo ""
echo "5. Create Order"
ORDER=$(curl -sS --max-time 5 -X POST "$BASE/api/orders" -H "Content-Type: application/json" -H "Authorization: Bearer $RTOKEN" -d '{"type":"pickup_delivery","title":"取快递","description":"帮我取个快递","pickup_address":"南山区","pickup_latitude":22.54,"pickup_longitude":113.95,"delivery_address":"福田区","delivery_latitude":22.55,"delivery_longitude":114.05,"priority":0,"estimated_duration":45,"fee":20,"reward":15}')
echo "$ORDER" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Order:',d.get('order',{}).get('order_no','FAIL'),'Status:',d.get('order',{}).get('status','FAIL'))" 2>/dev/null

echo ""
echo "6. Admin Dashboard"
DASH=$(curl -sS --max-time 5 "$BASE/api/admin/dashboard" -H "Authorization: Bearer $ATOKEN")
echo "$DASH" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Total orders:',d.get('totalOrders','N/A'),'Active couriers:',d.get('activeCouriers','N/A'))" 2>/dev/null

echo ""
echo "7. Courier Update Location"
LOC=$(curl -sS --max-time 5 -X PUT "$BASE/api/couriers/me/location" -H "Content-Type: application/json" -H "Authorization: Bearer $CTOKEN" -d '{"latitude":22.54,"longitude":113.95}')
echo "$LOC" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Location updated:',d.get('latitude','FAIL'))" 2>/dev/null

echo ""
echo "8. List Orders (requester)"
ORDERS=$(curl -sS --max-time 5 "$BASE/api/orders" -H "Authorization: Bearer $RTOKEN")
echo "$ORDERS" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Orders count:',len(d.get('orders',[])))" 2>/dev/null

echo ""
echo "9. Enterprise Auth"
ENT=$(curl -sS --max-time 5 -X POST "$BASE/api/enterprise/auth" -H "Content-Type: application/json" -d '{"api_key":"ent_test_key_001"}')
echo "$ENT" | python3 -c "import sys,json;d=json.load(sys.stdin);print('Enterprise auth:',d.get('client',{}).get('name','FAIL') if 'client' in d else 'FAIL - '+str(d))" 2>/dev/null

echo ""
echo "10. Frontend Proxy Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:49048/)
echo "Frontend HTTP: $HTTP_CODE"
PROXY_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:49048/api/health)
echo "Proxy API HTTP: $PROXY_CODE"

echo ""
echo "===== VERIFICATION COMPLETE ====="
