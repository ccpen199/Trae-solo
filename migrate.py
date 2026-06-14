#!/usr/bin/env python3
import sqlite3
import json
import os
from datetime import datetime, timedelta

db_path = os.path.join(os.path.dirname(__file__), 'data/app.sqlite')
print(f"数据库路径: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column_if_not_exists(table, column, definition):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    if column not in columns:
        print(f"添加字段: {table}.{column}")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        return True
    return False

print("\n🚀 开始数据库迁移...\n")

# 1. business_abnormalities 表迁移
print("=== business_abnormalities 表迁移 ===")
fields = [
    ('data_source', 'TEXT'),
    ('data_updated_at', 'TEXT'),
    ('source_url', 'TEXT'),
    ('processing_status', "TEXT DEFAULT '待处理'"),
    ('processing_result', 'TEXT'),
    ('processing_time', 'TEXT'),
    ('reviewer', 'TEXT'),
    ('review_result', 'TEXT'),
    ('review_time', 'TEXT'),
    ('display_deadline', 'TEXT'),
    ('countdown_days', 'INTEGER'),
    ('expiry_status', "TEXT DEFAULT '公示中'"),
]
added = 0
for name, definition in fields:
    if add_column_if_not_exists('business_abnormalities', name, definition):
        added += 1

# 填充示例数据
now = datetime.now().isoformat()
deadline = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
days = (datetime.now() + timedelta(days=90) - datetime.now()).days

cursor.execute("SELECT id FROM business_abnormalities WHERE data_source IS NULL")
records = cursor.fetchall()
for (record_id,) in records:
    cursor.execute("""
        UPDATE business_abnormalities 
        SET data_source = ?, data_updated_at = ?, source_url = ?, 
            processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?
        WHERE id = ?
    """, ('国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn', '待处理', deadline, days, '公示中', record_id))
print(f"✅ 更新了 {len(records)} 条经营异常记录")

# 2. bid_rigging_suspects 表迁移
print("\n=== bid_rigging_suspects 表迁移 ===")
fields = [
    ('data_source', 'TEXT'),
    ('data_updated_at', 'TEXT'),
    ('source_url', 'TEXT'),
    ('processing_status', "TEXT DEFAULT '待核实'"),
    ('processing_result', 'TEXT'),
    ('processing_time', 'TEXT'),
    ('reviewer', 'TEXT'),
    ('review_result', 'TEXT'),
    ('review_time', 'TEXT'),
    ('display_deadline', 'TEXT'),
    ('countdown_days', 'INTEGER'),
    ('expiry_status', "TEXT DEFAULT '公示中'"),
]
for name, definition in fields:
    add_column_if_not_exists('bid_rigging_suspects', name, definition)

deadline = (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%d')
days = (datetime.now() + timedelta(days=180) - datetime.now()).days
cursor.execute("SELECT id FROM bid_rigging_suspects WHERE data_source IS NULL")
records = cursor.fetchall()
for (record_id,) in records:
    cursor.execute("""
        UPDATE bid_rigging_suspects 
        SET data_source = ?, data_updated_at = ?, source_url = ?, 
            processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?
        WHERE id = ?
    """, ('全国公共资源交易平台', now, 'http://www.ggzy.gov.cn', '待核实', deadline, days, '公示中', record_id))
print(f"✅ 更新了 {len(records)} 条围标串标记录")

# 3. subcontractor_blacklist 表迁移
print("\n=== subcontractor_blacklist 表迁移 ===")
fields = [
    ('data_source', 'TEXT'),
    ('data_updated_at', 'TEXT'),
    ('source_url', 'TEXT'),
    ('processing_status', "TEXT DEFAULT '待处理'"),
    ('processing_result', 'TEXT'),
    ('processing_time', 'TEXT'),
    ('reviewer', 'TEXT'),
    ('review_result', 'TEXT'),
    ('review_time', 'TEXT'),
    ('display_deadline', 'TEXT'),
    ('countdown_days', 'INTEGER'),
    ('expiry_status', "TEXT DEFAULT '公示中'"),
    ('credit_repair_available', 'INTEGER DEFAULT 1'),
    ('credit_repair_status', 'TEXT'),
    ('credit_repair_application_id', 'INTEGER'),
]
for name, definition in fields:
    add_column_if_not_exists('subcontractor_blacklist', name, definition)

deadline = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
days = (datetime.now() + timedelta(days=365) - datetime.now()).days
cursor.execute("SELECT id FROM subcontractor_blacklist WHERE data_source IS NULL")
records = cursor.fetchall()
for (record_id,) in records:
    cursor.execute("""
        UPDATE subcontractor_blacklist 
        SET data_source = ?, data_updated_at = ?, source_url = ?, 
            processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?,
            credit_repair_available = ?
        WHERE id = ?
    """, ('全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn', '待处理', deadline, days, '公示中', 1, record_id))
print(f"✅ 更新了 {len(records)} 条黑名单记录")

# 4. health_scores 表迁移
print("\n=== health_scores 表迁移 ===")
fields = [
    ('business_score_details', 'TEXT'),
    ('judicial_score_details', 'TEXT'),
    ('bidding_score_details', 'TEXT'),
    ('qualification_score_details', 'TEXT'),
    ('personnel_score_details', 'TEXT'),
    ('credit_score_details', 'TEXT'),
]
for name, definition in fields:
    add_column_if_not_exists('health_scores', name, definition)

details = {
    'business': [
        {'source': '工商登记信息', 'deduction': 0, 'reason': '信息完整', 'record_id': 'bus-001'},
        {'source': '年报公示', 'deduction': 2, 'reason': '年报逾期30天', 'record_id': 'bus-002'},
        {'source': '经营异常记录', 'deduction': 3, 'reason': '存在经营异常记录', 'record_id': 'abn-001'}
    ],
    'judicial': [
        {'source': '裁判文书网', 'deduction': 3, 'reason': '存在合同纠纷判决', 'record_id': 'jud-001'},
        {'source': '失信被执行人', 'deduction': 0, 'reason': '无失信记录', 'record_id': 'jud-002'},
        {'source': '被执行人信息', 'deduction': 2, 'reason': '存在被执行记录', 'record_id': 'jud-003'}
    ],
    'personnel': [
        {'source': '注册建造师', 'deduction': 0, 'reason': '人员配置完整', 'record_id': 'per-001'},
        {'source': '技术职称', 'deduction': 0, 'reason': '职称人员达标', 'record_id': 'per-002'}
    ],
    'credit': [
        {'source': '行政处罚记录', 'deduction': 3, 'reason': '存在行政处罚记录', 'record_id': 'cre-001'},
        {'source': '信用评价', 'deduction': 2, 'reason': '信用等级一般', 'record_id': 'cre-002'}
    ]
}

cursor.execute("SELECT id FROM health_scores WHERE personnel_score_details IS NULL")
records = cursor.fetchall()
for (record_id,) in records:
    cursor.execute("""
        UPDATE health_scores 
        SET personnel_score_details = ?, credit_score_details = ?,
            business_score_details = ?, judicial_score_details = ?
        WHERE id = ?
    """, (
        json.dumps(details['personnel'], ensure_ascii=False),
        json.dumps(details['credit'], ensure_ascii=False),
        json.dumps(details['business'], ensure_ascii=False),
        json.dumps(details['judicial'], ensure_ascii=False),
        record_id
    ))
print(f"✅ 更新了 {len(records)} 条评分详情记录")

# 验证结果
print("\n✅ 迁移验证:")
cursor.execute("SELECT id, data_source, source_url, processing_status, countdown_days FROM business_abnormalities LIMIT 1")
row = cursor.fetchone()
print(f"经营异常示例: {row}")

cursor.execute("SELECT id, personnel_score_details FROM health_scores WHERE personnel_score_details IS NOT NULL LIMIT 1")
row = cursor.fetchone()
print(f"评分详情示例: {'存在' if row else '不存在'}")

conn.commit()
conn.close()

print("\n🎉 所有数据库迁移完成！")
