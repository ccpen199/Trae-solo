#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse

BASE_URL = "http://127.0.0.1:59060"

def post(path, data, token=None):
    req = urllib.request.Request(
        BASE_URL + path,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read())

def put(path, data, token=None):
    req = urllib.request.Request(
        BASE_URL + path,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read())

def get(path, token=None):
    req = urllib.request.Request(BASE_URL + path)
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read())

print("=" * 60)
print("房产经纪人SaaS系统 - 主业务链路验证")
print("=" * 60)

passed = 0
failed = 0

def check(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"   ✓ {name}")
    else:
        failed += 1
        print(f"   ✗ {name} {detail}")

# 1. 经纪人登录
print("\n1. 经纪人登录")
resp = post('/api/auth/login', {'username': 'agent1', 'password': '123456'})
token = resp.get('token')
check("登录成功", resp.get('success') and token)
user = resp.get('user', {})
check("返回用户信息", user.get('name') == '王经纪')
check("角色正确", user.get('role') == 'agent')

# 2. 获取当前用户信息
print("\n2. 获取当前用户信息")
resp = get('/api/auth/me', token)
check("获取成功", resp.get('success'))
check("返回用户信息", resp.get('user', {}).get('cert_status') == 'certified')

# 3. 获取房源列表
print("\n3. 获取房源列表")
resp = get('/api/houses?pageSize=5', token)
check("获取成功", resp.get('success'))
check("有房源数据", 'data' in resp and len(resp['data']) > 0)
check("有总数", 'total' in resp and resp['total'] >= 6)

# 4. 获取客源列表
print("\n4. 获取客源列表")
resp = get('/api/clients?pageSize=5', token)
check("获取成功", resp.get('success'))
check("有客源数据", 'data' in resp and len(resp['data']) > 0)

# 5. LBS就近楼盘
print("\n5. LBS就近楼盘")
resp = get('/api/houses/nearby/list?lng=116.4&lat=39.9', token)
check("获取成功", resp.get('success'))
check("返回距离计算", 'data' in resp and len(resp['data']) > 0)
check("包含距离字段", 'distance' in resp['data'][0])

# 6. 创建房源
print("\n6. 创建新房源")
house_data = {
    'title': '测试房源·朝阳公园一居',
    'address': '北京市朝阳区朝阳公园南路1号',
    'price': 5800000,
    'unitType': 'sell',
    'houseType': '1室1厅',
    'area': 65,
    'lng': 116.48,
    'lat': 39.93
}
resp = post('/api/houses', house_data, token)
check("创建成功", resp.get('success'))
if resp.get('success'):
    house_id = resp['data']['id']
    check("返回房源ID", house_id > 0)
else:
    house_id = 1

# 7. 创建客源
print("\n7. 创建新客源")
client_data = {
    'name': '张先生',
    'phone': '13900001111',
    'intentType': 'buy',
    'budgetMin': 4000000,
    'budgetMax': 7000000,
    'preferredArea': '朝阳区'
}
resp = post('/api/clients', client_data, token)
check("创建成功", resp.get('success'))
if resp.get('success'):
    client_id = resp['data']['id']
    check("返回客源ID", client_id > 0)
else:
    client_id = 1

# 8. 为客源添加跟进记录
print("\n8. 为客源添加跟进记录")
followup_data = {'content': '客户明确表示想在朝阳公园附近购买一居室', 'type': 'visit'}
resp = post(f'/api/clients/{client_id}/followup', followup_data, token)
check("添加成功", resp.get('success'))

# 9. 查看客源详情
print("\n9. 查看客源详情")
resp = get(f'/api/clients/{client_id}', token)
check("获取成功", resp.get('success'))

# 10. 创建带看日程
print("\n10. 创建带看日程")
from datetime import datetime, timedelta
tomorrow = datetime.now() + timedelta(days=1)
start = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
end = start + timedelta(hours=1)
schedule_data = {
    'houseId': house_id, 'clientId': client_id,
    'startTime': start.isoformat(), 'endTime': end.isoformat()
}
resp = post('/api/schedules', schedule_data, token)
check("创建成功", resp.get('success'))
if resp.get('success'):
    schedule_id = resp['data']['id']
    check("返回带看ID", schedule_id > 0)
else:
    schedule_id = 1

# 11. 查看带看日程
print("\n11. 查看带看日程列表")
resp = get('/api/schedules?pageSize=10', token)
check("获取成功", resp.get('success'))

# 12. 创建交易
print("\n12. 创建交易")
transaction_data = {
    'title': '测试交易',
    'houseId': house_id, 'clientId': client_id,
    'totalAmount': 5800000, 'commissionRate': 0.025
}
resp = post('/api/transactions', transaction_data, token)
check("创建成功", resp.get('success'))
if resp.get('success'):
    tx_id = resp['data']['id']
    check("返回交易ID", tx_id > 0)
    check("佣金自动计算", resp['data'].get('commission_amount', 0) > 0)
else:
    tx_id = 1

# 13. 推进交易状态
print("\n13. 推进交易状态")
statuses = ['contract', 'loan', 'transfer', 'completed']
for status in statuses:
    resp = put(f'/api/transactions/{tx_id}/status', {'status': status}, token)
    if resp.get('success'):
        print(f"    - {status}: 成功")
check("状态推进成功", resp.get('success'))

# 14. 查看佣金台账
print("\n14. 查看佣金台账")
resp = get('/api/commissions?pageSize=10', token)
check("获取成功", resp.get('success'))

# 15. 总监登录
print("\n15. 总监登录")
resp = post('/api/auth/login', {'username': 'director', 'password': '123456'})
check("登录成功", resp.get('success'))
director_token = resp.get('token')
check("角色为总监", resp.get('user', {}).get('role') == 'director')

# 16. 查看审计日志
print("\n16. 查看审计日志")
resp = get('/api/audit/logs?pageSize=10', director_token)
check("获取成功", resp.get('success'))
check("有审计记录", resp.get('total', 0) > 0)

# 17. 组织架构树
print("\n17. 组织架构树")
resp = get('/api/orgs/tree', director_token)
check("获取成功", resp.get('success'))
check("有组织节点", len(resp.get('data', [])) > 0)

# 18. 组织成员列表
print("\n18. 组织成员列表")
resp = get('/api/orgs/members?pageSize=10', director_token)
check("获取成功", resp.get('success'))
check("有成员数据", len(resp.get('data', [])) > 0)

# 19. 住建委备案校验
print("\n19. 住建委备案校验")
verify_data = {'certNo': 'BJ20240615000123456'}
resp = post(f'/api/houses/{house_id}/verify', verify_data, director_token)
check("校验成功", resp.get('success'))
check("备案状态", resp.get('data', {}).get('cert_status') == 'verified')

# 20. 健康检查
print("\n20. 系统健康检查")
resp = get('/api/health')
check("健康检查通过", resp.get('success'))

print("\n" + "=" * 60)
print(f"测试完成：{passed} 通过 / {passed + failed} 总计")
if failed == 0:
    print("所有验证通过！主业务链路已调通。")
else:
    print(f"有 {failed} 项失败，请检查。")
print("=" * 60)

# 保存token
with open('/tmp/token.json', 'w') as f:
    json.dump({'agent_token': token, 'director_token': director_token}, f)
