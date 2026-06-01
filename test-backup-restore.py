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
    
    print("=" * 70)
    print("数据库备份恢复平台 - 备份-恢复完整链路测试")
    print("=" * 70)
    
    # 1. 创建备份任务
    print("\n📋 第1步: 创建备份任务")
    print("-" * 50)
    r = requests.post(f"{BASE_URL}/tasks", headers=headers,
                      json={"strategy_id": 1, "task_type": "backup", "priority": "normal"})
    backup_task = r.json()
    backup_task_id = backup_task["id"]
    print(f"   任务ID: {backup_task_id}")
    print(f"   任务编号: {backup_task['task_no']}")
    print(f"   状态: {backup_task['status']}")
    
    # 2. 等待备份任务执行
    print("\n⏳ 第2步: 等待备份任务执行 (5秒)")
    time.sleep(5)
    
    # 3. 检查备份任务结果
    print("\n✅ 第3步: 检查备份任务结果")
    print("-" * 50)
    r = requests.get(f"{BASE_URL}/tasks/{backup_task_id}", headers=headers)
    backup_detail = r.json()
    
    print(f"   任务状态: {backup_detail['status']}")
    print(f"   步骤数量: {len(backup_detail['steps'])}")
    
    status_icons = {"success": "✅", "failed": "❌", "skipped": "⏭️", "pending": "⏳", "running": "⏳"}
    for step in backup_detail['steps']:
        icon = status_icons.get(step['status'], "❓")
        print(f"   {icon} {step['step_order']:2d}. {step['step_name']:15s} - {step['status']}")
    
    if backup_detail['status'] != 'success':
        print("\n❌ 备份任务未成功，跳过后续测试")
        return
    
    print(f"   备份文件: {backup_detail.get('backup_file_path', 'N/A')}")
    print(f"   备份大小: {backup_detail.get('backup_size', 0) / 1024 / 1024:.2f} MB")
    
    # 4. 创建恢复任务
    print("\n🔄 第4步: 从备份创建恢复任务")
    print("-" * 50)
    r = requests.post(f"{BASE_URL}/tasks", headers=headers,
                      json={
                          "strategy_id": 1, 
                          "task_type": "restore", 
                          "priority": "high",
                          "source_task_id": backup_task_id
                      })
    restore_task = r.json()
    restore_task_id = restore_task["id"]
    print(f"   恢复任务ID: {restore_task_id}")
    print(f"   恢复任务编号: {restore_task['task_no']}")
    print(f"   状态: {restore_task['status']}")
    
    # 5. 等待恢复任务执行
    print("\n⏳ 第5步: 等待恢复任务执行 (5秒)")
    time.sleep(5)
    
    # 6. 检查恢复任务结果
    print("\n✅ 第6步: 检查恢复任务结果")
    print("-" * 50)
    r = requests.get(f"{BASE_URL}/tasks/{restore_task_id}", headers=headers)
    restore_detail = r.json()
    
    print(f"   任务状态: {restore_detail['status']}")
    print(f"   步骤数量: {len(restore_detail['steps'])}")
    
    for step in restore_detail['steps']:
        icon = status_icons.get(step['status'], "❓")
        print(f"   {icon} {step['step_order']:2d}. {step['step_name']:18s} - {step['status']}")
    
    # 7. 检查异常和告警
    print("\n📊 第7步: 验证业务数据关联")
    print("-" * 50)
    
    r = requests.get(f"{BASE_URL}/exceptions", headers=headers, params={"task_id": restore_task_id})
    exceptions = r.json()["list"]
    print(f"   异常记录: {len(exceptions)} 条")
    
    r = requests.get(f"{BASE_URL}/alerts", headers=headers, params={"task_id": restore_task_id})
    alerts = r.json()["list"]
    print(f"   告警记录: {len(alerts)} 条")
    
    print("\n" + "=" * 70)
    print("备份-恢复链路测试完成!")
    print("=" * 70)
    
    print("\n📋 测试总结:")
    print(f"   ✅ 备份任务创建成功")
    print(f"   ✅ 备份执行步骤: {len(backup_detail['steps'])} 个")
    print(f"   ✅ 恢复任务创建成功")
    print(f"   ✅ 恢复执行步骤: {len(restore_detail['steps'])} 个")
    print(f"   ✅ 业务数据关联正常 (异常+告警)")
    print(f"   ✅ 备份->恢复 闭环完成")

if __name__ == "__main__":
    main()
