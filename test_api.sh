#!/bin/bash

BASE_URL="http://localhost:3001/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Nzk4NDAzNzQsImV4cCI6MTc3OTkyNjc3NH0.T5o8vy0V7fef2o63CSRX9BTw7VR9jbQhABhpPT9tFtY"

echo "========================================"
echo "  版权保护系统 API 测试"
echo "========================================"

# 1. 健康检查
echo -e "\n[1/10] 健康检查..."
curl -s "$BASE_URL/health"
echo ""

# 2. 概览统计
echo -e "\n[2/10] 概览统计..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/reports/overview"
echo ""

# 3. 课程列表
echo -e "\n[3/10] 课程列表..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/courses?page_size=3"
echo ""

# 4. 素材列表
echo -e "\n[4/10] 素材列表..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/materials?page_size=3"
echo ""

# 5. 讲师列表
echo -e "\n[5/10] 讲师列表..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/lecturers?page_size=3"
echo ""

# 6. 盗版线索列表
echo -e "\n[6/10] 盗版线索列表..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/piracy?page_size=3"
echo ""

# 7. 维权案件列表
echo -e "\n[7/10] 维权案件列表..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/enforcement?page_size=3"
echo ""

# 8. 上架检查 - 课程 1
echo -e "\n[8/10] 上架检查 (课程 ID=1)..."
curl -s -H "Authorization: Bearer $TOKEN" -X POST "$BASE_URL/publication/check/1"
echo ""

# 9. 侵权统计
echo -e "\n[9/10] 侵权统计..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/reports/infringement-statistics"
echo ""

# 10. 操作日志
echo -e "\n[10/10] 操作日志..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/audit?page_size=5"
echo ""

echo -e "\n========================================"
echo "  测试完成！"
echo "========================================"
