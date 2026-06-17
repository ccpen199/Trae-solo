import json
d = json.load(open('_dash.json'))
data = d['data']
keys = ['today_orders', 'kanban_delivered', 'kanban_delivering', 'kanban_pending']
for k in keys:
    print(k, '=', data.get(k))
print()
for p in data.get('platform_stats', [])[:2]:
    print(p.get('name'), 'score=', p.get('composite_score'), 'reason=', p.get('route_reason'))
print()
for c in data.get('compensation_list', [])[:2]:
    print(c.get('order_no'), c.get('coupon_code'), c.get('reviewed_by'), c.get('reviewed_at'), c.get('related_settlement_no'))
print()
for a in data.get('after_sales_list', [])[:2]:
    print(a.get('order_no'), a.get('type'), a.get('sync_status_text'), a.get('related_settlement_no'))
