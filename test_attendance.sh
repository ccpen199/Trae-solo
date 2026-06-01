#!/bin/bash
set -e

echo "=== 1. Login as parent ==="
PARENT_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"parent123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Parent token obtained"

echo ""
echo "=== 2. Enroll student in course 1 ==="
curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":8,"course_id":1}' \
  http://127.0.0.1:58831/api/enrollments | python3 -m json.tool

echo ""
echo "=== 3. Get orders and pay ==="
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
echo "=== 4. Pay the order ==="
curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method":"online"}' \
  http://127.0.0.1:58831/api/orders/$ORDER_ID/pay | python3 -m json.tool

echo ""
echo "=== 5. Login as teacher ==="
TEACHER_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"teacher123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Teacher token obtained"

echo ""
echo "=== 6. Get enrolled students for course 1 ==="
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
  "http://127.0.0.1:58831/api/enrollments?course_id=1&status=enrolled" | python3 -m json.tool

echo ""
echo "=== 7. Save attendance record ==="
curl -s -X POST -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-20","records":[{"student_id":8,"status":"present","notes":""}]}' \
  http://127.0.0.1:58831/api/attendance/course/1/batch | python3 -m json.tool

echo ""
echo "=== 8. Check student attendance (parent view) ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" \
  http://127.0.0.1:58831/api/attendance/student/8 | python3 -m json.tool

echo ""
echo "=== Test completed ==="
