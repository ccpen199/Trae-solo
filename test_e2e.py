#!/usr/bin/env python3
import requests
import json

BASE = 'http://127.0.0.1:43430/api'

def test_login(name, phone, password):
    print(f'\n=== 测试{name}登录 ===')
    try:
        r = requests.post(f'{BASE}/auth/login', 
                         json={'phone': phone, 'password': password},
                         timeout=5)
        if r.ok:
            data = r.json()
            print(f'  ✓ 登录成功: {data["user"]["nickname"]} ({data["user"]["role"]})')
            return data['token'], data['user']
        else:
            print(f'  ✗ 登录失败: {r.status_code} {r.text}')
            return None, None
    except Exception as e:
        print(f'  ✗ 异常: {e}')
        return None, None

def test_api(name, method, path, token=None, json_data=None, should_print=True):
    print(f'\n--- {name} ---')
    try:
        headers = {}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        if method == 'GET':
            r = requests.get(f'{BASE}{path}', headers=headers, timeout=5)
        else:
            r = requests.post(f'{BASE}{path}', headers=headers, json=json_data, timeout=5)
        if r.ok:
            if should_print:
                print(f'  ✓ 成功')
            return r.json()
        else:
            print(f'  ✗ 失败: {r.status_code} {r.text[:100]}')
            return None
    except Exception as e:
        print(f'  ✗ 异常: {e}')
        return None

print('=' * 60)
print('新能源充电桩平台 - 端到端 API 验证')
print('=' * 60)

# 测试车主端完整流程
owner_token, owner_user = test_login('车主', '13800000003', 'user1234')
if owner_token:
    test_api('获取站点列表', 'GET', '/stations', owner_token)
    stations = test_api('获取站点详情', 'GET', '/stations/1', owner_token)
    if stations and stations.get('guns'):
        idle_gun = next((g for g in stations['guns'] if g['status'] == 'idle'), None)
        if idle_gun:
            print(f'  选择空闲枪: {idle_gun["gun_no"]}')
            reserve = test_api('预约充电枪', 'POST', '/charging/reserve', owner_token,
                              {'station_id': 1, 'gun_id': idle_gun['id'], 'reserve_minutes': 30})
            if reserve and reserve.get('reservation'):
                start = test_api('启动充电', 'POST', '/charging/start', owner_token,
                                {'station_id': 1, 'gun_id': idle_gun['id'], 'start_soc': 20})
                if start and start.get('order'):
                    order_id = start['order']['id']
                    import time
                    time.sleep(1)
                    test_api('停止充电', 'POST', f'/charging/{order_id}/stop', owner_token, {'end_soc': 80})
                    test_api('支付订单', 'POST', f'/charging/{order_id}/pay', owner_token, {'payment_method': 'balance'})
    test_api('获取订单列表', 'GET', '/charging/orders', owner_token)

# 测试运营端完整流程
admin_token, admin_user = test_login('管理员', '13800000001', 'admin123')
if admin_token:
    test_api('运营概览', 'GET', '/analytics/overview', admin_token)
    test_api('设备列表', 'GET', '/operations/chargers', admin_token)
    test_api('告警列表', 'GET', '/operations/alarms', admin_token)
    test_api('工单列表', 'GET', '/operations/work-orders', admin_token)
    test_api('运营分析', 'GET', '/analytics/revenue', admin_token)

# 测试运营商登录
op_token, op_user = test_login('运营商', '13800000002', 'op123456')
if op_token:
    test_api('运营商查看设备', 'GET', '/operations/chargers', op_token)

print('\n' + '=' * 60)
print('验证完成!')
print('=' * 60)
