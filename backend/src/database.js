const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant_name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      phone TEXT NOT NULL,
      bank_card TEXT,
      status TEXT DEFAULT 'pending',
      risk_score INTEGER DEFAULT 0,
      final_decision TEXT,
      reviewer_id TEXT,
      review_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS identity_verification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      verify_type TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      raw_data TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      alias TEXT,
      source TEXT NOT NULL,
      risk_level TEXT DEFAULT 'high',
      status TEXT DEFAULT 'active',
      confirmed INTEGER DEFAULT 1,
      added_by TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS blacklist_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      blacklist_id INTEGER,
      hit_type TEXT NOT NULL,
      hit_value TEXT NOT NULL,
      match_score REAL,
      confirmed INTEGER DEFAULT 0,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (blacklist_id) REFERENCES blacklist(id)
    );

    CREATE TABLE IF NOT EXISTS device_fingerprint (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      canvas_fingerprint TEXT,
      webgl_fingerprint TEXT,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      relationship TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS risk_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT NOT NULL UNIQUE,
      rule_name TEXT NOT NULL,
      rule_version INTEGER DEFAULT 1,
      rule_type TEXT NOT NULL,
      description TEXT,
      score_weight INTEGER NOT NULL,
      condition_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rule_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      rule_id INTEGER NOT NULL,
      rule_version INTEGER NOT NULL,
      hit_value TEXT,
      score_deducted INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (rule_id) REFERENCES risk_rules(id)
    );

    CREATE TABLE IF NOT EXISTS review_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      previous_decision TEXT,
      new_decision TEXT NOT NULL,
      review_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS application_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_application_id TEXT NOT NULL,
      to_application_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      relation_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_application_id) REFERENCES applications(id),
      FOREIGN KEY (to_application_id) REFERENCES applications(id)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_id_card ON applications(id_card);
    CREATE INDEX IF NOT EXISTS idx_applications_phone ON applications(phone);
    CREATE INDEX IF NOT EXISTS idx_blacklist_type_value ON blacklist(type, value);
    CREATE INDEX IF NOT EXISTS idx_device_fingerprint_device_id ON device_fingerprint(device_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
  `);

  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM risk_rules').get().count;
  if (ruleCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO risk_rules (rule_code, rule_name, rule_version, rule_type, description, score_weight, condition_json)
      VALUES (?, ?, 1, ?, ?, ?, ?)
    `);
    
    const rules = [
      ['BLACKLIST_HIT', '黑名单命中', 'blacklist', '证件/手机号/设备在黑名单中', 50, '{"types":["id_card","phone","device"]}'],
      ['SAME_DEVICE_MULTI_APP', '同设备多申请', 'device', '同一设备24小时内申请超过3次', 30, '{"max_count":3,"time_window_hours":24}'],
      ['CONTACT_CIRCULAR_GUARANTEE', '联系人循环担保', 'contact', '联系人存在循环担保关系', 25, '{"depth":3}'],
      ['LOW_CONTACT_COMPLETENESS', '联系人完整度低', 'contact', '联系人数量少于2个', 15, '{"min_contacts":2}'],
      ['DEVICE_ANOMALY', '设备异常', 'device', '设备指纹异常或IP高风险', 20, '{}']
    ];
    
    rules.forEach(rule => insertRule.run(...rule));
  }

  const blacklistCount = db.prepare('SELECT COUNT(*) as count FROM blacklist').get().count;
  if (blacklistCount === 0) {
    const insertBlacklist = db.prepare(`
      INSERT INTO blacklist (type, value, alias, source, risk_level, confirmed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const blacklistItems = [
      ['id_card', '110101199001011234', '张三', '历史逾期', 'high', 1],
      ['phone', '13800138000', '李四手机号', '欺诈案件', 'high', 1],
      ['device', 'device_fraud_001', null, '风控系统', 'high', 1],
      ['bank_card', '6222021234567890123', null, '涉案账户', 'high', 1]
    ];
    
    blacklistItems.forEach(item => insertBlacklist.run(...item));
  }
}

initDatabase();

module.exports = db;
