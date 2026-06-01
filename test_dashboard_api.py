import sys, json, urllib.request

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read().decode('utf-8'))

print("=== 1. 前端代理测试 (summary) ===")
d = get_json('http://127.0.0.1:43448/api/reports/summary')
print(f"司机合规率: {d['drivers']['compliance_rate']}% (共{d['drivers']['total']}人, 合规{d['drivers']['approved']}人)")
print(f"车辆合规率: {d['vehicles']['compliance_rate']}% (共{d['vehicles']['total']}辆, 合规{d['vehicles']['approved']}辆)")
print(f"订单抽查率: {d['orders']['check_rate']}% (共{d['orders']['total']}单, 已查{d['orders']['checked']}单)")
print(f"待处理投诉: {d['complaints']['pending']}件 (共{d['complaints']['total']}件)")
print(f"处罚金额: {d['penalties']['total_fine_amount']}元 (已缴{d['penalties']['paid_fine_amount']}元)")
print(f"执法案件: {d['cases']['total']}件 (待处理{d['cases']['pending']}件, 已结案{d['cases']['closed']}件)")

print("\n=== 2. 平台合规率明细 ===")
d = get_json('http://127.0.0.1:43448/api/reports/platform-compliance')
for p in d['data'][:4]:
    print(f"  {p['name']}: 司机合规率{p['driver_compliance_rate']}%, 车辆{p['vehicle_compliance_rate']}%, 司机{p['total_drivers']}人, 车辆{p['total_vehicles']}辆, 订单{p['total_orders']}单")

print("\n=== 3. 投诉类型分布 ===")
d = get_json('http://127.0.0.1:43448/api/reports/complaint-hotspots')
for c in d['data']:
    print(f"  {c['complaint_type']}: {c['count']}件, 待处理{c['pending_count']}件")

print("\n=== 4. 处罚金额统计 ===")
d = get_json('http://127.0.0.1:43448/api/reports/penalty-summary')
for p in d['by_platform']:
    print(f"  {p['platform_name']}: {p['count']}案件, 处罚{p['total_amount']}元")

print("\n=== 5. 区域风险分布 ===")
d = get_json('http://127.0.0.1:43448/api/reports/regional-risk')
for r in d['data']:
    print(f"  {r['region']}: 订单{r['total_orders']}, 异常{r['anomaly_count']}, 异常率{r['anomaly_rate']}%, 风险{r['risk_level']}")

print("\n=== 6. 证照到期预警 ===")
d = get_json('http://127.0.0.1:43448/api/reports/expiring-documents')
print(f"驾驶证即将到期: {len(d['drivers'])}人")
print(f"营运证即将到期: {len(d['vehicles'])}辆")
if d['drivers'][:1]:
    dr = d['drivers'][0]
    print(f"  样例: {dr['name']} ({dr['platform_name']}) 驾驶证到期 {dr['driver_license_expiry_date']}")
if d['vehicles'][:1]:
    vh = d['vehicles'][0]
    print(f"  样例: {vh['plate_no']} ({vh['platform_name']}) 营运证到期 {vh['operation_license_expiry_date']}")

print("\n=== 全部API测试通过 ===")
