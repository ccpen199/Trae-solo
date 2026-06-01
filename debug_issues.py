import json, urllib.request, datetime, urllib.parse

def get(url):
    r = urllib.request.urlopen(url, timeout=5)
    return json.loads(r.read())

print('=== 1. 钱七司机数据 ===')
keyword = urllib.parse.quote('钱七')
drivers = get(f'http://127.0.0.1:53448/api/drivers?keyword={keyword}')
qianqi = None
for d in drivers['list']:
    qianqi = d
    print(f'  钱七(id={d["id"]}):')
    print(f'    驾驶证到期: {d["driver_license_expiry_date"]}')
    print(f'    从业资格证到期: {d["taxi_qualification_expiry_date"]}')
    print(f'    所属平台: {d["platform_id"]} ({d.get("platform_name","未知")})')
    today = datetime.date(2026,5,29)
    dl_expiry = datetime.date.fromisoformat(d['driver_license_expiry_date'])
    qf_expiry = datetime.date.fromisoformat(d['taxi_qualification_expiry_date'])
    print(f'    驾驶证已过期: {(today - dl_expiry).days}天')
    print(f'    从业资格证已过期: {(today - qf_expiry).days}天')

print('\n=== 2. 证照到期预警API ===')
exp = get('http://127.0.0.1:53448/api/reports/expiring-documents')
print(f'  驾驶证预警: {len(exp["drivers"])}人')
for d in exp['drivers']:
    print(f'    {d["name"]}: 驾驶证到期 {d["driver_license_expiry_date"]}')
print(f'  营运证预警: {len(exp["vehicles"])}辆')
for v in exp['vehicles']:
    print(f'    {v["plate_no"]}: 营运证到期 {v["operation_license_expiry_date"]}')

print('\n=== 3. 钱七详情关联数据 ===')
detail = get(f'http://127.0.0.1:53448/api/drivers/{qianqi["id"]}')
print(f'  关联车辆: {len(detail["vehicles"])}辆')
print(f'  历史订单: {len(detail["orders"])}单')
print(f'  投诉记录: {len(detail["complaints"])}条')
print(f'  案件记录: {len(detail["cases"])}件')
if detail['cases']:
    print(f'  案件样例: {json.dumps(detail["cases"][0], ensure_ascii=False, indent=6)}')
if detail['complaints']:
    print(f'  投诉样例: {json.dumps(detail["complaints"][0], ensure_ascii=False, indent=6)}')

print('\n=== 4. 首汽约车平台数据 ===')
pf = get('http://127.0.0.1:53448/api/platforms/5')
print(f'  平台名称: {pf["name"]}')
print(f'  许可证有效期: {pf.get("license_expiry_date","(空)")}')
print(f'  暂停原因: {pf.get("suspension_reason","(空)")}')
print(f'  整改要求: {pf.get("rectification_requirement","(空)")}')
print(f'  整改结果: {pf.get("rectification_result","(空)")}')
print(f'  复核备注: {pf.get("audit_remark","(空)")}')
print(f'  复核时间: {pf.get("audit_time","(空)")}')
print(f'  最后复核人: {pf.get("latest_audit_user","(空)")}')
print(f'  关联司机: {len(pf.get("drivers",[]))}人')
print(f'  关联车辆: {len(pf.get("vehicles",[]))}辆')
print(f'  关联订单: {len(pf.get("orders",[]))}单')
print(f'  关联投诉: {len(pf.get("complaints",[]))}条')
print(f'  关联案件: {len(pf.get("cases",[]))}件')
print(f'  变更记录: {len(pf.get("logs",[]))}条')
