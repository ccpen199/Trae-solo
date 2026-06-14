#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime, timedelta

conn = sqlite3.connect('data/app.sqlite')
cursor = conn.cursor()
now = datetime.now().isoformat()

# 获取所有规则
cursor.execute('SELECT id, rule_name, rule_condition, rule_action FROM risk_rules')
rules = cursor.fetchall()

print(f'找到 {len(rules)} 条规则，开始修复...\n')

for rule_id, rule_name, old_condition, old_action in rules:
    print(f'修复规则: {rule_name} (ID: {rule_id})')
    print(f'  旧 condition: {old_condition}')
    print(f'  旧 action: {old_action}')
    
    # 根据规则名称生成正确的JSON格式
    if '高风险' in rule_name:
        new_condition = json.dumps({'type': 'judicial', 'count': 3, 'period': 180}, ensure_ascii=False)
        new_action = json.dumps({'action': 'downgrade', 'level': 'red'}, ensure_ascii=False)
    elif '经营异常' in rule_name:
        new_condition = json.dumps({'type': 'abnormal', 'status': '未移除'}, ensure_ascii=False)
        new_action = json.dumps({'action': 'warn', 'level': 'orange'}, ensure_ascii=False)
    elif '黑名单' in rule_name:
        new_condition = json.dumps({'type': 'credit', 'typeValue': '失信被执行人'}, ensure_ascii=False)
        new_action = json.dumps({'action': 'blacklist', 'level': 'red'}, ensure_ascii=False)
    else:
        new_condition = json.dumps({'type': 'judicial', 'count': 3, 'period': 180}, ensure_ascii=False)
        new_action = json.dumps({'action': 'warn', 'level': 'orange'}, ensure_ascii=False)
    
    print(f'  新 condition: {new_condition}')
    print(f'  新 action: {new_action}')
    
    cursor.execute('''
        UPDATE risk_rules 
        SET rule_condition = ?, rule_action = ?, updated_at = ?
        WHERE id = ?
    ''', (new_condition, new_action, now, rule_id))
    print(f'  ✅ 已更新\n')

# 再插入2条更完整的示例规则
more_rules = [
    (1, None, '资质过期30天自动提醒', 
     json.dumps({'type': 'qualification', 'expiryDays': 30}, ensure_ascii=False),
     json.dumps({'action': 'remind', 'level': 'yellow'}, ensure_ascii=False),
     'low', 1, 2, now),
    (1, None, '围标高风险自动降级',
     json.dumps({'type': 'bidRigging', 'riskLevel': '高风险'}, ensure_ascii=False),
     json.dumps({'action': 'downgrade', 'level': 'red'}, ensure_ascii=False),
     'high', 1, 4, now),
]

cursor.executemany('''
    INSERT INTO risk_rules 
    (user_id, enterprise_id, rule_name, rule_condition, rule_action, rule_level, is_enabled, hit_count, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', [(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[8]) for r in more_rules])

print(f'✅ 新增了 {len(more_rules)} 条示例规则')

conn.commit()

# 验证
print('\n=== 验证结果 ===')
cursor.execute('SELECT id, rule_name, rule_condition, rule_action, hit_count FROM risk_rules ORDER BY id')
for row in cursor.fetchall():
    print(f'ID: {row[0]}, {row[1]}')
    print(f'  condition: {row[2][:50]}...')
    print(f'  action: {row[3]}')
    print(f'  命中次数: {row[4]}')
    print()

conn.close()
print('🎉 所有规则数据修复完成！')
