#!/usr/bin/env python3
import sqlite3
import json

db_path = '/Users/chen/Documents/trae_projects/local_projects/may-63407/backend/data/app.sqlite'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 为 6d7c1ebf 添加控制台错误和接口失败记录
console_errors = json.dumps([
    {
        "message": "Uncaught TypeError: Cannot read property 'onClick' of null",
        "stack": "at HTMLButtonElement.<anonymous> (login.js:127:18)\n    at HTMLButtonElement.dispatch (jquery.js:5429:27)",
        "timestamp": "2026-05-26T07:35:22.156Z"
    },
    {
        "message": "React warning: setState on unmounted component",
        "stack": "at LoginPage (src/pages/Login.tsx:89:15)",
        "timestamp": "2026-05-26T07:35:25.002Z"
    }
])

network_errors = json.dumps([
    {
        "method": "POST",
        "url": "/api/auth/login",
        "status": 500,
        "timestamp": "2026-05-26T07:35:23.456Z"
    },
    {
        "method": "GET",
        "url": "/api/user/profile",
        "status": 401,
        "timestamp": "2026-05-26T07:35:24.123Z"
    }
])

feedback_id = '6d7c1ebf-e7e4-4ed3-b28f-09617974de2c'

cursor.execute(
    "UPDATE feedbacks SET console_errors = ?, network_errors = ? WHERE id = ?",
    (console_errors, network_errors, feedback_id)
)

# 添加更完整的状态流转记录
import uuid
import time

now = int(time.time() * 1000)

# 先删除旧的状态记录，重新添加完整的流转记录
cursor.execute("DELETE FROM status_logs WHERE feedback_id = ?", (feedback_id,))

status_flow = [
    (str(uuid.uuid4()), feedback_id, None, 'pending', 'system', '反馈已创建', now - 72000),
    (str(uuid.uuid4()), feedback_id, 'pending', 'accepted', '客服-李四', 
     '已受理反馈，开始分析问题\n\n[受理角色：客服]\n[分派给：研发-王五]', now - 70000),
    (str(uuid.uuid4()), feedback_id, 'accepted', 'supplementing', '研发-王五', 
     '需要补充以下信息：\n- 补充截图：请提供问题发生时的完整截图\n- 复现步骤：请补充更详细的复现步骤\n\n[已通知提交人：test@example.com]\n[负责人：研发-王五]\n[通知结果：送达成功]', now - 65000),
    (str(uuid.uuid4()), feedback_id, 'supplementing', 'processing', '研发-王五', 
     '已收到补充材料，开始处理\n\n[复查记录：截图已核对，复现步骤完整]', now - 36000),
    (str(uuid.uuid4()), feedback_id, 'processing', 'fixed', '研发-王五', 
     '问题已修复\n\n[修复说明：修复了登录按钮事件绑定问题]', now - 18000),
]

for log in status_flow:
    cursor.execute(
        "INSERT INTO status_logs (id, feedback_id, old_status, new_status, operator, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        log
    )

# 更新反馈状态为 fixed
cursor.execute(
    "UPDATE feedbacks SET status = 'fixed', assignee = '研发-王五', updated_at = ? WHERE id = ?",
    (now - 18000, feedback_id)
)

conn.commit()
print("数据更新完成！")
print(f"更新了反馈: {feedback_id}")
print("- 已添加控制台错误（2条）")
print("- 已添加接口失败记录（2条）")
print("- 已更新状态流转记录（5步完整流程）")
print("- 已设置负责人：研发-王五")

cursor.close()
conn.close()
