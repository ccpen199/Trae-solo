#!/bin/bash
set -e

echo "=== 1. Login as teacher ==="
TEACHER_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"teacher123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Teacher token obtained"

echo ""
echo "=== 2. Save attendance record ==="
curl -s -X POST -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-20","records":[{"student_id":8,"status":"present","notes":""}]}' \
  http://127.0.0.1:58831/api/attendance/course/1/batch | python3 -m json.tool

echo ""
echo "=== 3. Login as parent ==="
PARENT_TOKEN=$(curl -s -X POST http://127.0.0.1:58831/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"parent1","password":"parent123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo ""
echo "=== 4. Check student attendance (parent view) ==="
curl -s -H "Authorization: Bearer $PARENT_TOKEN" \
  http://127.0.0.1:58831/api/attendance/student/8 | python3 -m json.tool

echo ""
echo "=== Test completed ==="
