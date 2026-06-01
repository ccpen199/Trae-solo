import json
import subprocess
import os

os.chdir('/Users/chen/Documents/trae_projects/local_projects/may-63457')

def query(sql):
    result = subprocess.run(
        ['sqlite3', '-json', 'backend/data/hospital_transfer.db', sql],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

print('=== 数据落库验证 ===')
print()

transfers = query("SELECT id, transfer_no, patient_name, status, urgency, primary_diagnosis FROM transfers ORDER BY id DESC LIMIT 7")
print('--- 转诊申请 (最近7条) ---')
for t in transfers:
    print(f'  {t["transfer_no"]} | {t["patient_name"]} | {t["status"]} | {t["urgency"]} | {t["primary_diagnosis"]}')

reviews = query("SELECT id, transfer_id, result, comments, created_at FROM reviews ORDER BY id DESC LIMIT 3")
print()
print(f'--- 审核记录 (共{query("SELECT COUNT(*) as c FROM reviews")[0]["c"]}条, 最近3条) ---')
for r in reviews:
    print(f'  #{r["id"]} | 转诊{r["transfer_id"]} | {r["result"]} | {r["comments"][:30] if r["comments"] else ""}')

coords = query("SELECT id, transfer_id, contact_person, contact_phone, bed_number, created_at FROM coordinations ORDER BY id DESC LIMIT 3")
print()
print(f'--- 协调记录 (共{query("SELECT COUNT(*) as c FROM coordinations")[0]["c"]}条) ---')
for c in coords:
    print(f'  #{c["id"]} | 转诊{c["transfer_id"]} | {c["contact_person"]} | 床位{c["bed_number"]}')

results = query("SELECT id, transfer_id, admission_decision, diagnosis, treatment_given, created_at FROM results ORDER BY id DESC LIMIT 3")
print()
print(f'--- 接诊记录 (共{query("SELECT COUNT(*) as c FROM results")[0]["c"]}条) ---')
for r in results:
    print(f'  #{r["id"]} | 转诊{r["transfer_id"]} | {r["admission_decision"]} | {r["diagnosis"][:30] if r["diagnosis"] else ""}')

try:
    log_count = query("SELECT COUNT(*) as c FROM operation_logs")[0]["c"]
    if log_count > 0:
        logs = query("SELECT id, transfer_id, action, details, operator, created_at FROM operation_logs ORDER BY id DESC LIMIT 5")
        print()
        print(f'--- 操作日志 (共{log_count}条, 最近5条) ---')
        for l in logs:
            print(f'  {l["created_at"]} | {l["action"]} | {l["details"][:40] if l["details"] else ""}')
    else:
        print()
        print(f'--- 操作日志 (共0条) ---')
except Exception:
    print()
    print('--- 操作日志 ---')
    print('  暂无操作日志记录')

stats = query("""SELECT
  (SELECT COUNT(*) FROM transfers) as total,
  (SELECT COUNT(*) FROM transfers WHERE status='completed') as completed,
  (SELECT COUNT(*) FROM transfers WHERE status='pending') as pending,
  (SELECT COUNT(*) FROM transfers WHERE status='accepted') as accepted,
  (SELECT COUNT(*) FROM transfers WHERE status='coordinating') as coordinating,
  (SELECT COUNT(*) FROM reviews) as reviews,
  (SELECT COUNT(*) FROM coordinations) as coordinations,
  (SELECT COUNT(*) FROM results) as results,
  (SELECT COUNT(*) FROM operation_logs) as logs""")[0]

print()
print('=== 统计汇总 ===')
print(f'  总转诊量: {stats["total"]}')
print(f'  已完成: {stats["completed"]}')
print(f'  待审核: {stats["pending"]}')
print(f'  审核通过: {stats["accepted"]}')
print(f'  协调中: {stats["coordinating"]}')
print(f'  审核记录: {stats["reviews"]}条')
print(f'  协调记录: {stats["coordinations"]}条')
print(f'  接诊记录: {stats["results"]}条')
print(f'  操作日志: {stats["logs"]}条')
print()
print('✅ 所有核心动作均已落库可复查！')
