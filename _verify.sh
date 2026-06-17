TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgxNzE5MjQ2LCJleHAiOjE3ODIzMjQwNDZ9.dDMmRj1wtZQL98NYvzswxYkGKAEZ7OeSr7iusDU-4hc"

echo "=== 1. Brands (品牌质量) ==="
curl -s "http://127.0.0.1:59219/api/brands?pageSize=2" -H "Authorization: Bearer $TOKEN" > /tmp/_b.json
python3 <<EOF
import json
d=json.load(open('/tmp/_b.json'))
r=d.get('data',d)
print('  total:', r.get('total'))
for b in (r.get('list') or [])[:2]:
    print(' ', b.get('name'), 'rating:', b.get('rating'), 'coverage:', b.get('coverage_score'))
EOF

echo ""
echo "=== 2. Branches Throughput (网络拓扑吞吐量) ==="
curl -s "http://127.0.0.1:59219/api/branches/throughput-stats" -H "Authorization: Bearer $TOKEN" > /tmp/_t.json
python3 <<EOF
import json
d=json.load(open('/tmp/_t.json'))
r=d.get('data',d)
print('  keys:', sorted(r.keys()))
print('  total_today:', r.get('total_today'))
print('  daily_trend days:', len(r.get('daily_trend', [])))
print('  hub_throughput nodes:', len(r.get('hub_throughput', [])))
EOF

echo ""
echo "=== 3. Complaints SLA (投诉SLA) ==="
curl -s "http://127.0.0.1:59219/api/complaints?pageSize=3" -H "Authorization: Bearer $TOKEN" > /tmp/_c.json
python3 <<EOF
import json
d=json.load(open('/tmp/_c.json'))
r=d.get('data',d)
print('  total:', r.get('total'))
for c in (r.get('list') or [])[:2]:
    sla = c.get('sla_remaining_hours', c.get('sla_remaining','?'))
    print(' ', c.get('tracking_no'), c.get('type'), c.get('status'), 'sla_rem:', sla, 'h')
EOF

echo ""
echo "=== 4. API Audit Logs (开放接口调用审计) ==="
curl -s "http://127.0.0.1:59219/api/dashboard/audit-logs?pageSize=3" -H "Authorization: Bearer $TOKEN" > /tmp/_a.json
python3 <<EOF
import json
d=json.load(open('/tmp/_a.json'))
r=d.get('data',d)
print('  total:', r.get('total'))
for a in (r.get('list') or [])[:3]:
    print(' ', a.get('path'), 'status:', a.get('status'), a.get('latency_ms'), 'ms', 'app:', a.get('app_name'))
EOF

echo ""
echo "=== 5. Dashboard Brand Quality Trend ==="
curl -s "http://127.0.0.1:59219/api/dashboard/brand-quality/1" -H "Authorization: Bearer $TOKEN" > /tmp/_bq.json
python3 <<EOF
import json
d=json.load(open('/tmp/_bq.json'))
r=d.get('data',d)
print('  keys:', sorted(r.keys()))
print('  name:', r.get('name'))
print('  trend days:', len(r.get('trend', [])))
print('  recent orders:', len(r.get('recent_orders', [])))
EOF
