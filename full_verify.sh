#!/bin/bash
API="http://127.0.0.1:53416"

echo "=== 1. 健康检查 ==="
curl -sS --max-time 5 "$API/api/health" | python3 -m json.tool
echo ""

echo "=== 2. 剧集列表 ==="
curl -sS --max-time 5 "$API/api/dramas" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data['data']:
    print(f\"  {d['id']}. {d['title']} ({d['genre']}) - {d['episode_count']}集 [{d['shelf_status']}]\")
"
echo ""

echo "=== 3. 剧集详情(id=1) ==="
curl -sS --max-time 5 "$API/api/dramas/1" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
print(f\"  剧名: {d['title']}\")
print(f\"  分集数: {len(d['episodes'])}集\")
print(f\"  审核记录: {len(d['reviews'])}条\")
print(f\"  分发配置: {len(d['distributions'])}条\")
print(f\"  分析数据: {len(d['analytics'])}条\")
print(f\"  第1集状态: {d['episodes'][0]['status'] if d['episodes'] else 'N/A'}\")
"
echo ""

echo "=== 4. 新建剧集 ==="
NEW_ID=$(curl -sS --max-time 5 -X POST "$API/api/dramas" -H "Content-Type: application/json" -d '{"title":"测试新剧","genre":"测试","synopsis":"测试描述","cover_url":"https://picsum.photos/seed/new/400/600","episode_count":2,"payment_type":"free","shelf_status":"draft"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "  新剧集ID: $NEW_ID"
echo ""

echo "=== 5. 新建分集 ==="
curl -sS --max-time 5 -X POST "$API/api/dramas/$NEW_ID/episodes" -H "Content-Type: application/json" -d '{"episode_number":1,"title":"测试第1集","video_url":"https://cdn.example.com/v.mp4","preview_duration":60,"subtitle_file":"","plot_tags":"测试","review_notes":""}'
echo ""
echo ""

echo "=== 6. 更新分集状态为待审核 ==="
EP_ID=$(curl -sS --max-time 5 "$API/api/dramas/$NEW_ID/episodes" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
curl -sS --max-time 5 -X POST "$API/api/episodes/$EP_ID/status" -H "Content-Type: application/json" -d '{"status":"pending_review"}'
echo ""
echo ""

echo "=== 7. 提交审核 ==="
curl -sS --max-time 5 -X POST "$API/api/reviews" -H "Content-Type: application/json" -d "{\"drama_id\":$NEW_ID,\"episode_id\":$EP_ID,\"reviewer\":\"自动化测试\",\"copyright_check\":1,\"sensitive_content_check\":1,\"quality_check\":1,\"subtitle_check\":1,\"payment_config_check\":1,\"overall_result\":\"approved\"}"
echo ""
echo ""

echo "=== 8. 配置分发 ==="
curl -sS --max-time 5 -X POST "$API/api/distributions" -H "Content-Type: application/json" -d "{\"drama_id\":$NEW_ID,\"episode_id\":$EP_ID,\"recommendation_slot\":\"首页推荐\",\"campaign\":\"新用户优惠\",\"unlock_price\":0,\"member_benefit\":\"免费\",\"distribution_channel\":\"全渠道\"}"
echo ""
echo ""

echo "=== 9. 验证最终状态 ==="
curl -sS --max-time 5 "$API/api/dramas/$NEW_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
print(f\"  剧名: {d['title']}\")
for e in d['episodes']:
    print(f\"  第{e['episode_number']}集: {e['status']}\")
print(f\"  审核记录: {len(d['reviews'])}条\")
print(f\"  分发配置: {len(d['distributions'])}条\")
"
echo ""

echo "=== 10. 数据分析概览 ==="
curl -sS --max-time 5 "$API/api/analytics/summary" | python3 -c "
import sys, json
s = json.load(sys.stdin)['summary']
print(f\"  剧集总数: {s['total_dramas']}\")
print(f\"  总播放: {s['total_plays']}\")
print(f\"  总完播: {s['total_completions']}\")
print(f\"  付费转化: {s['total_payments']}\")
"
echo ""
echo "=== 全部验证完成 ==="
