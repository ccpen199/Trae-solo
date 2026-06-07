import urllib.request
import json

def test_api(name, url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        result = json.loads(resp.read())
        print(f'✓ {name}')
        return result
    except Exception as e:
        print(f'✗ {name}: {e}')
        return None

BASE = 'http://127.0.0.1:50991/api'

print('=== 婚庆SaaS平台业务链路验证 ===\n')

# 1. 健康检查
test_api('后端健康检查', f'{BASE}/health')
print()

# 2. 新人登录
result = test_api('新人登录', f'{BASE}/auth/login', 'POST',
                   {'phone':'13800138001','password':'123456'})
couple_token = result['token'] if result else None
print(f'  用户: {result["user"]["name"] if result else "N/A"}')
print()

# 3. 新人资料
if couple_token:
    result = test_api('获取新人资料', f'{BASE}/couple/profile', token=couple_token)
    if result:
        print('  婚礼日期:', result.get('wedding_date', '未设置'))
        print('  总预算: ¥{:,}'.format(result.get('budget_total', 0)))
print()

# 4. 备婚攻略
if couple_token:
    result = test_api('获取备婚攻略', f'{BASE}/guides', token=couple_token)
    if result:
        print(f'  攻略数量: {len(result)} 条')
print()

# 5. 商家登录
result = test_api('商家登录', f'{BASE}/auth/login', 'POST',
                   {'phone':'13800138002','password':'123456'})
merchant_token = result['token'] if result else None
print(f'  商家: {result["user"]["name"] if result else "N/A"}')
print()

# 6. 商家工作台
if merchant_token:
    result = test_api('商家工作台统计', f'{BASE}/merchant/dashboard', token=merchant_token)
print()

# 7. 管理员登录
result = test_api('管理员登录', f'{BASE}/auth/login', 'POST',
                   {'phone':'13800138000','password':'123456'})
admin_token = result['token'] if result else None
print(f'  管理员: {result["user"]["name"] if result else "N/A"}')
print()

# 8. 平台统计
if admin_token:
    result = test_api('平台运营统计', f'{BASE}/admin/stats', token=admin_token)
    if result:
        print(f'  总用户: {result.get("total_users", 0)}')
        print(f'  总商家: {result.get("total_merchants", 0)}')
        print(f'  总订单: {result.get("total_orders", 0)}')
print()

print('=== 验证完成 ===')
