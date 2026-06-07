#!/usr/bin/env python3
import urllib.request
import json

BASE = 'http://127.0.0.1:50991/api'

def req(path, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f'{BASE}{path}', data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()) if e.read() else {}
    except Exception as e:
        return 0, {'error': str(e)}

print('=' * 60)
print('婚庆 SaaS 平台登录链路完整诊断')
print('=' * 60)

# 1. 健康检查
print('\n1. 后端健康检查')
code, data = req('/health')
print(f'   状态: {code} - {data.get("status", "FAIL")}')

# 2. 新人登录
print('\n2. 新人登录流程')
code, data = req('/auth/login', 'POST', {'phone': '13800138001', 'password': '123456'})
if code == 200:
    print(f'   ✓ 登录成功 - 用户: {data["user"]["name"]} 角色: {data["user"]["role"]}')
    token = data['token']
    code, prof = req('/couple/profile', token=token)
    if code == 200:
        print(f'   ✓ 新人资料 - 婚期: {prof.get("wedding_date", "-")} 预算: ¥{prof.get("budget_total", 0):,}')
    else:
        print(f'   ✗ 新人资料失败: HTTP {code}')
else:
    print(f'   ✗ 登录失败: HTTP {code} - {data.get("message", "")}')

# 3. 商家登录
print('\n3. 商家登录流程')
code, data = req('/auth/login', 'POST', {'phone': '13800138002', 'password': '123456'})
if code == 200:
    print(f'   ✓ 登录成功 - 用户: {data["user"]["name"]} 角色: {data["user"]["role"]}')
    token = data['token']
    code, dash = req('/merchant/dashboard', token=token)
    if code == 200:
        print(f'   ✓ 商家工作台 - 订单: {dash.get("total_orders", 0)} 营收: ¥{dash.get("total_revenue", 0):,}')
    else:
        print(f'   ✗ 商家工作台失败: HTTP {code}')
else:
    print(f'   ✗ 登录失败: HTTP {code} - {data.get("message", "")}')

# 4. 管理员登录
print('\n4. 管理员登录流程')
code, data = req('/auth/login', 'POST', {'phone': '13800138000', 'password': '123456'})
if code == 200:
    print(f'   ✓ 登录成功 - 用户: {data["user"]["name"]} 角色: {data["user"]["role"]}')
    token = data['token']
    code, stats = req('/admin/stats', token=token)
    if code == 200:
        print(f'   ✓ 平台统计 - 用户: {stats.get("total_users", 0)} 商家: {stats.get("total_merchants", 0)} 订单: {stats.get("total_orders", 0)}')
    else:
        print(f'   ✗ 平台统计失败: HTTP {code}')
else:
    print(f'   ✗ 登录失败: HTTP {code} - {data.get("message", "")}')

# 5. 错误场景诊断
print('\n5. 错误场景诊断')
code, data = req('/auth/login', 'POST', {'phone': '13800138001', 'password': 'wrong'})
print(f'   密码错误: HTTP {code} - {data.get("message", "")}')

code, data = req('/auth/login', 'POST', {'phone': '13999999999', 'password': '123456'})
print(f'   未注册账号: HTTP {code} - {data.get("message", "")}')

code, data = req('/auth/login', 'POST', {'phone': '123', 'password': '123'})
print(f'   格式错误: HTTP {code} - {data.get("message", "")}')

# 6. Token 验证
print('\n6. Token 权限验证')
code, data = req('/auth/login', 'POST', {'phone': '13800138001', 'password': '123456'})
if code == 200:
    token = data['token']
    code, res = req('/admin/stats', token=token)  # 新人访问管理页
    print(f'   新人越权访问管理后台: HTTP {code}')
    if code == 403:
        print(f'   ✓ 权限拦截正常')
    else:
        print(f'   ⚠ 权限异常')

print('\n' + '=' * 60)
print('登录闭环诊断完成')
print('=' * 60)
print('\n✅ 可点击演示账号卡片进入对应工作台:')
print('   新人 → 婚礼倒计时/预算管理')
print('   商家 → 档期管理/订单处理')
print('   管理员 → 信用分/转化漏斗')
