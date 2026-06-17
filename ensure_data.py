#!/usr/bin/env python3
import requests
import sys

BASE = 'http://127.0.0.1:59220'

def main():
    admin_tok = requests.post(f'{BASE}/api/auth/login', json={'phone':'13800000000','password':'123456'}).json().get('token','')
    user_tok = requests.post(f'{BASE}/api/auth/login', json={'phone':'13900000000','password':'123456'}).json().get('token','')
    ha = {'Authorization': f'Bearer {admin_tok}'}
    hu = {'Authorization': f'Bearer {user_tok}'}

    # Check existing pending
    pending_before = requests.get(f'{BASE}/api/admin/audit/pending', headers=ha).json().get('posts', [])
    print(f'之前待审核: {len(pending_before)}')

    # Create pitfall post if needed
    r = requests.post(f'{BASE}/api/posts', headers=hu, json={
        'title': '避坑｜望京某网红咖啡店极差',
        'content': '被种草的这家网红咖啡店，结果大失所望。环境一般，性价比极低。',
        'type': 'REVIEW',
        'latitude': 39.9939, 'longitude': 116.4778,
        'locationName': '望京SOHO',
        'isPitfall': True,
        'priceAnchor': 48,
        'hasProof': True,
    })
    print('创建避坑帖:', r.status_code)

    print('\n=== 当前状态 ===')
    pending = requests.get(f'{BASE}/api/admin/audit/pending', headers=ha).json().get('posts', [])
    print(f'待审核: {len(pending)}条')

    feed = requests.get(f'{BASE}/api/posts/feed', params={'latitude':39.9939,'longitude':116.4778,'limit':30}).json().get('posts', [])
    levels = set(p.get('sourceLevel') for p in feed)
    risks = set()
    for p in feed:
        for l in p.get('auditLogs', []) or []:
            if l.get('riskLevel'):
                risks.add(l.get('riskLevel'))
    has_pitfall = any(p.get('isPitfall') for p in feed)
    print(f'Feed: {len(feed)}篇, 信源: {levels}, 避坑帖: {has_pitfall}, 风险: {risks}')

if __name__ == '__main__':
    main()
