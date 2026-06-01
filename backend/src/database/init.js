const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

db.exec(`
  DROP TABLE IF EXISTS review_evidences;
  DROP TABLE IF EXISTS rectifications;
  DROP TABLE IF EXISTS risks;
  DROP TABLE IF EXISTS audit_materials;
  DROP TABLE IF EXISTS audits;
  DROP TABLE IF EXISTS rules;
  DROP TABLE IF EXISTS materials;
  DROP TABLE IF EXISTS operation_logs;
  DROP TABLE IF EXISTS exceptions;
  DROP TABLE IF EXISTS users;
`);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('business_owner', 'model_ops', 'auditor', 'user')),
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('policy', 'regulation', 'document', 'evidence')),
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('high', 'medium', 'low')),
    conditions TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
  );

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'risk_detected', 'rectifying', 'reviewing', 'completed', 'rejected')),
    current_rule_version TEXT,
    assignee_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    previous_node_id TEXT,
    previous_conclusion TEXT,
    risk_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT REFERENCES audits(id) ON DELETE CASCADE,
    material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(audit_id, material_id)
  );

  CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    audit_id TEXT REFERENCES audits(id) ON DELETE CASCADE,
    rule_id TEXT REFERENCES rules(id),
    rule_version TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('high', 'medium', 'low')),
    location TEXT,
    matched_text TEXT,
    status TEXT NOT NULL CHECK(status IN ('open', 'confirmed', 'false_positive', 'rectified')),
    detected_by INTEGER REFERENCES users(id),
    confirmed_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rectifications (
    id TEXT PRIMARY KEY,
    risk_id TEXT REFERENCES risks(id) ON DELETE CASCADE,
    audit_id TEXT REFERENCES audits(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
    assignee_id INTEGER REFERENCES users(id),
    due_date DATETIME,
    action_plan TEXT,
    completion_note TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS review_evidences (
    id TEXT PRIMARY KEY,
    rectification_id TEXT REFERENCES rectifications(id) ON DELETE CASCADE,
    audit_id TEXT REFERENCES audits(id),
    material_id TEXT REFERENCES materials(id),
    description TEXT,
    reviewer_id INTEGER REFERENCES users(id),
    conclusion TEXT NOT NULL CHECK(conclusion IN ('pass', 'fail', 'need_more')),
    review_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT REFERENCES audits(id),
    risk_id TEXT REFERENCES risks(id),
    rectification_id TEXT REFERENCES rectifications(id),
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT,
    risk_id TEXT,
    operation_type TEXT,
    original_request TEXT,
    error_message TEXT,
    error_stack TEXT,
    compensation_action TEXT,
    manual_note TEXT,
    handled_by INTEGER REFERENCES users(id),
    is_resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
  CREATE INDEX IF NOT EXISTS idx_audits_assignee ON audits(assignee_id);
  CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at);
  CREATE INDEX IF NOT EXISTS idx_risks_audit ON risks(audit_id);
  CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
  CREATE INDEX IF NOT EXISTS idx_rectifications_assignee ON rectifications(assignee_id);
  CREATE INDEX IF NOT EXISTS idx_rectifications_status ON rectifications(status);
  CREATE INDEX IF NOT EXISTS idx_operation_logs_audit ON operation_logs(audit_id);
  CREATE INDEX IF NOT EXISTS idx_exceptions_resolved ON exceptions(is_resolved);
`);

const userStmt = db.prepare('INSERT OR IGNORE INTO users (username, name, role, email) VALUES (?, ?, ?, ?)');
userStmt.run('owner1', '张经理', 'business_owner', 'zhang@example.com');
userStmt.run('ops1', '李运营', 'model_ops', 'li@example.com');
userStmt.run('auditor1', '王审核', 'auditor', 'wang@example.com');
userStmt.run('user1', '赵使用者', 'user', 'zhao@example.com');

const ruleStmt = db.prepare('INSERT OR IGNORE INTO rules (id, name, version, description, category, risk_level, conditions) VALUES (?, ?, ?, ?, ?, ?, ?)');
ruleStmt.run('rule_001_v1', '敏感数据泄露检测', 'v1.0', '检测是否包含用户隐私数据（手机号、身份证、银行卡、邮箱等）', 'data_privacy', 'high', JSON.stringify({
  type: 'regex',
  patterns: [
    { name: '手机号', regex: '1[3-9]\\d{9}', desc: '中国大陆手机号' },
    { name: '身份证号', regex: '[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]', desc: '18位身份证号' },
    { name: '银行卡号', regex: '\\d{16,19}', desc: '银行卡号' },
    { name: '电子邮箱', regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', desc: '电子邮箱地址' }
  ]
}));
ruleStmt.run('rule_002_v1', '违规内容检测', 'v1.0', '检测是否包含违规言论或敏感词', 'content_safety', 'medium', JSON.stringify({
  type: 'keyword',
  keywords: ['色情', '赌博', '暴力', '毒品', '反动', '邪教', '法轮功']
}));
ruleStmt.run('rule_003_v1', '模型输出合规', 'v1.0', '检测模型输出是否包含拒绝回答或合规提示', 'model_output', 'low', JSON.stringify({
  type: 'keyword',
  keywords: ['我不能', '无法回答', '请联系', '不符合规定', '抱歉', '无法提供']
}));

db.close();
console.log('Database initialized successfully');
