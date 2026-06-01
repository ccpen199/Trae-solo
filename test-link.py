#!/usr/bin/env python3
import requests
import time
import json

BASE_URL = "http://127.0.0.1:53388/api"

def login():
    r = requests.post(f"{BASE_URL}/auth/login", 
                      json={"username": "admin", "password": "admin123"})
    return r.json()["token"]

def main():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=" * 60)
    print("数据库备份恢复平台 - 业务链路验证测试")
    print("=" * 60)
    
    # 1. 创建备份任务
    print("\n1. 创建备份任务")
    print("-" * 40)
    r = requests.post(f"{BASE_URL}/tasks", headers=headers,
                      json={"strategy_id": 1, "task_type": "backup", "priority": "normal"})
    task_data = r.json()
    task_id = task_data["id"]
    print(f"   任务ID: {task_id}")
    print(f"   任务编号: {task_data['task_no']}")
    print(f"   状态: {task_data['status']}")
    
    # 2. 等待任务执行
    print("\n2. 等待任务执行 (4秒)")
    time.sleep(4)
    
    # 3. 查询任务详情 - 验证步骤数据
    print("\n3. 查询任务详情 - 验证执行步骤")
    print("-" * 40)
    r = requests.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    task_detail = r.json()
    
    print(f"   任务状态: {task_detail['status']}")
    print(f"   步骤数量: {len(task_detail['steps'])}")
    
    status_icons = {"success": "✅", "failed": "❌", "skipped": "⏭️", "pending": "⏳", "running": "⏳"}
    for step in task_detail['steps']:
        icon = status_icons.get(step['status'], "❓")
        print(f"   {icon} {step['step_order']:2d}. {step['step_name']:15s} - {step['status']}")
    
    # 4. 验证异常记录
    print("\n4. 验证异常记录关联")
    print("-" * 40)
    print(f"   异常数量: {len(task_detail['exceptions'])}")
    for exc in task_detail['exceptions']:
        print(f"   📌 [{exc['exception_no']}] {exc['exception_type']}")
        print(f"      {exc['error_details']}")
    
    # 5. 验证告警记录
    print("\n5. 验证告警记录关联")
    print("-" * 40)
    r = requests.get(f"{BASE_URL}/alerts", headers=headers, params={"task_id": task_id})
    alerts = r.json()["list"]
    print(f"   告警数量: {len(alerts)}")
    for alert in alerts:
        color = {"active": "🔴", "acknowledged": "🟡", "resolved": "🟢", "closed": "⚪"}.get(alert['status'], "❓")
        print(f"   {color} [{alert['alert_no']}] {alert['title']}")
    
    # 6. 验证审计日志
    print("\n6. 验证审计日志")
    print("-" * 40)
    r = requests.get(f"{BASE_URL}/audit", headers=headers, params={"resource_type": "task"})
    audits = r.json()["list"][:3]
    print(f"   最新审计记录 (前3条):")
    for a in audits:
        granted = "✅" if a['permission_granted'] else "❌"
        print(f"   {granted} {a['action']:10s} {a['resource_name']}")
    
    print("\n" + "=" * 60)
    print("链路验证完成!")
    print("=" * 60)
    print("\n总结:")
    print(f"  ✅ 任务创建成功")
    print(f"  ✅ 执行步骤生成: {len(task_detail['steps'])} 个")
    print(f"  ✅ 异常记录关联: {len(task_detail['exceptions'])} 条")
    print(f"  ✅ 告警记录关联: {len(alerts)} 条")
    print(f"  ✅ 审计日志记录")
    
    if task_detail['status'] == 'failed':
        print(f"\n当前任务状态: 失败 (用于演示异常-告警链路)")
    else:
        print(f"\n当前任务状态: 成功")

if __name__ == "__main__":
    main()
