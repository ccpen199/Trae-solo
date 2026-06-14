#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime, timedelta

conn = sqlite3.connect('data/app.sqlite')
cursor = conn.cursor()
now = datetime.now().isoformat()

# 获取企业ID
cursor.execute('SELECT id FROM enterprises ORDER BY id')
eids = [row[0] for row in cursor.fetchall()]
print(f'企业ID: {eids}')

# 检查哪些表已有数据
tables = ['bid_rigging_suspects', 'subcontractor_blacklist', 'risk_rules', 
          'due_diligence_reports', 'credit_records', 'credit_repair_applications',
          'offline_archives', 'users']
for t in tables:
    cursor.execute(f'SELECT COUNT(*) FROM {t}')
    print(f'{t}: {cursor.fetchone()[0]}')

def seed_table(table_name, count_sql, insert_sql, data_list):
    cursor.execute(count_sql)
    if cursor.fetchone()[0] == 0:
        cursor.executemany(insert_sql, data_list)
        print(f'✅ {table_name}: {len(data_list)} 条')
    else:
        print(f'⚠️  {table_name}: 已有数据，跳过')

# 围标串标嫌疑
seed_table(
    'bid_rigging_suspects',
    'SELECT COUNT(*) FROM bid_rigging_suspects',
    '''INSERT INTO bid_rigging_suspects 
       (enterprise_id, project_name, bidding_date, suspicion_reason, risk_level, related_enterprises,
        status, data_source, data_updated_at, source_url, processing_status, display_deadline, countdown_days, expiry_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    [
        (eids[3], '某市政道路工程项目', '2024-08-15', '投标报价异常一致', '高风险', json.dumps([eids[0], eids[1]], ensure_ascii=False),
         '待核实', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn', '待核实',
         (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%d'), 180, '公示中'),
        (eids[4], '某办公楼建设项目', '2024-09-01', '投标文件异常一致', '中风险', json.dumps([eids[2]], ensure_ascii=False),
         '待核实', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn', '核实中',
         (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'), 90, '公示中'),
    ]
)

# 黑名单
seed_table(
    'subcontractor_blacklist',
    'SELECT COUNT(*) FROM subcontractor_blacklist',
    '''INSERT INTO subcontractor_blacklist 
       (enterprise_id, reason, inclusion_date, risk_level, status,
        data_source, data_updated_at, source_url, processing_status,
        display_deadline, countdown_days, expiry_status, credit_repair_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    [
        (eids[0], '严重违法失信行为', '2024-03-01', '高风险', '黑名单中',
         '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn', '待处理',
         (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'), 365, '公示中', 1),
        (eids[1], '发生重大安全事故', '2024-06-15', '高风险', '黑名单中',
         '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn', '处理中',
         (datetime.now() + timedelta(days=730)).strftime('%Y-%m-%d'), 730, '公示中', 1),
    ]
)

# 风控规则
seed_table(
    'risk_rules',
    'SELECT COUNT(*) FROM risk_rules',
    '''INSERT INTO risk_rules 
       (user_id, enterprise_id, rule_name, rule_condition, rule_action, rule_level, is_enabled, hit_count, last_hit_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    [
        (1, eids[0], '高风险企业预警', 'risk_level=高风险', '预警通知', 'high', 1, 5, now),
        (1, eids[1], '经营异常监测', 'has_abnormal=1', '重点关注', 'medium', 1, 3, now),
        (1, eids[2], '黑名单监测', 'in_blacklist=1', '自动拦截', 'high', 1, 8, now),
    ]
)

# 尽调报告
seed_table(
    'due_diligence_reports',
    'SELECT COUNT(*) FROM due_diligence_reports',
    '''INSERT INTO due_diligence_reports 
       (enterprise_id, user_id, report_name, report_type, file_path, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)''',
    [
        (eids[0], 1, '中建八局第三建设有限公司尽调报告', 'custom', '/reports/中建八局.pdf', '已完成', now),
        (eids[1], 1, '上海建工集团股份有限公司尽调报告', 'standard', '/reports/上海建工.pdf', '生成中', now),
    ]
)

# 信用记录
seed_table(
    'credit_records',
    'SELECT COUNT(*) FROM credit_records',
    '''INSERT INTO credit_records 
       (enterprise_id, credit_type, credit_level, description, effective_date, expiry_date, display_deadline, status, repair_status, repair_proof, repair_reviewed_by, repair_reviewed_at, data_source, data_updated_at, source_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    [
        (eids[0], '行政处罚', '一般', '未按规定报送年度报告', '2024-01-01', '2024-12-31', 
         (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'), '有效', '修复中', None, None, None, 
         '信用中国', now, 'http://www.creditchina.gov.cn'),
        (eids[1], '失信被执行人', '严重', '有履行能力而拒不履行生效法律文书确定义务', '2024-03-15', '2025-03-14',
         (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'), '有效', '未修复', None, None, None,
         '信用中国', now, 'http://www.creditchina.gov.cn'),
    ]
)

# 信用修复申请
seed_table(
    'credit_repair_applications',
    'SELECT COUNT(*) FROM credit_repair_applications',
    '''INSERT INTO credit_repair_applications 
       (credit_record_id, enterprise_id, applicant, description, proof_file, status, review_comment, reviewed_by, reviewed_at, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
    [
        (1, eids[0], '张三', '已完成整改，申请移除经营异常记录', '/proofs/proof1.pdf', 'pending', None, None, None, now),
        (2, eids[1], '李四', '已履行判决义务，申请修复信用', '/proofs/proof2.pdf', 'approved', '符合修复条件，同意修复', 1, now, now),
    ]
)

# 离线档案
seed_table(
    'offline_archives',
    'SELECT COUNT(*) FROM offline_archives',
    '''INSERT INTO offline_archives 
       (enterprise_id, user_id, archive_data, qr_code, downloaded_at)
       VALUES (?, ?, ?, ?, ?)''',
    [
        (eids[0], 1, json.dumps({'六维资料': ['工商', '司法', '招投标', '资质', '人员', '信用']}, ensure_ascii=False), 'QRCODE001', now),
        (eids[2], 1, json.dumps({'六维资料': ['工商', '司法', '招投标', '资质', '人员', '信用']}, ensure_ascii=False), 'QRCODE002', now),
    ]
)

# 用户
seed_table(
    'users',
    'SELECT COUNT(*) FROM users',
    '''INSERT INTO users 
       (username, password, role, company, created_at)
       VALUES (?, ?, ?, ?, ?)''',
    [
        ('admin', 'admin123', 'admin', '系统管理员', now),
        ('user1', 'user123', 'user', '中建八局', now),
    ]
)

conn.commit()

# 验证
print("\n=== 最终数据统计 ===")
all_tables = ['enterprises', 'health_scores', 'business_abnormalities', 'bid_rigging_suspects',
              'subcontractor_blacklist', 'risk_rules', 'due_diligence_reports', 'credit_records',
              'credit_repair_applications', 'offline_archives', 'users']
for t in all_tables:
    cursor.execute(f'SELECT COUNT(*) FROM {t}')
    print(f'{t}: {cursor.fetchone()[0]}')

conn.close()
print("\n🎉 所有数据填充完成！")
