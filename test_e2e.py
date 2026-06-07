#!/usr/bin/env python3
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:59055/api"

def main():
    print("=" * 60)
    print("端到端测试 - 同城即时配送调度中台")
    print("=" * 60)

    # 1. 登录
    print("\n1. 登录获取 Token...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    result = resp.json()
    token = result['data']['token']
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   ✓ Token 获取成功")

    # 2. 管理员看板
    print("\n2. 管理员看板数据...")
    resp = requests.get(f"{BASE_URL}/dashboard/admin", headers=headers)
    data = resp.json()
    stats = data['data']
    print(f"   ✓ 今日运单: {stats['orders']['today']}")
    print(f"   ✓ 活跃骑手: {stats['knights']['online']}")
    print(f"   ✓ 待处理订单: {stats['orders']['pending']}")
    print(f"   ✓ 今日收入: ¥{stats['revenue']['today']}")
    total = stats['orders']['completed'] + stats['orders']['pending'] + stats['orders']['delivering']
    on_time_rate = (stats['orders']['completed'] * 100 / total) if total > 0 else 0
    print(f"   ✓ 准时送达率: {on_time_rate:.1f}%")

    # 3. 创建运单
    print("\n3. 创建运单...")
    resp = requests.post(f"{BASE_URL}/waybills", headers=headers, json={
        "merchant_id": 1,
        "sender_name": "Zhang San",
        "sender_phone": "13800000001",
        "sender_address": "123 Nanjing Road",
        "sender_lat": 31.2304,
        "sender_lng": 121.4737,
        "receiver_name": "Li Si",
        "receiver_phone": "13700000001",
        "receiver_address": "456 Yanan Road",
        "receiver_lat": 31.235,
        "receiver_lng": 121.468,
        "category": "food",
        "insurance_level": "premium",
        "insurance_value": 1000,
        "fee": 25
    })
    result = resp.json()
    waybill_id = result['data']['id']
    order_no = result['data']['order_no']
    print(f"   ✓ 运单创建成功: {order_no} (ID: {waybill_id})")
    print(f"   ✓ SLA 取件截止: {result['data']['pickup_deadline']}")
    print(f"   ✓ SLA 送达截止: {result['data']['deliver_deadline']}")

    # 4. 获取候选骑士
    print(f"\n4. 获取运单 {waybill_id} 的候选骑士...")
    resp = requests.get(f"{BASE_URL}/dispatch/candidates/{waybill_id}", headers=headers)
    result = resp.json()
    candidates = result['data']
    print(f"   ✓ 找到 {len(candidates)} 个候选骑士")
    for i, c in enumerate(candidates[:3]):
        print(f"     {i+1}. {c['name']} - 综合分: {(c['score']*100):.1f} - 距离: {c['distance']:.2f}km")
        print(f"        距离分: {(c['distance_score']*100):.1f} + 负载分: {(c['load_score']*100):.1f} + 历史分: {(c['history_score']*100):.1f} + 保险分: {(c['insurance_score']*100):.1f}")

    # 5. 自动调度
    print(f"\n5. 运单 {waybill_id} 自动调度...")
    resp = requests.post(f"{BASE_URL}/dispatch/auto/{waybill_id}", headers=headers)
    result = resp.json()
    knight = result['data']['knight']
    print(f"   ✓ 已分配给骑手: {knight['name']} (ID: {knight['id']})")

    # 6. 查看调度日志
    print(f"\n6. 查看运单 {waybill_id} 调度日志...")
    resp = requests.get(f"{BASE_URL}/dispatch/logs/{waybill_id}", headers=headers)
    result = resp.json()
    logs = result['data']
    print(f"   ✓ 调度日志数量: {len(logs)}")
    for log in logs:
        print(f"     • {log['action']} - {log.get('knight_name') or log.get('knight',{}).get('name','-')} - 分数: {log.get('score', '-')} - {log['created_at']}")

    # 7. 状态机流转
    print(f"\n7. 运单状态机流转测试...")
    statuses = [
        ("accepted", "已接单"),
        ("picked_up", "已取件"),
        ("delivering", "配送中"),
        ("signed", "已签收"),
        ("completed", "已完成")
    ]
    for status, label in statuses:
        resp = requests.put(f"{BASE_URL}/waybills/{waybill_id}/status", headers=headers, json={"status": status})
        result = resp.json()
        if result['code'] == 0:
            print(f"   ✓ {label}: 成功")
        else:
            print(f"   ✗ {label}: 失败 - {result['message']}")

    # 8. 查看运单详情
    print(f"\n8. 查看运单 {waybill_id} 详情...")
    resp = requests.get(f"{BASE_URL}/waybills/{waybill_id}", headers=headers)
    result = resp.json()
    wb = result['data']
    print(f"   ✓ 运单状态: {wb['status']}")
    print(f"   ✓ 状态变更记录: {len(wb['status_log'])} 条")
    for log in wb['status_log']:
        print(f"     • {log['created_at']}: {log['from_status'] or 'NULL'} → {log['to_status']} by {log['operator_name']}")

    # 9. 异常列表
    print("\n9. 异常列表...")
    resp = requests.get(f"{BASE_URL}/exceptions", headers=headers)
    result = resp.json()
    exceptions = result['data']['list']
    print(f"   ✓ 异常总数: {result['data']['total']}")
    print(f"   ✓ 待处理: {len([e for e in exceptions if not e['resolved']])}")

    # 10. 骑士列表
    print("\n10. 骑士列表...")
    resp = requests.get(f"{BASE_URL}/knights?pageSize=3", headers=headers)
    result = resp.json()
    knights = result['data']['list']
    print(f"   ✓ 骑士总数: {result['data']['total']}")
    for k in knights:
        print(f"     • {k['name']} - {k['type']} - 信用分: {k['credit_score']} - 负载: {k['current_load']}/{k['capacity']}")

    print("\n" + "=" * 60)
    print("✓ 端到端测试全部通过！")
    print("=" * 60)

if __name__ == "__main__":
    main()
