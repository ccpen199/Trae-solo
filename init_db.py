#!/usr/bin/env python3
import sqlite3
import json
import os
from datetime import datetime, timedelta

db_path = os.path.join(os.path.dirname(__file__), 'data/app.sqlite')
print(f"数据库路径: {db_path}")

# 确保目录存在
os.makedirs(os.path.dirname(db_path), exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("PRAGMA journal_mode = WAL")
cursor.execute("PRAGMA foreign_keys = ON")

print("\n🚀 开始数据库初始化...\n")

# 创建所有表
tables_sql = [
    """
    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unified_social_credit TEXT UNIQUE,
      legal_representative TEXT,
      registered_capital TEXT,
      establishment_date TEXT,
      business_scope TEXT,
      address TEXT,
      status TEXT DEFAULT '正常',
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS judicial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      case_type TEXT,
      case_reason TEXT,
      court TEXT,
      case_number TEXT,
      filing_date TEXT,
      judgment_date TEXT,
      judgment_result TEXT,
      amount REAL,
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS bidding_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      project_name TEXT,
      bidding_amount REAL,
      bidding_date TEXT,
      winning_status TEXT,
      tenderee TEXT,
      region TEXT,
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      qualification_type TEXT,
      qualification_level TEXT,
      certificate_number TEXT,
      issuing_authority TEXT,
      issue_date TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT '有效',
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      name TEXT,
      position TEXT,
      id_card TEXT,
      qualification_certificates TEXT,
      registration_number TEXT,
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS credit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      credit_type TEXT,
      credit_level TEXT,
      description TEXT,
      effective_date TEXT,
      expiry_date TEXT,
      display_deadline TEXT,
      status TEXT DEFAULT '有效',
      repair_status TEXT DEFAULT '未修复',
      repair_proof TEXT,
      repair_reviewed_by INTEGER,
      repair_reviewed_at TEXT,
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS business_abnormalities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      abnormal_type TEXT,
      abnormal_reason TEXT,
      decision_authority TEXT,
      decision_date TEXT,
      removal_date TEXT,
      status TEXT DEFAULT '未移除',
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      processing_status TEXT DEFAULT '待处理',
      processing_result TEXT,
      processing_time TEXT,
      reviewer TEXT,
      review_result TEXT,
      review_time TEXT,
      display_deadline TEXT,
      countdown_days INTEGER,
      expiry_status TEXT DEFAULT '公示中',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS bid_rigging_suspects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      project_name TEXT,
      bidding_date TEXT,
      suspicion_reason TEXT,
      risk_level TEXT,
      related_enterprises TEXT,
      status TEXT DEFAULT '待核实',
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      processing_status TEXT DEFAULT '待核实',
      processing_result TEXT,
      processing_time TEXT,
      reviewer TEXT,
      review_result TEXT,
      review_time TEXT,
      display_deadline TEXT,
      countdown_days INTEGER,
      expiry_status TEXT DEFAULT '公示中',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS subcontractor_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      reason TEXT,
      inclusion_date TEXT,
      risk_level TEXT,
      status TEXT DEFAULT '黑名单中',
      data_source TEXT,
      data_updated_at TEXT,
      source_url TEXT,
      processing_status TEXT DEFAULT '待处理',
      processing_result TEXT,
      processing_time TEXT,
      reviewer TEXT,
      review_result TEXT,
      review_time TEXT,
      display_deadline TEXT,
      countdown_days INTEGER,
      expiry_status TEXT DEFAULT '公示中',
      credit_repair_available INTEGER DEFAULT 1,
      credit_repair_status TEXT,
      credit_repair_application_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS risk_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      enterprise_id INTEGER,
      rule_name TEXT NOT NULL,
      rule_condition TEXT NOT NULL,
      rule_action TEXT NOT NULL,
      rule_level TEXT DEFAULT 'medium',
      is_enabled INTEGER DEFAULT 1,
      hit_count INTEGER DEFAULT 0,
      last_hit_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS due_diligence_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      user_id INTEGER,
      report_name TEXT,
      report_type TEXT,
      file_path TEXT,
      status TEXT DEFAULT '生成中',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      company TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS offline_archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      user_id INTEGER,
      archive_data TEXT,
      qr_code TEXT,
      downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS health_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL UNIQUE,
      total_score INTEGER DEFAULT 100,
      business_score INTEGER DEFAULT 25,
      judicial_score INTEGER DEFAULT 25,
      bidding_score INTEGER DEFAULT 15,
      qualification_score INTEGER DEFAULT 15,
      personnel_score INTEGER DEFAULT 10,
      credit_score INTEGER DEFAULT 10,
      risk_level TEXT DEFAULT '低风险',
      calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      business_score_details TEXT,
      judicial_score_details TEXT,
      bidding_score_details TEXT,
      qualification_score_details TEXT,
      personnel_score_details TEXT,
      credit_score_details TEXT,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS credit_repair_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credit_record_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      applicant TEXT,
      description TEXT,
      proof_file TEXT,
      status TEXT DEFAULT 'pending',
      review_comment TEXT,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (credit_record_id) REFERENCES credit_records(id) ON DELETE CASCADE,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      endpoint TEXT,
      method TEXT,
      params TEXT,
      status_code INTEGER,
      response_time INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """
]

for sql in tables_sql:
    cursor.execute(sql)

print("✅ 所有表创建完成\n")

# 添加缺失的字段（health_scores 的6个详情字段）
def add_column_if_not_exists(table, column, definition):
    cursor.execute(f"PRAGMA table_info(health_scores)")
    columns = [row[1] for row in cursor.fetchall()]
    if column not in columns:
        print(f"添加字段: {table}.{column}")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

# 确保health_scores的详情字段
for col in ['business_score_details', 'judicial_score_details', 'bidding_score_details',
          'qualification_score_details', 'personnel_score_details', 'credit_score_details']:
    add_column_if_not_exists('health_scores', col, 'TEXT')

print()

# 填充示例数据
now = datetime.now().isoformat()

# 企业数据
enterprises = [
    ('中建八局第三建设有限公司', '91310000132200000X', '张三', '100000万', '1998-03-15', '建筑工程、市政公用工程', '上海市浦东新区',
     '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('上海建工集团股份有限公司', '91310000132200001Y', '李四', '200000万', '1995-08-20', '建筑工程、机电安装工程', '上海市黄浦区',
     '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('中铁四局集团有限公司', '91340000132200002Z', '王五', '500000万', '1990-01-01', '铁路工程、公路工程', '安徽省合肥市',
     '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('中交第一航务工程局有限公司', '91120000132200003A', '赵六', '300000万', '1992-06-10', '港口与航道工程', '天津市滨海新区',
     '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
    ('中国建筑第五工程局有限公司', '91430000132200004B', '孙七', '400000万', '1993-04-05', '建筑工程、公路工程', '湖南省长沙市',
     '正常', '国家企业信用信息公示系统', now, 'http://www.gsxt.gov.cn'),
]

enterprise_ids = []
for ent in enterprises:
    cursor.execute("""
        INSERT OR IGNORE INTO enterprises 
        (name, unified_social_credit, legal_representative, registered_capital,
        establishment_date, business_scope, address, status, data_source, data_updated_at, source_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ent)
    if cursor.rowcount > 0:
        enterprise_ids.append(cursor.lastrowid)
    else:
        cursor.execute("SELECT id FROM enterprises WHERE unified_social_credit = ?", (ent[1],))
        enterprise_ids.append(cursor.fetchone()[0])

print(f"✅ 企业数据初始化完成，共 {len(enterprise_ids)} 家企业\n")

# 经营异常数据
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
print(f"✅ 经营异常数据初始化完成，共 {len(abnormal_data)} 条\n")

# 围标串标嫌疑数据
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
print(f"✅ 围标串标嫌疑数据初始化完成，共 {len(bid_rigging_data)} 条\n")

# 分包商黑名单数据
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
print(f"✅ 分包商黑名单数据初始化完成，共 {len(blacklist_data)} 条\n")

# 评分详情数据
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

# 健康评分数据
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
print(f"✅ 健康评分数据初始化完成，共 {len(health_scores_data)} 条\n")

# 风控规则数据
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
print(f"✅ 风控规则数据初始化完成，共 {len(risk_rules_data)} 条\n")

# 尽调报告数据
due_diligence_data = [
    (enterprise_ids[0], 1, '中建八局第三建设有限公司尽调报告', 'custom', '/reports/中建八局.pdf', '已完成', now),
    (enterprise_ids[1], 1, '上海建工集团股份有限公司尽调报告', 'standard', '/reports/上海建工.pdf', '生成中', now),
]

cursor.executemany("""
    INSERT INTO due_diligence_reports 
    (enterprise_id, user_id, report_name, report_type, file_path, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", due_diligence_data)
print(f"✅ 尽调报告数据初始化完成，共 {len(due_diligence_data)} 条\n")

# 信用修复申请数据
credit_repair_data = [
    (1, enterprise_ids[0], '张三', '已完成整改，申请移除经营异常记录', '/proofs/proof1.pdf', 'pending', None, None, None, now),
    (2, enterprise_ids[1], '李四', '已履行判决义务，申请修复信用', '/proofs/proof2.pdf', 'approved', '符合修复条件，同意修复', 1, now, now),
]

cursor.executemany("""
    INSERT INTO credit_repair_applications 
    (credit_record_id, enterprise_id, applicant, description, proof_file, status, review_comment, reviewed_by, reviewed_at, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", credit_repair_data)
print(f"✅ 信用修复申请数据初始化完成，共 {len(credit_repair_data)} 条\n")

# 信用记录数据
credit_records_data = [
    (enterprise_ids[0], '行政处罚', '一般', '未按规定报送年度报告', '2024-01-01', '2024-12-31', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'), '有效', '修复中', None, None, None, '信用中国', now, 'http://www.creditchina.gov.cn'),
    (enterprise_ids[1], '失信被执行人', '严重', '有履行能力而拒不履行生效法律文书确定义务', '2024-03-15', '2025-03-14', (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'), '有效', '未修复', None, None, None, '信用中国', now, 'http://www.creditchina.gov.cn'),
]

cursor.executemany("""
    INSERT INTO credit_records 
    (enterprise_id, credit_type, credit_level, description, effective_date, expiry_date, display_deadline, status, repair_status, repair_proof, repair_reviewed_by, repair_reviewed_at, data_source, data_updated_at, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", credit_records_data)
print(f"✅ 信用记录数据初始化完成，共 {len(credit_records_data)} 条\n")

# 离线档案数据
offline_archives_data = [
    (enterprise_ids[0], 1, json.dumps({'六维资料': ['工商', '司法', '招投标', '资质', '人员', '信用']}, ensure_ascii=False), 'QRCODE001', now),
    (enterprise_ids[2], 1, json.dumps({'六维资料': ['工商', '司法', '招投标', '资质', '人员', '信用']}, ensure_ascii=False), 'QRCODE002', now),
]

cursor.executemany("""
    INSERT INTO offline_archives 
    (enterprise_id, user_id, archive_data, qr_code, downloaded_at)
    VALUES (?, ?, ?, ?, ?)
""", offline_archives_data)
print(f"✅ 离线档案数据初始化完成，共 {len(offline_archives_data)} 条\n")

# 用户数据
users_data = [
    ('admin', 'admin123', 'admin', '系统管理员', now),
    ('user1', 'user123', 'user', '中建八局', now),
]

cursor.executemany("""
    INSERT OR IGNORE INTO users 
    (username, password, role, company, created_at)
    VALUES (?, ?, ?, ?, ?)
""", users_data)
print(f"✅ 用户数据初始化完成，共 {len(users_data)} 条\n")

# 验证数据
print("✅ 数据验证:")
cursor.execute("SELECT COUNT(*) FROM enterprises")
print(f"  企业数量:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(*) FROM health_scores")
print(f"  健康评分数量:", cursor.fetchone()[0])

cursor.execute("SELECT COUNT(*) FROM business_abnormalities")
print(f"  经营异常数量:", cursor.fetchone()[0])

cursor.execute("SELECT id, data_source, source_url, processing_status, countdown_days FROM business_abnormalities LIMIT 1")
row = cursor.fetchone()
print(f"  经营异常示例:", row)

cursor.execute("SELECT id, personnel_score_details FROM health_scores WHERE personnel_score_details IS NOT NULL LIMIT 1")
row = cursor.fetchone()
print(f"  评分详情示例:", "存在" if row else "不存在")

conn.commit()
conn.close()

print("\n🎉 数据库初始化完成！")
