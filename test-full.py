import urllib.request
import json

def test(name, url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        result = json.loads(resp.read())
        print(f'  ✓ {name}')
        return result
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'  ✗ {name}: HTTP {e.code} - {body[:100]}')
        return None
    except Exception as e:
        print(f'  ✗ {name}: {e}')
        return None

BASE = 'http://127.0.0.1:50991/api'
print('=== 通过Vite代理验证完整业务链路 ===\n')

print('1. 基础接口')
test('健康检查', f'{BASE}/health')
print()

print('2. 新人用户流程')
result = test('新人登录', f'{BASE}/auth/login', 'POST', {'phone':'13800138001','password':'123456'})
ct = result['token'] if result else None
if ct:
    test('获取新人资料', f'{BASE}/couple/profile', token=ct)
    cp = test('获取预算', f'{BASE}/couple/budget', token=ct)
    test('获取时间轴', f'{BASE}/couple/timeline', token=ct)
    test('获取备婚攻略', f'{BASE}/guides', token=ct)
    svcs = test('获取服务列表', f'{BASE}/services', token=ct)
    test('获取订单', f'{BASE}/orders', token=ct)
print()

print('3. 商家用户流程')
result = test('商家登录', f'{BASE}/auth/login', 'POST', {'phone':'13800138002','password':'123456'})
mt = result['token'] if result else None
if mt:
    test('商家资料', f'{BASE}/merchant/profile', token=mt)
    test('商家工作台', f'{BASE}/merchant/dashboard', token=mt)
    test('商家案例', f'{BASE}/merchant/cases', token=mt)
    test('商家档期', f'{BASE}/merchant/schedules', token=mt)
    test('商家评价', f'{BASE}/merchant/reviews', token=mt)
    test('商家订单', f'{BASE}/orders', token=mt)
print()

print('4. 管理员流程')
result = test('管理员登录', f'{BASE}/auth/login', 'POST', {'phone':'13800138000','password':'123456'})
at = result['token'] if result else None
if at:
    test('平台统计', f'{BASE}/admin/stats', token=at)
    test('商家列表', f'{BASE}/admin/merchants', token=at)
    test('信用分', f'{BASE}/admin/credit/scores', token=at)
    test('趋势', f'{BASE}/admin/trends', token=at)
    test('漏斗', f'{BASE}/admin/funnel', token=at)
print()

print('5. 创建订单测试')
if ct:
    result = test('创建订单', f'{BASE}/orders', 'POST', {
        'merchant_id': 1,
        'service_id': 1,
        'service_name': '测试婚纱摄影套餐',
        'service_type': '婚纱摄影',
        'total_amount': 8888,
        'deposit_amount': 2000,
        'order_date': '2026-10-01'
    }, token=ct)
    if result and result.get('id'):
        oid = result['id']
        print(f'    订单ID: {oid}, 订单号: {result.get("order_no")}')
        
        if mt:
            test('确认订单', f'{BASE}/orders/{oid}/confirm', 'PUT', token=mt)
            test('标记到店', f'{BASE}/orders/{oid}/visit', 'PUT', token=mt)
            test('标记交付', f'{BASE}/orders/{oid}/deliver', 'PUT', token=mt)
            test('评价订单', f'{BASE}/orders/{oid}/review', 'PUT', {
                'rating': 5,
                'content': '非常满意，服务很棒！'
            }, token=ct)

print('\n=== 验证完成 ===')
