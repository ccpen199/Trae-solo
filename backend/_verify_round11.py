import urllib.request, json

# 1. 验证订单5详情（超时订单）
r = urllib.request.urlopen('http://127.0.0.1:59214/api/orders/5').read()
d = json.loads(r)['data']
print('=== 订单5 含补偿/售后/路由存档 ===')
print('  路由存档字段:', bool(d.get('route_reason')), '综合分:', d.get('route_composite_score'))
print('  路由参数:', d.get('route_distance'), 'km /', d.get('route_weight'), 'kg /', d.get('route_urgency'), '/选择方:', d.get('route_selected_by'))
print('  route_reason:', (d.get('route_reason') or '')[:50])
sd = d.get('route_score_detail')
if isinstance(sd, dict):
    print('  评分明细: 价格%.1f 时效%.1f 质量%.1f 运力%.1f' % (sd.get('price_score',0)*100, sd.get('time_score',0)*100, sd.get('quality_score',0)*100, sd.get('saturation_score',0)*100))
print('  compensations:', len(d.get('compensations') or []))
for c in (d.get('compensations') or []):
    print('     - 券%s 金额%.2f %s 复查人:%s 结论:%s' % (c.get('coupon_code'), c.get('amount') or 0, c.get('status'), c.get('reviewed_by') or '-', (c.get('review_result') or '')[:20]))
print('  after_sales:', len(d.get('after_sales') or []))
for a in (d.get('after_sales') or []):
    print('     - 类型:%s 同步:%s / %s 处置结果:%s' % (a.get('type'), a.get('sync_status'), a.get('sync_status_text'), (a.get('disposal_result') or '')[:20]))
print()

# 2. 订单列表
r2 = urllib.request.urlopen('http://127.0.0.1:59214/api/orders?page=1&pageSize=5').read()
d2 = json.loads(r2)
has_rt = sum(1 for o in d2['data'] if o.get('route_reason'))
print('=== 订单列表路由存档 ===')
print('  总数:', d2.get('total'), '有路由存档:', has_rt)
for o in d2['data']:
    print('  -', o.get('order_no'), o.get('platform_name'), 'route_score=', o.get('route_composite_score'))
print()

# 3. reconcile 接口
import urllib.request as ur
req = ur.Request('http://127.0.0.1:59214/api/settlements/3/reconcile',
    data=json.dumps({'matched': False, 'diff_type': 'compensation', 'diff_amount': 42.5, 'diff_remark': '3笔赔付差异待确认', 'reconciled_by': '运营-张主管'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}, method='POST')
r3 = ur.urlopen(req).read()
d3 = json.loads(r3)['data']
print('=== 对账接口 ===')
print('  is_matched:', d3.get('is_matched'), '复核人:', d3.get('reconciled_by'))
print('  差异类型:', d3.get('diff_type'), '差异金额:', d3.get('diff_amount'))
print('  处理时间:', d3.get('reconciled_at'), '备注:', (d3.get('diff_remark') or '')[:20])
