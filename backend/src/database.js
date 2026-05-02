const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function getDbPath() {
  const dbPath = process.env.DB_PATH || './data/app.sqlite';
  return path.resolve(__dirname, '..', dbPath);
}

function ensureDataDirectory() {
  const dbPath = getDbPath();
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function init() {
  ensureDataDirectory();
  const dbPath = getDbPath();
  console.log(`数据库路径: ${dbPath}`);
  
  db = new Database(dbPath);
  
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);
  
  createTables();
  createIndexes();
  insertInitialData();
  
  console.log('数据库初始化完成');
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      environment TEXT DEFAULT 'development',
      logic_topology TEXT,
      version INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      activated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      config TEXT,
      weight REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decision_logs (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      rule_id TEXT,
      rule_name TEXT,
      decision_result TEXT,
      decision_score REAL,
      features_snapshot TEXT,
      request_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES rules(id)
    );

    CREATE TABLE IF NOT EXISTS action_records (
      id TEXT PRIMARY KEY,
      decision_log_id TEXT,
      action_type TEXT,
      action_target TEXT,
      action_data TEXT,
      status TEXT DEFAULT 'pending',
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (decision_log_id) REFERENCES decision_logs(id)
    );

    CREATE TABLE IF NOT EXISTS manual_reviews (
      id TEXT PRIMARY KEY,
      decision_log_id TEXT,
      reviewer TEXT,
      review_result TEXT,
      review_comment TEXT,
      variable_adjustments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (decision_log_id) REFERENCES decision_logs(id)
    );

    CREATE TABLE IF NOT EXISTS backtest_tasks (
      id TEXT PRIMARY KEY,
      rule_id TEXT,
      name TEXT,
      status TEXT DEFAULT 'pending',
      test_data_source TEXT,
      test_config TEXT,
      result_report TEXT,
      optimization_suggestions TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (rule_id) REFERENCES rules(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      operator TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function createIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);
    CREATE INDEX IF NOT EXISTS idx_rules_environment ON rules(environment);
    CREATE INDEX IF NOT EXISTS idx_variables_code ON variables(code);
    CREATE INDEX IF NOT EXISTS idx_decision_logs_request_id ON decision_logs(request_id);
    CREATE INDEX IF NOT EXISTS idx_decision_logs_created_at ON decision_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_manual_reviews_status ON manual_reviews(review_result);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_backtest_tasks_status ON backtest_tasks(status);
  `);
}

function insertInitialData() {
  const variables = [
    { id: 'var-001', name: '用户登录频率', code: 'login_frequency', description: '每小时登录次数', type: 'number', source: 'real_time', config: JSON.stringify({ unit: 'per_hour' }) },
    { id: 'var-002', name: 'IP地址风险等级', code: 'ip_risk_level', description: '外部风险库评估的IP风险等级(0-10)', type: 'number', source: 'external', config: JSON.stringify({ provider: 'risk_db' }) },
    { id: 'var-003', name: '账户余额', code: 'account_balance', description: '用户账户当前余额', type: 'number', source: 'database', config: JSON.stringify({ table: 'users', field: 'balance' }) },
    { id: 'var-004', name: '设备指纹相似度', code: 'device_fingerprint_similarity', description: '与历史设备指纹的相似度(0-1)', type: 'number', source: 'real_time', config: JSON.stringify({ threshold: 0.8 }) },
    { id: 'var-005', name: '历史拒付次数', code: 'chargeback_count', description: '用户历史拒付交易次数', type: 'integer', source: 'database', config: JSON.stringify({ table: 'transactions', field: 'chargeback_count' }) },
  ];

  const insertVar = db.prepare(`
    INSERT OR IGNORE INTO variables (id, name, code, description, type, source, config)
    VALUES (@id, @name, @code, @description, @type, @source, @config)
  `);

  variables.forEach(v => insertVar.run(v));

  const rules = [
    { id: 'rule-001', name: '高风险IP拦截规则', description: '当IP风险等级超过阈值时拦截', status: 'active', environment: 'development', logic_topology: JSON.stringify({
      type: 'condition',
      variable: 'ip_risk_level',
      operator: '>',
      value: 7,
      trueAction: { type: 'decision', result: 'reject', score: 100 },
      falseAction: { type: 'decision', result: 'pass', score: 0 }
    })},
    { id: 'rule-002', name: '异常登录检测', description: '检测异常登录频率和设备变化', status: 'draft', environment: 'development', logic_topology: JSON.stringify({
      type: 'condition',
      variable: 'login_frequency',
      operator: '>',
      value: 10,
      trueAction: { 
        type: 'condition',
        variable: 'device_fingerprint_similarity',
        operator: '<',
        value: 0.6,
        trueAction: { type: 'decision', result: 'reject', score: 90 },
        falseAction: { type: 'decision', result: 'manual', score: 50 }
      },
      falseAction: { type: 'decision', result: 'pass', score: 10 }
    })}
  ];

  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO rules (id, name, description, status, environment, logic_topology)
    VALUES (@id, @name, @description, @status, @environment, @logic_topology)
  `);

  rules.forEach(r => insertRule.run(r));
}

function getDb() {
  if (!db) {
    throw new Error('数据库未初始化');
  }
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  init,
  getDb,
  close
};
