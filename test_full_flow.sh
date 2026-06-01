#!/bin/bash
set -e

echo "=== 1. Login as parent ==="
PARENT_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"parent123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Parent token obtained"

echo ""
echo "=== 2. Enroll student in course 1 ==="
ENROLL_RESULT=$(curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":8,"course_id":1}' \
  http://127.0.0.1:58831/api/enrollments)
echo "Enroll result: $ENROLL_RESULT"
ENROLL_ID=$(echo $ENROLL_RESULT | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Enrollment ID: $ENROLL_ID"

echo ""
echo "=== 3. Check enrollment status ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" http://127.0.0.1:58831/api/enrollments | python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data:
    print(f'ID: {e[\"id\"]}, Status: {e[\"status\"]}, Course: {e[\"course_name\"]}')
"

echo ""
echo "=== 4. Get orders and pay ==="
ORDER_ID=$(curl -s -H "Authorization: Bearer $PARENT_TOKEN" http://127.0.0.1:58831/api/orders | python3 -c "
import sys, json
data = json.load(sys.stdin)
for o in data:
    if o['type'] == 'enrollment' and o['status'] == 'pending':
        print(o['id'])
        break
")
echo "Pending Order ID: $ORDER_ID"

echo ""
echo "=== 5. Pay the order ==="
curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method":"online"}' \
  http://127.0.0.1:58831/api/orders/$ORDER_ID/pay | python3 -m json.tool

echo ""
echo "=== 6. Check enrollment status after payment ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" http://127.0.0.1:58831/api/enrollments | python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data:
    print(f'ID: {e[\"id\"]}, Status: {e[\"status\"]}, waitlist_position: {e[\"waitlist_position\"]}')
"

echo ""
echo "=== 7. Try to drop course ==="
curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"测试退课"}' \
  http://127.0.0.1:58831/api/enrollments/$ENROLL_ID/drop | python3 -m json.tool

echo ""
echo "=== 8. Check enrollment status after drop ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" http://127.0.0.1:58831/api/enrollments | python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data:
    print(f'ID: {e[\"id\"]}, Status: {e[\"status\"]}, Course: {e[\"course_name\"]}')
"

echo ""
echo "=== Test completed ==="
