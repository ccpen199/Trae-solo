#!/usr/bin/env python3
import sqlite3
import json
import sys
from datetime import datetime, timedelta

db_path = 'data/app.sqlite'
print(f"数据库: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

now = datetime.now().isoformat()
print(f"当前时间: {now}")

# 1. 插入企业数据
enterprises = [
    ('中建八局第三建设有限公司', '91310000132200000X', '张三', '100000万', '1998-03-15', '建筑工程、市政公用工程', '上海市浦东新区', '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('上海建工集团股份有限公司', '91310000132200001Y', '李四', '200000万', '1995-08-20', '建筑工程、机电安装工程', '上海市黄浦区', '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('中铁四局集团有限公司', '91340000132200002Z', '王五', '500000万', '1990-01-01', '铁路工程、公路工程', '安徽省合肥市', '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('中交第一航务工程局有限公司', '91120000132200003A', '赵六', '300000万', '1992-06-10', '港口与航道工程', '天津市滨海新区', '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('中国建筑第五工程局有限公司', '91430000132200004B', '孙七', '400000万', '1993-04-05', '建筑工程、公路工程', '湖南省长沙市', '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
]

print("\n=== 插入企业数据 ===")
enterprise_ids = []
for ent in enterprises:
    try:
        cursor.execute("""
            INSERT INTO enterprises (name, unified_social_credit, legal_representative, registered_capital, establishment_date, business_scope, address, status, data_source, data_updated_at, source_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ent)
        enterprise_ids.append(cursor.lastrowid)
        print(f"  ✅ {ent[0]}")
    except Exception as e:
        cursor.execute("SELECT id FROM enterprises WHERE unified_social_credit = ?", (ent[1],))
        enterprise_ids.append(cursor.fetchone()[0])
        print(f"  ⚠️  {ent[0]} 已存在")

# 2. 插入经营异常
print("\n=== 插入经营异常 ===")
abnormal_data = [
    (enterprise_ids[0], '经营异常', '未按规定报送年度报告', '上海市市场监督管理局', '2024-03-15', None, '未移除',
     '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn', '待处理',
     (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'), 90, '公示中'),
    (enterprise_ids[1], '经营异常', '通过登记的住所无法联系', '北京市市场监督管理局', '2024-05-20', None, '未移除',
     '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn', '处理中',
     (datetime.now() + timedelta(days=45)).strftime('%Y-%m-%d'), 45, '公示中'),
    (enterprise_ids[2], '经营异常', '公示信息隐瞒真实情况', '广东省市场监督管理局', '2024-02-10', None, '未移除',
     '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn', '已处理',
     (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%d'), 180, '公示中'),
]
cursor.executemany("""
    INSERT INTO business_abnormalities 
    (enterprise_id, abnormal_type, abnormal_reason, decision_authority, decision_date, removal_date, status,
     data_source, data_updated_at, source_url, processing_status, display_deadline, countdown_days, expiry_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", abnormal_data)
print(f"  ✅ 插入了 {len(abnormal_data)} 条经营异常记录")

# 3. 插入围标串标嫌疑
print("\n=== 插入围标串标嫌疑 ===")
bid_rigging_data = [
    (enterprise_ids[3], '某市政道路工程项目', '2024-08-15', '投标报价异常一致', '高风险', json.dumps([enterprise_ids[0], enterprise_ids[1]], ensure_ascii=False),
     '待核实', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn', '待核实',
     (datetime.now() + timedelta(days=180)).strftime('%Y-%m-%d'), 180, '公示中'),
    (enterprise_ids[4], '某办公楼建设项目', '2024-09-01', '投标文件异常一致', '中风险', json.dumps([enterprise_ids[2]], ensure_ascii=False),
     '待核实', '全国公共资源交易平台', now, 'http://www.ggzy.gov.cn', '核实中',
     (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'), 90, '公示中'),
]
cursor.executemany("""
    INSERT INTO bid_rigging_suspects 
    (enterprise_id, project_name, bidding_date, suspicion_reason, risk_level, related_enterprises,
     status, data_source, data_updated_at, source_url, processing_status, display_deadline, countdown_days, expiry_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", bid_rigging_data)
print(f"  ✅ 插入了 {len(bid_rigging_data)} 条围标串标嫌疑记录")

# 4. 插入分包商黑名单
print("\n=== 插入分包商黑名单 ===")
blacklist_data = [
    (enterprise_ids[0], '严重违法失信行为', '2024-03-01', '高风险', '黑名单中',
     '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn', '待处理',
     (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'), 365, '公示中', 1),
    (enterprise_ids[1], '发生重大安全事故', '2024-06-15', '高风险', '黑名单中',
     '全国建筑市场监管公共服务平台', now, 'http://jzsc.mohurd.gov.cn', '处理中',
     (datetime.now() + timedelta(days=730)).strftime('%Y-%m-%d'), 730, '公示中', 1),
]
cursor.executemany("""
    INSERT INTO subcontractor_blacklist 
    (enterprise_id, reason, inclusion_date, risk_level, status,
     data_source, data_updated_at, source_url, processing_status,
     display_deadline, countdown_days, expiry_status, credit_repair_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", blacklist_data)
print(f"  ✅ 插入了 {len(blacklist_data)} 条黑名单记录")

# 5. 评分详情数据
score_details = {
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

# 6. 插入健康评分
print("\n=== 插入健康评分 ===")
health_scores_data = [
    (enterprise_ids[0], 85, 20, 20, 13, 13, 10, 9, '中风险', now,
     json.dumps(score_details['business'], ensure_ascii=False),
    json.dumps(score_details['judicial'], ensure_ascii=False),
    None, None,
    json.dumps(score_details['personnel'], ensure_ascii=False),
    json.dumps(score_details['credit'], ensure_ascii=False)),
    (enterprise_ids[1], 78, 22, 18, 12, 14, 7, 5, '中高风险', now,
     json.dumps(score_details['business'], ensure_ascii=False),
    json.dumps(score_details['judicial'], ensure_ascii=False),
    None, None,
    json.dumps(score_details['personnel'], ensure_ascii=False),
    json.dumps(score_details['credit'], ensure_ascii=False)),
    (enterprise_ids[2], 92, 24, 23, 14, 14, 10, 7, '低风险', now,
     json.dumps(score_details['business'], ensure_ascii=False),
    json.dumps(score_details['judicial'], ensure_ascii=False),
    None, None,
    json.dumps(score_details['personnel'], ensure_ascii=False),
    json.dumps(score_details['credit'], ensure_ascii=False)),
    (enterprise_ids[3], 75, 18, 17, 13, 12, 8, 7, '中风险', now,
     json.dumps(score_details['business'], ensure_ascii=False),
    json.dumps(score_details['judicial'], ensure_ascii=False),
    None, None,
    json.dumps(score_details['personnel'], ensure_ascii=False),
    json.dumps(score_details['credit'], ensure_ascii=False)),
    (enterprise_ids[4], 88, 23, 21, 14, 13, 9, 8, '低风险', now,
     json.dumps(score_details['business'], ensure_ascii=False),
    json.dumps(score_details['judicial'], ensure_ascii=False),
    None, None,
    json.dumps(score_details['personnel'], ensure_ascii=False),
    json.dumps(score_details['credit'], ensure_ascii=False)),
]
cursor.executemany("""
    INSERT INTO health_scores 
    (enterprise_id, total_score, business_score, judicial_score, bidding_score, qualification_score,
     personnel_score, credit_score, risk_level, calculated_at,
     business_score_details, judicial_score_details,
     bidding_score_details, qualification_score_details,
     personnel_score_details, credit_score_details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", health_scores_data)
print(f"  ✅ 插入了 {len(health_scores_data)} 条健康评分记录")

# 7. 插入风控规则
print("\n=== 插入风控规则 ===")
risk_rules_data = [
    (1, enterprise_ids[0], '高风险企业预警', 'risk_level = "高风险"', '预警通知', 'high', 1, 5, now),
    (1, enterprise_ids[1], '经营异常监测', 'has_abnormal = 1', '重点关注', 'medium', 1, 3, now),
    (1, enterprise_ids[2], '黑名单监测', 'in_blacklist = 1', '自动拦截', 'high', 1, 8, now),
]
cursor.executemany("""
    INSERT INTO risk_rules 
    (user_id, enterprise_id, rule_name, rule_condition, rule_action, rule_level, is_enabled, hit_count, last_hit_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", risk_rules_data)
print(f"  ✅ 插入了 {len(risk_rules_data)} 条风控规则")

# 8. 插入尽调报告
print("\n=== 插入尽调报告 ===")
due_diligence_data = [
    (enterprise_ids[0], 1, '中建八局第三建设有限公司尽调报告', 'custom', '/reports/中建八局.pdf', '已完成', now),
    (enterprise_ids[1], 1, '上海建工集团股份有限公司尽调报告', 'standard', '/reports/上海建工.pdf', '生成中', now),
]
cursor.executemany("""
    INSERT INTO due_diligence_reports 
    (enterprise_id, user_id, report_name, report_type, file_path, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", due_diligence_data)
print(f"  ✅ 插入了 {len(due_diligence_data)} 条尽调报告")

# 9. 插入信用记录
print("\n=== 插入信用记录 ===")
credit_records_data = [
    (enterprise_ids[0], '行政处罚', '一般', '未按规定报送年度报告', '2024-01-01', '2024-12-31', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'), '有效', '修复中', None, None, None, '信用中国', now, 'http://www.creditchina.gov.cn'),
    (enterprise_ids[1], '失信被执行人', '严重', '有履行能力而拒不履行生效法律文书确定义务', '2024-03-15', '2025-03-14', (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'), '有效', '未修复', None, None, None, '信用中国', now, 'http://www.creditchina.gov.cn'),
]
cursor.executemany("""
    INSERT INTO credit_records 
    (enterprise_id, credit_type, credit_level, description, effective_date, expiry_date, display_deadline, status, repair_status, repair_proof, repair_reviewed_by, repair_reviewed_at, data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", credit_records_data)
print(f"  ✅ 插入了 {len(credit_records_data)} 条信用记录")

# 10. 插入信用修复申请
print("\n=== 插入信用修复申请 ===")
credit_repair_data = [
    (1, enterprise_ids[0], '张三', '已完成整改，申请移除经营异常记录', '/proofs/proof1.pdf', 'pending', None, None, None, now),
    (2, enterprise_ids[1], '李四', '已履行判决义务，申请修复信用', '/proofs/proof2.pdf', 'approved', '符合修复条件，同意修复', 1, now, now),
]
cursor.executemany("""
    INSERT INTO credit_repair_applications 
    (credit_record_id, enterprise_id, applicant, description, proof_file, status, review_comment, reviewed_by, reviewed_at, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", credit_repair_data)
print(f"  ✅ 插入了 {len(credit_repair_data)} 条信用修复申请")

# 11. 插入离线档案
print("\n=== 插入离线档案 ===")
offline_archives_data = [
    (enterprise_ids[0], 1, json.dumps({'六维资料': ['工商', '司法', '招投标', '资质', '人员', '信用']}, ensure_ascii=False), 'QRCODE001', now),
    (enterprise_ids[2], 1, json.dumps({'六维资料': ['工商', '司法', '招投标', '资质', '人员', '信用']}, ensure_ascii=False), 'QRCODE002', now),
]
cursor.executemany("""
    INSERT INTO offline_archives 
    (enterprise_id, user_id, archive_data, qr_code, downloaded_at)
    VALUES (?, ?, ?, ?, ?)
""", offline_archives_data)
print(f"  ✅ 插入了 {len(offline_archives_data)} 条离线档案")

# 12. 插入用户
print("\n=== 插入用户 ===")
users_data = [
    ('admin', 'admin123', 'admin', '系统管理员', now),
    ('user1', 'user123', 'user', '中建八局', now),
]
cursor.executemany("""
    INSERT INTO users 
    (username, password, role, company, created_at)
    VALUES (?, ?, ?, ?, ?)
""", users_data)
print(f"  ✅ 插入了 {len(users_data)} 条用户数据")

# 验证数据
print("\n=== 数据验证 ===")
cursor.execute("SELECT COUNT(*) FROM enterprises")
print(f"  企业数量: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM health_scores")
print(f"  健康评分数量: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM business_abnormalities")
print(f"  经营异常数量: {cursor.fetchone()[0]}")

cursor.execute("SELECT id, data_source, source_url, processing_status, countdown_days FROM business_abnormalities LIMIT 1")
row = cursor.fetchone()
print(f"  经营异常示例: {row}")

cursor.execute("SELECT id, personnel_score_details FROM health_scores WHERE personnel_score_details IS NOT NULL LIMIT 1")
row = cursor.fetchone()
print(f"  评分详情示例: {'存在' if row else '不存在'}")

conn.commit()
conn.close()

print("\n🎉 所有示例数据填充完成！")
