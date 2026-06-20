#!/bin/bash
BASE="http://localhost:3000/api"
OPERATOR_TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' -d '{"username":"operator1","password":"operator123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))"
echo "token: $OPERATOR_TOKEN"
echo ""
echo "=== operator finance daily (role=operator, 没有 outletId"
curl -v "$BASE/finance/daily?pageSize=3" -H "Authorization: Bearer $OPERATOR_TOKEN"
echo ""
echo ""
echo "=== operator finance overview"
curl -s "$BASE/finance/overview" -H "Authorization: Bearer $OPERATOR_TOKEN" | python3 -m json.tool
