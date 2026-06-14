#!/usr/bin/env python3
import requests
import json

PORT = 61069
BASE = f'http://127.0.0.1:{PORT}/api'

print("=" * 60)
print("猎头平台 V2 API 验证 (端口 61069)")
print("=" * 60)

# 1. 登录
print("\n1. 登录测试")
login = requests.post(f'{BASE}/auth/login', json={'username': 'admin', 'password': 'admin123'}, timeout=3)
print(f"   状态码: {login.status_code}")
data = login.json()
token = data.get('token')
if not token:
    print(f"   错误: {data}")
    exit(1)
print(f"   登录成功, token: {token[:50]}...")
h = {'Authorization': f'Bearer {token}'}

# 2. 统计接口
print("\n2. 统计接口 /recommendations/stats")
stats = requests.get(f'{BASE}/recommendations/stats', headers=h, timeout=3).json()
print(f"   结果: {json.dumps(stats, ensure_ascii=False)}")

# 3. 列表接口
print("\n3. 列表接口 /recommendations")
lst = requests.get(f'{BASE}/recommendations?page=1&pageSize=20', headers=h, timeout=3)
print(f"   状态码: {lst.status_code}")
lst_data = lst.json()
print(f"   响应类型: {type(lst_data)}")
if isinstance(lst_data, dict):
    print(f"   响应键: {list(lst_data.keys())}")
    for k, v in lst_data.items():
        if isinstance(v, list):
            print(f"   {k}: 共 {len(v)} 条")
        else:
            print(f"   {k}: {v}")
    
    if 'list' in lst_data and lst_data['list']:
        item = lst_data['list'][0]
        print(f"\n4. 新增字段检查")
        new_fields = [
            'commission_installments', 'latest_review_note', 'latest_interview',
            'latest_probation_feedback', 'interview_count', 'probation_feedback_count',
            'contract_hash', 'latest_transaction', 'referrer_hit_rate', 'referrer_exposure_weight'
        ]
        for f in new_fields:
            v = item.get(f, 'MISSING')
            status = '✓' if v != 'MISSING' and v is not None else '✗'
            if isinstance(v, str) and len(v) > 60:
                v = v[:57] + '...'
            print(f"   {status} {f}: {v}")

# 4. 口径一致性检查
print("\n5. 口径一致性检查")
stats_total = stats.get('total', -1)
list_total = lst_data.get('total', -1) if isinstance(lst_data, dict) else -1
print(f"   /stats total: {stats_total}")
print(f"   /recommendations total: {list_total}")
print(f"   一致: {'✓' if stats_total == list_total else '✗'}")

# 5. 状态筛选一致性
print("\n6. 状态筛选一致性 (pending)")
pending_stats = requests.get(f'{BASE}/recommendations/stats?status=pending', headers=h, timeout=3).json()
pending_list = requests.get(f'{BASE}/recommendations?status=pending&page=1&pageSize=20', headers=h, timeout=3).json()
print(f"   /stats?status=pending total: {pending_stats.get('total', -1)}")
print(f"   /recommendations?status=pending total: {pending_list.get('total', -1)}")
print(f"   一致: {'✓' if pending_stats.get('total') == pending_list.get('total') else '✗'}")

# 6. 命中率筛选
print("\n7. 命中率筛选")
hr_stats = requests.get(f'{BASE}/recommendations/stats?min_hit_rate=0', headers=h, timeout=3).json()
hr_list = requests.get(f'{BASE}/recommendations?min_hit_rate=0&page=1&pageSize=20', headers=h, timeout=3).json()
print(f"   /stats?min_hit_rate=0 total: {hr_stats.get('total', -1)}")
print(f"   /recommendations?min_hit_rate=0 total: {hr_list.get('total', -1)}")
print(f"   一致: {'✓' if hr_stats.get('total') == hr_list.get('total') else '✗'}")

print("\n" + "=" * 60)
print("验证完成!")
print("=" * 60)
