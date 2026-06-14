#!/usr/bin/env python3
import urllib.request, json

print('=== 端到端测试：快捷核验业务流程闭环 ===\n')

# 测试1：人脸核验（无service_record_id，应自动创建记录）
print('--- 测试1：人脸核验（自动创建记录）---')
data = json.dumps({'person_id': 3}).encode()
req = urllib.request.Request('http://127.0.0.1:58783/api/face-verify', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
d = json.loads(resp.read())
print(f'✅ 人脸核验通过: {d["verified"]}')
print(f'✅ 自动创建的记录ID: {d["service_record_id"]}')
print(f'✅ 记录已更新: {d["record_updated"]}')
print(f'✅ 静默认证记录: {len(d["silent_verify_records"])} 条')
print(f'✅ 状态变更: {d["person_update"]["old_status"]} → {d["person_update"]["new_status"]}')
print(f'✅ 可复查记录: {d["review_record"]["verify_id"]}')

record_id = d["service_record_id"]

# 验证办理记录已更新
print('\n--- 验证办理记录状态 ---')
req = urllib.request.Request(f'http://127.0.0.1:58783/api/service-records/{record_id}')
resp = urllib.request.urlopen(req)
record = json.loads(resp.read())
print(f'✅ 记录ID: {record["id"]}')
print(f'✅ 事项名称: {record["item_name"]}')
print(f'✅ 状态: {record["status"]}')
print(f'✅ 当前步骤: {record["current_step"]}')
print(f'✅ 人脸核验: {record["face_verified"]}')
print(f'✅ 材料预检: {record["material_checked"]}')
print(f'✅ 跨部门比对: {record["cross_dept_checked"]}')

# 测试2：材料预检（使用刚创建的记录ID）
print('\n--- 测试2：材料预检（回写已有记录）---')
data = json.dumps({
    'business_item_id': 3,
    'materials': [],
    'person_id': 3,
    'service_record_id': record_id
}).encode()
req = urllib.request.Request('http://127.0.0.1:58783/api/material-check', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
d = json.loads(resp.read())
print(f'✅ 材料预检完成: passed={d["passed"]}')
print(f'✅ 记录已更新: {d["record_updated"]}')
print(f'✅ 缺少材料: {len(d["missing"])} 项')
print(f'✅ 当前上下文: {d["current_context"]}')

# 测试3：跨部门比对（使用已有记录ID）
print('\n--- 测试3：跨部门比对（回写已有记录）---')
data = json.dumps({
    'person_id': 3,
    'verify_types': ['medical', 'tax', 'civil'],
    'business_item_id': 3,
    'service_record_id': record_id
}).encode()
req = urllib.request.Request('http://127.0.0.1:58783/api/cross-dept-verify', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
d = json.loads(resp.read())
print(f'✅ 跨部门比对通过: {d["verified"]}')
print(f'✅ 记录已更新: {d["record_updated"]}')
print(f'✅ 自动审核: {d["auto_approve"]}')
print(f'✅ 三部门结果: 医保={d["results"]["medical"]["status"]}, 税务={d["results"]["tax"]["status"]}, 民政={d["results"]["civil"]["status"]}')

# 最终验证办理记录
print('\n--- 最终验证办理记录 ---')
req = urllib.request.Request(f'http://127.0.0.1:58783/api/service-records/{record_id}')
resp = urllib.request.urlopen(req)
record = json.loads(resp.read())
print(f'✅ 记录ID: {record["id"]}')
print(f'✅ 人脸核验: {record["face_verified"]}')
print(f'✅ 材料预检: {record["material_checked"]}')
print(f'✅ 跨部门比对: {record["cross_dept_checked"]}')
print(f'✅ 比对结果: {record["cross_dept_result"]}')
print(f'✅ 审核步骤: {len(record["steps"])} 个')
for step in record['steps']:
    print(f'  - 步骤{step["step_order"]}: {step["step_name"]} = {step["status"]}')

print('\n✅ 端到端测试完成！业务流程闭环验证通过！')
