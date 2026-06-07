#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://127.0.0.1:59066/api"

# 1. Login as admin
print("=" * 60)
print("1. LOGIN as admin")
print("=" * 60)
r = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
data = r.json()
token = data["token"]
print(f"✅ Token: {token[:40]}...")
print(f"✅ Role: {data['user']['role']}")
headers = {"Authorization": f"Bearer {token}"}

# 2. Statistics
print("\n" + "=" * 60)
print("2. STATISTICS (数据概览)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/admin/statistics", headers=headers)
d = r.json()
print(f"✅ 用户总数: {d['users']['total']} (工人:{d['users']['workers']} 企业:{d['users']['enterprises']} 管理员:{d['users']['admins']})")
print(f"✅ 项目总数: {d['projects']['total']} (进行中:{d['projects']['active']})")
print(f"✅ 合同总数: {d['contracts']['total']} (已签署:{d['contracts']['signed']})")
print(f"✅ 待审核: 企业={d['pendingVerifications']['enterprises']} 认证={d['pendingVerifications']['certifications']}")
print(f"✅ 社保预警: {d['socialSecurity']['warnings']} (逾期:{d['socialSecurity']['overdue']})")
print(f"✅ 今日考勤: {d['attendance']['today']} 人次")
print(f"✅ 工资发放: {d['payrolls']['total']} 条, 总额: {d['payrolls']['totalAmount']} 元")
print(f"✅ 生物特征录入: {d['biometrics']['enrolled']} 人")

# 3. User Management
print("\n" + "=" * 60)
print("3. USER MANAGEMENT (用户管理)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/admin/users?page=1&pageSize=5", headers=headers)
print(f"HTTP Status: {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"✅ 总数: {d['total']}")
    print(f"✅ 字段包含: users={list(d.keys())}")
    for u in d['users'][:5]:
        role_info = f"技能等级:{u.get('skillLevel', 0)}" if u['role'] == 'worker' else f"企业:{u.get('companyName', '-')}"
        print(f"   {u['id']}. {u['username']} ({u['role']}) - {u.get('realName', '-')} - 状态:{u['status']} - {role_info}")
else:
    print(f"❌ 错误: {r.text}")

# 4. Certification List
print("\n" + "=" * 60)
print("4. CERTIFICATION LIST (认证审核)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/certifications?page=1&pageSize=5", headers=headers)
print(f"HTTP Status: {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"✅ 总数: {d['total']}")
    for c in d['certifications'][:5]:
        print(f"   {c['id']}. {c.get('workerName', '-')} - {c.get('gbName', c['certificateType'])} - {c['certificateNumber']} - 状态:{c['verificationStatus']}")
else:
    print(f"❌ 错误: {r.text}")

# 5. Project List
print("\n" + "=" * 60)
print("5. PROJECT LIST (项目管理)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/projects?page=1&pageSize=5", headers=headers)
print(f"HTTP Status: {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"✅ 类型: {type(d).__name__}")
    if isinstance(d, dict):
        print(f"✅ 总数: {d['total']}")
        projects = d['projects']
    else:
        print(f"⚠️  返回list，共 {len(d)} 条")
        projects = d
    for p in projects[:5]:
        status_map = {'planning': '规划中', 'approved': '已立项', 'started': '已开工', 'under_construction': '在建', 'completed': '已竣工'}
        status = status_map.get(p.get('status', ''), p.get('status', ''))
        print(f"   {p['id']}. {p.get('projectName', p.get('project_name', ''))} - 状态:{status} - 预算:{p.get('budget', 0)}元 - 工人数:{p.get('workerCount', p.get('worker_count', 0))}")
else:
    print(f"❌ 错误: {r.text}")

# 6. Biometric Deletion Logs
print("\n" + "=" * 60)
print("6. BIOMETRIC DELETION LOGS (生物特征删除凭证)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/admin/biometric/logs?page=1&pageSize=5", headers=headers)
print(f"HTTP Status: {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"✅ 总数: {d['total']}")
    for log in d['logs'][:5]:
        data_types = json.loads(log.get('dataTypes', log.get('data_types', '[]')))
        print(f"   {log['id']}. 工人:{log.get('workerName', log.get('worker_name', '-'))} - 原因:{log.get('deletionReason', log.get('deletion_reason', '-'))} - 类型:{data_types} - 操作人:{log.get('operatorName', log.get('operator_name', '-'))}")
else:
    print(f"❌ 错误: {r.text}")

# 7. Social Security Warnings
print("\n" + "=" * 60)
print("7. SOCIAL SECURITY WARNINGS (社保预警)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/admin/social-security/warnings?page=1&pageSize=5", headers=headers)
print(f"HTTP Status: {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"✅ 总数: {d['total']}")
    for w in d['warnings'][:5]:
        status_map = {'unpaid': '未缴纳', 'overdue': '逾期'}
        status = status_map.get(w.get('paymentStatus', w.get('payment_status', '')), w.get('paymentStatus', w.get('payment_status', '')))
        print(f"   {w['id']}. {w.get('workerName', w.get('worker_name', '-'))} - {w.get('insuranceMonth', w.get('insurance_month', '-'))} - 状态:{status} - 金额:{w.get('paymentAmount', w.get('payment_amount', 0))}元")
else:
    print(f"❌ 错误: {r.text}")

# 8. Audit Logs
print("\n" + "=" * 60)
print("8. AUDIT LOGS (审计日志)")
print("=" * 60)
r = requests.get(f"{BASE_URL}/admin/audit-logs?page=1&pageSize=5", headers=headers)
print(f"HTTP Status: {r.status_code}")
if r.status_code == 200:
    d = r.json()
    print(f"✅ 总数: {d['total']}")
    for log in d['logs'][:5]:
        print(f"   {log['id']}. {log.get('username', '-')} - {log.get('action', '-')} - {log.get('tableName', log.get('table_name', '-'))} - {log.get('createdAt', log.get('created_at', '-'))}")
else:
    print(f"❌ 错误: {r.text}")

print("\n" + "=" * 60)
print("✅ ALL TESTS COMPLETED")
print("=" * 60)
