const path = require('path');
const fs = require('fs');

// 优先从根目录加载 better-sqlite3
let Database;
try {
  Database = require(path.join(__dirname, '../../../node_modules/better-sqlite3'));
} catch (e) {
  Database = require('better-sqlite3');
}

const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
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
    );

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
    );

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
    );

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
    );

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
    );

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
    );

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
    );

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
    );

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
    );

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
    );
    
    -- 为现有表添加新字段（如果不存在）
    PRAGMA table_info(risk_rules);
    -- 注：SQLite 不支持 IF NOT EXISTS 在 ADD COLUMN，需要程序判断
    

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
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      company TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offline_archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      user_id INTEGER,
      archive_data TEXT,
      qr_code TEXT,
      downloaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    );

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
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    );

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
    );

    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      endpoint TEXT,
      method TEXT,
      params TEXT,
      status_code INTEGER,
      response_time INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const initStmt = db.prepare(`SELECT COUNT(*) as count FROM enterprises`);
  const result = initStmt.get();
  if (result.count === 0) {
    require('../seed/init-data')(db);
  }
  ensureHealthScores();
  ensureRepairApplications();
  ensureDemoReports();
  ensureOfflineArchives();
  migrateRiskRulesTable();
  migrateAbnormalitiesTable();
  migrateBidRiggingTable();
  migrateBlacklistTable();
  migrateHealthScoresTable();
}

function migrateRiskRulesTable() {
  const columns = db.prepare("PRAGMA table_info(risk_rules)").all();
  const colNames = columns.map(c => c.name);
  
  if (!colNames.includes('enterprise_id')) {
    db.prepare(`ALTER TABLE risk_rules ADD COLUMN enterprise_id INTEGER`).run();
  }
  if (!colNames.includes('hit_count')) {
    db.prepare(`ALTER TABLE risk_rules ADD COLUMN hit_count INTEGER DEFAULT 0`).run();
  }
  if (!colNames.includes('last_hit_at')) {
    db.prepare(`ALTER TABLE risk_rules ADD COLUMN last_hit_at TEXT`).run();
  }
  
  const rules = db.prepare(`SELECT id, user_id FROM risk_rules WHERE enterprise_id IS NULL`).all();
  const update = db.prepare(`UPDATE risk_rules SET enterprise_id = ? WHERE id = ?`);
  rules.forEach((r, idx) => {
    update.run((idx % 10) + 1, r.id);
  });
}

function migrateAbnormalitiesTable() {
  const columns = db.prepare("PRAGMA table_info(business_abnormalities)").all();
  const colNames = columns.map(c => c.name);
  const fields = [
    ['data_source', 'TEXT'],
    ['data_updated_at', 'TEXT'],
    ['source_url', 'TEXT'],
    ['processing_status', 'TEXT DEFAULT \'待处理\''],
    ['processing_result', 'TEXT'],
    ['processing_time', 'TEXT'],
    ['reviewer', 'TEXT'],
    ['review_result', 'TEXT'],
    ['review_time', 'TEXT'],
    ['display_deadline', 'TEXT'],
    ['countdown_days', 'INTEGER'],
    ['expiry_status', 'TEXT DEFAULT \'公示中\'']
  ];
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      db.prepare(`ALTER TABLE business_abnormalities ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const update = db.prepare(`
    UPDATE business_abnormalities 
    SET data_source = ?, data_updated_at = ?, source_url = ?, 
        processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?
    WHERE data_source IS NULL
  `);
  const records = db.prepare(`SELECT id, decision_date FROM business_abnormalities WHERE data_source IS NULL`).all();
  records.forEach(r => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    update.run(
      '国家企业信用信息公示系统',
      now,
      'http://www.gsxt.gov.cn',
      '待处理',
      deadline,
      days,
      '公示中'
    );
  });
}

function migrateBidRiggingTable() {
  const columns = db.prepare("PRAGMA table_info(bid_rigging_suspects)").all();
  const colNames = columns.map(c => c.name);
  const fields = [
    ['data_source', 'TEXT'],
    ['data_updated_at', 'TEXT'],
    ['source_url', 'TEXT'],
    ['processing_status', 'TEXT DEFAULT \'待核实\''],
    ['processing_result', 'TEXT'],
    ['processing_time', 'TEXT'],
    ['reviewer', 'TEXT'],
    ['review_result', 'TEXT'],
    ['review_time', 'TEXT'],
    ['display_deadline', 'TEXT'],
    ['countdown_days', 'INTEGER'],
    ['expiry_status', 'TEXT DEFAULT \'公示中\'']
  ];
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      db.prepare(`ALTER TABLE bid_rigging_suspects ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const update = db.prepare(`
    UPDATE bid_rigging_suspects 
    SET data_source = ?, data_updated_at = ?, source_url = ?, 
        processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?
    WHERE data_source IS NULL
  `);
  const records = db.prepare(`SELECT id FROM bid_rigging_suspects WHERE data_source IS NULL`).all();
  records.forEach(r => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    update.run(
      '全国公共资源交易平台',
      now,
      'http://www.ggzy.gov.cn',
      '待核实',
      deadline,
      days,
      '公示中'
    );
  });
}

function migrateBlacklistTable() {
  const columns = db.prepare("PRAGMA table_info(subcontractor_blacklist)").all();
  const colNames = columns.map(c => c.name);
  const fields = [
    ['data_source', 'TEXT'],
    ['data_updated_at', 'TEXT'],
    ['source_url', 'TEXT'],
    ['processing_status', 'TEXT DEFAULT \'待处理\''],
    ['processing_result', 'TEXT'],
    ['processing_time', 'TEXT'],
    ['reviewer', 'TEXT'],
    ['review_result', 'TEXT'],
    ['review_time', 'TEXT'],
    ['display_deadline', 'TEXT'],
    ['countdown_days', 'INTEGER'],
    ['expiry_status', 'TEXT DEFAULT \'公示中\''],
    ['credit_repair_available', 'INTEGER DEFAULT 1'],
    ['credit_repair_status', 'TEXT'],
    ['credit_repair_application_id', 'INTEGER']
  ];
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      db.prepare(`ALTER TABLE subcontractor_blacklist ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const update = db.prepare(`
    UPDATE subcontractor_blacklist 
    SET data_source = ?, data_updated_at = ?, source_url = ?, 
        processing_status = ?, display_deadline = ?, countdown_days = ?, expiry_status = ?,
        credit_repair_available = ?
    WHERE data_source IS NULL
  `);
  const records = db.prepare(`SELECT id FROM subcontractor_blacklist WHERE data_source IS NULL`).all();
  records.forEach(r => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    update.run(
      '全国建筑市场监管公共服务平台',
      now,
      'http://jzsc.mohurd.gov.cn',
      '待处理',
      deadline,
      days,
      '公示中',
      1
    );
  });
}

function migrateHealthScoresTable() {
  const columns = db.prepare("PRAGMA table_info(health_scores)").all();
  const colNames = columns.map(c => c.name);
  const fields = [
    ['business_score_details', 'TEXT'],
    ['judicial_score_details', 'TEXT'],
    ['bidding_score_details', 'TEXT'],
    ['qualification_score_details', 'TEXT'],
    ['personnel_score_details', 'TEXT'],
    ['credit_score_details', 'TEXT']
  ];
  fields.forEach(([name, type]) => {
    if (!colNames.includes(name)) {
      db.prepare(`ALTER TABLE health_scores ADD COLUMN ${name} ${type}`).run();
    }
  });
  
  const details = {
    business: [
      { source: '工商登记信息', deduction: 0, reason: '信息完整', record_id: 'bus-001' },
      { source: '年报公示', deduction: 2, reason: '年报逾期30天', record_id: 'bus-002' },
      { source: '经营异常记录', deduction: 3, reason: '存在经营异常记录', record_id: 'abn-001' }
    ],
    judicial: [
      { source: '裁判文书网', deduction: 3, reason: '存在合同纠纷判决', record_id: 'jud-001' },
      { source: '失信被执行人', deduction: 0, reason: '无失信记录', record_id: 'jud-002' },
      { source: '被执行人信息', deduction: 2, reason: '存在被执行记录', record_id: 'jud-003' }
    ],
    personnel: [
      { source: '注册建造师', deduction: 0, reason: '人员配置完整', record_id: 'per-001' },
      { source: '技术职称', deduction: 0, reason: '职称人员达标', record_id: 'per-002' }
    ],
    credit: [
      { source: '行政处罚记录', deduction: 3, reason: '存在行政处罚记录', record_id: 'cre-001' },
      { source: '信用评价', deduction: 2, reason: '信用等级一般', record_id: 'cre-002' }
    ]
  };
  
  const update = db.prepare(`
    UPDATE health_scores 
    SET personnel_score_details = ?, credit_score_details = ?,
        business_score_details = ?, judicial_score_details = ?
    WHERE personnel_score_details IS NULL
  `);
  const scores = db.prepare(`SELECT id FROM health_scores WHERE personnel_score_details IS NULL`).all();
  scores.forEach(s => {
    update.run(
      JSON.stringify(details.personnel),
      JSON.stringify(details.credit),
      JSON.stringify(details.business),
      JSON.stringify(details.judicial)
    );
  });
}

function ensureHealthScores() {
  const enterprises = db.prepare(`SELECT id, status FROM enterprises ORDER BY id`).all();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO health_scores (
      enterprise_id, total_score, business_score, judicial_score, bidding_score,
      qualification_score, personnel_score, credit_score, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  enterprises.forEach((enterprise, index) => {
    const judicialCount = db.prepare(`SELECT COUNT(*) as count FROM judicial_records WHERE enterprise_id = ?`).get(enterprise.id).count;
    const creditRiskCount = db.prepare(`
      SELECT COUNT(*) as count FROM credit_records
      WHERE enterprise_id = ? AND credit_type IN ('失信被执行人', '行政处罚', '重大税收违法')
    `).get(enterprise.id).count;
    const abnormalCount = db.prepare(`SELECT COUNT(*) as count FROM business_abnormalities WHERE enterprise_id = ? AND status = '未移除'`).get(enterprise.id).count;
    const blacklistCount = db.prepare(`SELECT COUNT(*) as count FROM subcontractor_blacklist WHERE enterprise_id = ? AND status = '黑名单中'`).get(enterprise.id).count;

    const business = Math.max(8, 25 - abnormalCount * 7 - (enterprise.status === '经营异常' ? 5 : 0));
    const judicial = Math.max(5, 25 - judicialCount * 5);
    const bidding = Math.max(8, 15 - (blacklistCount ? 4 : 0));
    const qualification = Math.max(6, 15 - (enterprise.status === '经营异常' ? 4 : 0));
    const personnel = Math.max(5, 10 - Math.min(3, index % 4));
    const credit = Math.max(1, 10 - creditRiskCount * 4 - blacklistCount * 4);
    const total = business + judicial + bidding + qualification + personnel + credit;
    const riskLevel = total < 60 ? '高风险' : total < 80 ? '中风险' : '低风险';

    insert.run(enterprise.id, total, business, judicial, bidding, qualification, personnel, credit, riskLevel);
  });
}

function ensureRepairApplications() {
  const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM credit_repair_applications WHERE status = 'pending'`).get().count;
  if (pendingCount > 0) return;

  const record = db.prepare(`
    SELECT c.id, c.enterprise_id, e.name
    FROM credit_records c
    JOIN enterprises e ON c.enterprise_id = e.id
    WHERE c.repair_status IN ('修复中', '待审核', '未修复')
    ORDER BY c.id DESC
    LIMIT 1
  `).get();
  if (!record) return;

  const now = new Date().toISOString();
  db.prepare(`UPDATE credit_records SET repair_status = '待审核' WHERE id = ?`).run(record.id);
  db.prepare(`
    INSERT INTO credit_repair_applications (
      credit_record_id, enterprise_id, applicant, description, proof_file, status, submitted_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    record.id,
    record.enterprise_id,
    record.name,
    '已完成整改并上传主管部门盖章证明，等待人工复核',
    '/uploads/demo-repair-proof.pdf',
    now
  );
}

function ensureDemoReports() {
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM due_diligence_reports`).get();
  if (count > 0) return;

  const enterprise = db.prepare(`
    SELECT e.id, e.name
    FROM enterprises e
    JOIN health_scores h ON h.enterprise_id = e.id
    ORDER BY h.total_score ASC
    LIMIT 1
  `).get();
  if (!enterprise) return;

  const reportsDir = path.resolve(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const filePath = path.join(reportsDir, 'demo_due_diligence_report.pdf');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj',
      '4 0 obj << /Length 74 >> stream',
      'BT /F1 12 Tf 72 720 Td (Demo due diligence report generated for local review.) Tj ET',
      'endstream endobj',
      'xref',
      '0 5',
      '0000000000 65535 f ',
      '0000000009 00000 n ',
      '0000000058 00000 n ',
      '0000000115 00000 n ',
      '0000000204 00000 n ',
      'trailer << /Root 1 0 R /Size 5 >>',
      'startxref',
      '328',
      '%%EOF',
      ''
    ].join('\n'));
  }

  db.prepare(`
    INSERT INTO due_diligence_reports (
      enterprise_id, user_id, report_name, report_type, file_path, status, created_at
    ) VALUES (?, 1, ?, 'standard', ?, '已完成', ?)
  `).run(
    enterprise.id,
    `${enterprise.name}尽调报告`,
    filePath,
    new Date().toISOString()
  );
}

function ensureOfflineArchives() {
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM offline_archives WHERE user_id = 1`).get();
  if (count > 0) return;

  const enterprise = db.prepare(`
    SELECT e.*, h.total_score, h.risk_level,
           h.business_score, h.judicial_score, h.bidding_score,
           h.qualification_score, h.personnel_score, h.credit_score
    FROM enterprises e
    LEFT JOIN health_scores h ON h.enterprise_id = e.id
    ORDER BY COALESCE(h.total_score, 100) ASC
    LIMIT 1
  `).get();
  if (!enterprise) return;

  const enterpriseId = enterprise.id;
  const archiveData = {
    enterprise,
    judicial: db.prepare(`SELECT * FROM judicial_records WHERE enterprise_id = ?`).all(enterpriseId),
    bidding: db.prepare(`SELECT * FROM bidding_records WHERE enterprise_id = ?`).all(enterpriseId),
    qualification: db.prepare(`SELECT * FROM qualifications WHERE enterprise_id = ?`).all(enterpriseId),
    personnel: db.prepare(`SELECT * FROM personnel WHERE enterprise_id = ?`).all(enterpriseId),
    credit: db.prepare(`SELECT * FROM credit_records WHERE enterprise_id = ?`).all(enterpriseId),
    abnormal: db.prepare(`SELECT * FROM business_abnormalities WHERE enterprise_id = ?`).all(enterpriseId),
    archivedAt: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO offline_archives (enterprise_id, user_id, archive_data, qr_code, downloaded_at)
    VALUES (?, 1, ?, NULL, ?)
  `).run(enterpriseId, JSON.stringify(archiveData), new Date().toISOString());
}

module.exports = { db, initDatabase };
