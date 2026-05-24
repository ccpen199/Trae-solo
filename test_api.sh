#!/bin/bash
BASE_URL="http://127.0.0.1:52266"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3OTI5Mjg0OSwiZXhwIjoxNzc5ODk3NjQ5fQ.QGiFLm0Nzany40YmHu31ED2reSJtE-9H6bDPxuDDAPI"

echo "========================================"
echo "  在线约球平台 - API完整测试"
echo "========================================"
echo ""

echo "1. 运营概览 (修复后)"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/reports/overview"
echo ""
echo ""

echo "2. 按运动类型统计"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/reports/games-by-sport"
echo ""
echo ""

echo "3. 场馆使用统计"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/reports/venue-usage"
echo ""
echo ""

echo "4. 信用排行"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/reports/credit-ranking"
echo ""
echo ""

echo "5. 场馆列表"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/venues" | head -c 300
echo ""
echo ""

echo "6. 异常列表"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/exceptions"
echo ""
echo ""

echo "7. 操作日志"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/logs" | head -c 200
echo ""
echo ""

echo "8. 用户活跃度"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/reports/user-activity" | head -c 200
echo ""
echo ""

echo "========================================"
echo "  测试完整业务流程: 创建球局"
echo "========================================"
echo ""

echo "9. 获取可用时段 (场馆1)"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/venues/1/time-slots?date=$(date +%Y-%m-%d)&courtId=1" | head -c 200
echo ""
echo ""

echo "10. 创建球局"
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "court_id": 1,
    "time_slot_id": 1,
    "sport_type": "badminton",
    "title": "API测试球局",
    "description": "通过API自动创建的测试球局",
    "level_required": 3,
    "max_players": 4,
    "min_players": 2,
    "aa_rule": "average",
    "deposit_amount": 20,
    "allow_waitlist": true
  }' "$BASE_URL/api/games"
echo ""
echo ""

echo "11. 球局列表"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/games" | head -c 300
echo ""
echo ""

echo "========================================"
echo "  所有API测试完成！"
echo "========================================"
