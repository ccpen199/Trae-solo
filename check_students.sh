#!/bin/bash
TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"parent123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Parent info and children:"
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:58831/api/auth/me | python3 -m json.tool

echo ""
echo "Raw schedule response:"
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:58831/api/enrollments/schedule/6
