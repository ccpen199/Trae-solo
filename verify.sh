#!/bin/bash
API="http://127.0.0.1:53416"
echo "=== 1. 所有剧集 ==="
curl -sS --max-time 5 "$API/api/dramas" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data['data']:
    print(f\"  {d['id']}. {d['title']} ({d['genre']}) - {d['episode_count']}集 [{d['shelf_status']}]\")
"
echo ""
echo "=== 2. 第1部详情 ==="
curl -sS --max-time 5 "$API/api/dramas/1" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
print(f\"  剧名: {d['title']}\")
print(f\"  分集数: {len(d['episodes'])}集\")
print(f\"  审核: {len(d['reviews'])}条\")
print(f\"  分发: {len(d['distributions'])}条\")
print(f\"  分析: {len(d['analytics'])}条\")
"
echo ""
echo "=== 3. 新建剧集 ==="
curl -sS --max-time 5 -X POST "$API/api/dramas" -H "Content-Type: application/json" -d '{"title":"测试剧集","genre":"测试","synopsis":"测试","cover_url":"https://picsum.photos/seed/test/400/600","episode_count":3,"payment_type":"per_episode","shelf_status":"draft"}'
echo ""
echo "=== 4. 分析概览 ==="
curl -sS --max-time 5 "$API/api/analytics/summary" | python3 -c "
import sys, json
s = json.load(sys.stdin)['summary']
print(f\"  剧集总数: {s['total_dramas']}\")
print(f\"  总播放: {s['total_plays']}\")
print(f\"  总完播: {s['total_completions']}\")
print(f\"  付费转化: {s['total_payments']}\")
"
echo ""
echo "=== 5. 审核列表 ==="
curl -sS --max-time 5 "$API/api/reviews" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"  审核记录数: {len(data['data'])}\")
for r in data['data'][:3]:
    print(f\"    {r['drama_title']} - {r['overall_result']} - {r['created_at']}\")
"
echo ""
echo "=== DONE ==="
