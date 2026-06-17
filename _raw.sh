TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgxNzE5MjQ2LCJleHAiOjE3ODIzMjQwNDZ9.dDMmRj1wtZQL98NYvzswxYkGKAEZ7OeSr7iusDU-4hc"

echo "=== 1. Branches throughput raw ==="
curl -s "http://127.0.0.1:59219/api/branches/throughput-stats" -H "Authorization: Bearer $TOKEN" > /tmp/_t.json
python3 <<EOF
import json
d=json.load(open('/tmp/_t.json'))
r=d.get('data',d)
print('Top-level keys:', sorted(r.keys())[:20])
for k in sorted(r.keys()):
    v = r[k]
    if isinstance(v, list):
        if v:
            print(f'  {k}: list len={len(v)}, first keys={sorted(v[0].keys())[:10]}')
        else:
            print(f'  {k}: empty list')
    elif isinstance(v, dict):
        print(f'  {k}: dict keys={sorted(v.keys())[:8]}')
    else:
        print(f'  {k}: {repr(v)[:80]}')
EOF

echo ""
echo "=== 2. Complaints raw (first) ==="
curl -s "http://127.0.0.1:59219/api/complaints?pageSize=1" -H "Authorization: Bearer $TOKEN" > /tmp/_c.json
python3 <<EOF
import json
d=json.load(open('/tmp/_c.json'))
r=d.get('data',d)
l=r.get('list',[]) if isinstance(r,dict) else r
if l:
    print('Fields:', sorted(l[0].keys()))
    for k,v in l[0].items():
        print(f'  {k}: {repr(v)[:100]}')
else:
    print('No data, top keys:', sorted(r.keys()) if isinstance(r,dict) else type(r))
EOF

echo ""
echo "=== 3. Audit logs raw (first) ==="
curl -s "http://127.0.0.1:59219/api/dashboard/audit-logs?pageSize=1" -H "Authorization: Bearer $TOKEN" > /tmp/_a.json
python3 <<EOF
import json
d=json.load(open('/tmp/_a.json'))
r=d.get('data',d)
l=r.get('list',[]) if isinstance(r,dict) else r
if l:
    print('Fields:', sorted(l[0].keys()))
    for k,v in l[0].items():
        print(f'  {k}: {repr(v)[:100]}')
else:
    print('No data, top keys:', sorted(r.keys()) if isinstance(r,dict) else type(r))
EOF

echo ""
echo "=== 4. Brands raw (first) ==="
curl -s "http://127.0.0.1:59219/api/brands?pageSize=1" -H "Authorization: Bearer $TOKEN" > /tmp/_b.json
python3 <<EOF
import json
d=json.load(open('/tmp/_b.json'))
r=d.get('data',d)
l=r.get('list',[]) if isinstance(r,dict) else r
if l:
    print('Fields:', sorted(l[0].keys()))
    for k in ['name','code','base_price','rating','coverage_score','avg_delivery_hours','city_count','coverage_cities']:
        print(f'  {k}: {l[0].get(k)}')
else:
    print('No data')
EOF
