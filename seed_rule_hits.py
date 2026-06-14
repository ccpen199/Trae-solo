#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime, timedelta

conn = sqlite3.connect('data/app.sqlite')
cursor = conn.cursor()

# 获取企业和规则ID
cursor.execute('SELECT id, name FROM enterprises ORDER BY id')
enterprises = cursor.fetchall()
eids = [e[0] for e in enterprises]
print(f'企业ID: {eids}')

cursor.execute('SELECT id, rule_name, rule_level FROM risk_rules ORDER BY id')
rules = cursor.fetchall()
print(f'规则: {[(r[0], r[1]) for r in rules]}')

# 生成示例命中记录
now = datetime.now()
hit_records = []

# 为每个企业生成2-3条命中记录
for i, eid in enumerate(eids):
    for j, rule in enumerate(rules[:3]):  # 只用前3条规则
        hit_time = now - timedelta(days=i*2 + j)
        rule_id, rule_name, rule_level = rule
        
        # 根据规则生成触发原因
        if rule_id == 1:  # 高风险企业预警
            trigger_reason = f'近180天内诉讼记录5条，超过阈值3条'
            action_type = 'downgrade'
        elif rule_id == 2:  # 经营异常监测
            trigger_reason = f'存在{2+i}条经营异常记录未移除'
            action_type = 'warn'
        elif rule_id == 3:  # 黑名单监测
            trigger_reason = '企业被列为失信被执行人'
            action_type = 'blacklist'
        else:
            trigger_reason = '规则条件匹配'
            action_type = 'warn'
        
        # 随机设置处理状态
        status = '待处理' if (i + j) % 3 == 0 else ('处理中' if (i + j) % 3 == 1 else '已处理')
        
        hit_records.append((
            rule_id,
            eid,
            rule_name,
            rule_level,
            trigger_reason,
            action_type,
            status,
            hit_time.isoformat()
        ))

# 插入数据
cursor.executemany('''
    INSERT INTO rule_hit_records 
    (rule_id, enterprise_id, rule_name, rule_level, trigger_reason, action_type, 
     processing_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', hit_records)

conn.commit()

# 验证
cursor.execute('SELECT COUNT(*) FROM rule_hit_records')
count = cursor.fetchone()[0]
print(f'\n✅ 插入了 {count} 条规则命中记录')

# 显示示例
cursor.execute('''
    SELECT rhr.id, rhr.rule_name, e.name, rhr.trigger_reason, 
           rhr.action_type, rhr.processing_status, rhr.created_at
    FROM rule_hit_records rhr
    LEFT JOIN enterprises e ON rhr.enterprise_id = e.id
    ORDER BY rhr.created_at DESC
    LIMIT 5
''')
print('\n最近5条命中记录:')
for row in cursor.fetchall():
    print(f'  ID: {row[0]}')
    print(f'    规则: {row[1]}')
    print(f'    企业: {row[2]}')
    print(f'    原因: {row[3][:50]}...')
    print(f'    动作: {row[4]}')
    print(f'    状态: {row[5]}')
    print(f'    时间: {row[6]}')
    print()

conn.close()
print('🎉 示例规则命中记录填充完成！')
