#!/bin/bash
set -e

echo "=== 1. Login as parent ==="
PARENT_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"parent123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Parent token obtained"

echo ""
echo "=== 2. Parent enrolls student (ID: 8) in course 1 ==="
curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":8,"course_id":1}' \
  http://127.0.0.1:58831/api/enrollments | python3 -m json.tool

echo ""
echo "=== 3. Get enrollments list ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" \
  http://127.0.0.1:58831/api/enrollments | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Found {len(data)} enrollments')
for e in data:
    print(f'  - {e[\"course_name\"]}: {e[\"status\"]} (student: {e[\"student_name\"]})')
"

echo ""
echo "=== 4. Get student schedule (ID: 8) ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" \
  http://127.0.0.1:58831/api/enrollments/schedule/8 | python3 -m json.tool

echo ""
echo "=== 5. Test time conflict - enroll same student in same time course ==="
curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":8,"course_id":4}' \
  http://127.0.0.1:58831/api/enrollments | python3 -m json.tool

echo ""
echo "=== All tests completed! ==="
