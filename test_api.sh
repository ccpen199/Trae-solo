#!/bin/bash
set -e

echo "=== 1. Login as admin ==="
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Admin token obtained: ${ADMIN_TOKEN:0:30}..."

echo ""
echo "=== 2. Get courses list ==="
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://127.0.0.1:58831/api/courses?status=published" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Found {len(data)} published courses')
for c in data[:3]:
    print(f'  - {c[\"name\"]}: {c[\"enrolled_count\"]}/{c[\"capacity\"]} students, fee: ¥{c[\"fee\"]}')
"

echo ""
echo "=== 3. Login as parent ==="
PARENT_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"parent123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Parent token obtained: ${PARENT_TOKEN:0:30}..."

echo ""
echo "=== 4. Parent enrolls student in course ==="
ENROLL_RESULT=$(curl -s -X POST -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":6,"course_id":1}' \
  http://127.0.0.1:58831/api/enrollments)
echo "Enroll result: $ENROLL_RESULT"

echo ""
echo "=== 5. Get enrollments list ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" \
  http://127.0.0.1:58831/api/enrollments | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Found {len(data)} enrollments')
for e in data:
    print(f'  - {e[\"course_name\"]}: {e[\"status\"]} (student: {e[\"student_name\"]})')
"

echo ""
echo "=== 6. Get student schedule ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" \
  http://127.0.0.1:58831/api/enrollments/schedule/6 | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Student has {len(data)} courses in schedule')
for c in data:
    print(f'  - {c[\"name\"]}: Day {c[\"day_of_week\"]} {c[\"start_time\"]}-{c[\"end_time\"]}')
"

echo ""
echo "=== All tests passed! ==="
