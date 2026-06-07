import requests
BASE_URL = 'http://127.0.0.1:59043'

def login(u, p):
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'username':u,'password':p})
    return r.json()['data']['token']

def test_dashboard(u, p, name):
    tok = login(u, p)
    r = requests.get(f'{BASE_URL}/api/energy/dashboard', headers={'Authorization':f'Bearer {tok}'})
    d = r.json()['data']
    print(f'\n=== {name} Dashboard ===')
    print(f'客群类型: {d.get("customerType")}, 管理员: {d.get("isAdmin")}')
    print(f'包含电表数据: {d.get("meterRealtime") is not None}')
    if d.get('meterRealtime'):
        mr = d['meterRealtime']
        print(f'  读数: {mr.get("reading_kwh") or mr.get("readingKwh")} kWh, 电压: {mr.get("voltage")} V')
    print(f'包含气象数据: {d.get("weather") is not None}')
    if d.get('weather'):
        w = d['weather']
        print(f'  温度: {w.get("temperature")}°C, 湿度: {w.get("humidity")}%')
    print(f'包含设备告警: {d.get("deviceAlerts") is not None and len(d.get("deviceAlerts", [])) > 0}')
    if d.get('deviceAlerts'):
        print(f'  告警数量: {len(d["deviceAlerts"])}')
    print(f'电价标准数据: {len(d.get("currentPrice", []))} 条')
    return d

test_dashboard('zhangsan','password123','个人用户')
test_dashboard('zhaofamily','password123','家庭用户')
test_dashboard('huawei_co','password123','企业用户')
test_dashboard('guangzhou_park','password123','园区用户')
test_dashboard('admin','password123','系统管理员')
