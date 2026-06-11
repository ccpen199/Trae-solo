#!/bin/bash
BASE="http://127.0.0.1:59100/api"

echo "=== Testing Backend APIs ==="
echo ""

echo "1. Health Check:"
curl -sS "$BASE/health"
echo ""
echo ""

echo "2. Projects List:"
curl -sS "$BASE/projects?pageSize=2" | head -c 500
echo ""
echo ""

echo "3. Project Detail (id=1):"
curl -sS "$BASE/projects/1" | head -c 500
echo ""
echo ""

echo "4. Admin Login:"
curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000000","password":"admin123"}'
echo ""
echo ""

echo "5. Entrepreneur Login:"
curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900000001","password":"ent123"}'
echo ""
echo ""

echo "6. Brand Login:"
curl -sS -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800000001","password":"brand123"}'
echo ""
echo ""

echo "7. Franchisees Stats:"
curl -sS "$BASE/franchisees/stats?brandId=2"
echo ""
echo ""

echo "8. Contracts List:"
curl -sS "$BASE/contracts?pageSize=2" | head -c 500
echo ""
echo ""

echo "9. Disputes List:"
curl -sS "$BASE/disputes?pageSize=2" | head -c 500
echo ""
echo ""

echo "10. Risk Assessment:"
curl -sS -X POST "$BASE/risk/assess" \
  -H "Content-Type: application/json" \
  -d '{"entrepreneur_id":5,"project_id":1}'
echo ""
echo ""

echo "=== Frontend HTTP ==="
curl -I -sS http://127.0.0.1:49100/ | head -3
echo ""

echo "=== Done ==="
