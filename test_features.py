import requests
import json
import sqlite3
import os

BASE_URL = "http://127.0.0.1:56931/api"
PROJECT_DIR = "/Users/chen/Documents/trae_projects/local_projects/may-86931"
DB_PATH = os.path.join(PROJECT_DIR, "data/app.sqlite")

def update_company_auth(status):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE companies SET auth_status = ? WHERE id = 1", (status,))
    conn.commit()
    conn.close()

print("=" * 60)
print("1. 职位发布拦截测试")
print("=" * 60)

# 测试1: 企业未认证拦截
print("\n--- 测试1: 企业未认证拦截 ---")
update_company_auth("pending")
response = requests.put(f"{BASE_URL}/jobs/6/publish")
data = response.json()
if "error" in data:
    print(f"❌ 拦截成功: {data['error']}")
    print(f"   消息: {data['message']}")
else:
    print(f"✅ 发布成功: {data}")

# 恢复
update_company_auth("approved")
print("已恢复企业认证状态")

# 测试2: 未诊断职位拦截
print("\n--- 测试2: 未诊断职位拦截 ---")
response = requests.put(f"{BASE_URL}/jobs/1/publish")
data = response.json()
if "error" in data:
    print(f"❌ 拦截成功: {data['error']}")
    print(f"   消息: {data['message']}")
else:
    print(f"✅ 发布成功: {data}")

# 先诊断再发布
print("\n--- 测试3: 已诊断高分职位发布成功 ---")
requests.get(f"{BASE_URL}/jobs/6/diagnose")
response = requests.put(f"{BASE_URL}/jobs/6/publish")
data = response.json()
if data.get("success"):
    r = data["auditRecord"]
    print(f"✅ 发布成功!")
    print(f"   发布人: {r['publishedBy']}")
    print(f"   发布时间: {r['publishedAt']}")
    print(f"   合规评分: {r['complianceScore']}分")
    print(f"   薪资核验: {r['salaryVerified']}")
    print(f"   审批渠道: {r['channel']}")
else:
    print(f"❌ 发布失败: {data}")

print("\n" + "=" * 60)
print("2. 候选人相关数据测试")
print("=" * 60)

# 候选人列表
print("\n--- 候选人列表（中文离职原因）---")
response = requests.get(f"{BASE_URL}/candidates")
candidates = response.json()
for c in candidates[:3]:
    print(f"  {c['name']}: 离职原因={c['resignation_reason_display']}, 活跃度={c['job_activity_display']}")

# 候选人详情
print("\n--- 候选人详情（ID=1）---")
response = requests.get(f"{BASE_URL}/candidates/1")
c = response.json()
print(f"  姓名: {c['name']}")
print(f"  离职原因显示: {c['resignation_reason_display']}")
print(f"  活跃度显示: {c['job_activity_display']}")
print(f"  标签数量: {len(c['tags'])}")

# 相似人才
print("\n--- 相似人才（ID=1）---")
response = requests.get(f"{BASE_URL}/candidates/1/similar")
similar = response.json()
print(f"  找到 {len(similar)} 位相似人才:")
for s in similar[:3]:
    print(f"    {s['name']}: 相似度={s['similarity']:.0%}")

# 互动得分
print("\n--- 候选人互动得分（ID=1）---")
response = requests.get(f"{BASE_URL}/candidates/1/engagement")
eng = response.json()
print(f"  互动得分: {eng['score']}")
print(f"  浏览职位数: {eng['jobsViewed']}")
print(f"  总互动次数: {eng['totalActions']}")

# 邀约记录
print("\n--- 候选人邀约记录（ID=1）---")
response = requests.get(f"{BASE_URL}/invitations/candidate/1")
invitations = response.json()
print(f"  找到 {len(invitations)} 条邀约记录:")
for inv in invitations:
    print(f"    {inv['job_title']} - {inv['channel']} - {inv['status']}")

print("\n" + "=" * 60)
print("3. 人才库标签搜索测试")
print("=" * 60)

print("\n--- 搜索标签 'React' ---")
response = requests.post(f"{BASE_URL}/candidates/search", json={"tags": ["React"]})
results = response.json()
print(f"  找到 {len(results)} 位匹配人才:")
for r in results:
    print(f"    {r['name']}: {r['tech_stack'][:30]}...")

print("\n--- 搜索标签 'Java' ---")
response = requests.post(f"{BASE_URL}/candidates/search", json={"tags": ["Java"]})
results = response.json()
print(f"  找到 {len(results)} 位匹配人才:")
for r in results:
    print(f"    {r['name']}: {r['tech_stack'][:30]}...")

print("\n" + "=" * 60)
print("✓ 所有测试完成")
print("=" * 60)
