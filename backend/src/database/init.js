const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function ensureDataDir() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function initDatabase(dbPath = './data/app.sqlite') {
  ensureDataDir();
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL DEFAULT '1.0.0',
      status TEXT NOT NULL DEFAULT 'draft',
      topology TEXT,
      weight_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      description TEXT,
      source_type TEXT,
      source_config TEXT,
      weight REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS decision_records (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      rule_id TEXT,
      rule_version TEXT,
      decision_result TEXT NOT NULL,
      score REAL,
      variables_snapshot TEXT,
      matched_conditions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_records (
      id TEXT PRIMARY KEY,
      decision_id TEXT,
      action_type TEXT NOT NULL,
      target_id TEXT,
      target_type TEXT,
      action_config TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_by TEXT,
      status TEXT DEFAULT 'completed'
    );

    CREATE TABLE IF NOT EXISTS review_tasks (
      id TEXT PRIMARY KEY,
      decision_id TEXT,
      risk_level TEXT,
      current_status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      review_result TEXT,
      review_comment TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backtest_runs (
      id TEXT PRIMARY KEY,
      rule_id TEXT,
      rule_version TEXT,
      start_date DATETIME,
      end_date DATETIME,
      status TEXT DEFAULT 'running',
      result_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS backtest_results (
      id TEXT PRIMARY KEY,
      backtest_id TEXT,
      original_decision TEXT,
      simulated_decision TEXT,
      matched_rules TEXT,
      variables_snapshot TEXT,
      analysis_comment TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operator TEXT,
      operator_role TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);
    CREATE INDEX IF NOT EXISTS idx_variables_code ON variables(code);
    CREATE INDEX IF NOT EXISTS idx_decision_records_request ON decision_records(request_id);
    CREATE INDEX IF NOT EXISTS idx_decision_records_rule ON decision_records(rule_id);
    CREATE INDEX IF NOT EXISTS idx_review_tasks_status ON review_tasks(current_status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);

  const variables = [
    { id: 'var_user_login_count', name: '用户登录次数', code: 'user_login_count', type: 'integer', description: '近24小时用户登录次数', source_type: 'realtime', source_config: '{"source":"user_activity","field":"login_count"}', weight: 1.0 },
    { id: 'var_ip_blacklist', name: 'IP黑名单', code: 'ip_blacklist', type: 'boolean', description: 'IP是否在黑名单中', source_type: 'realtime', source_config: '{"source":"ip_security","field":"is_blacklisted"}', weight: 1.5 },
    { id: 'var_device_new', name: '新设备登录', code: 'device_new', type: 'boolean', description: '是否是新设备首次登录', source_type: 'realtime', source_config: '{"source":"device_info","field":"is_new_device"}', weight: 1.2 },
    { id: 'var_transaction_amount', name: '交易金额', code: 'transaction_amount', type: 'float', description: '单笔交易金额', source_type: 'request', source_config: '{"field":"amount"}', weight: 1.0 },
    { id: 'var_account_age_days', name: '账户注册天数', code: 'account_age_days', type: 'integer', description: '账户注册天数', source_type: 'profile', source_config: '{"source":"user_profile","field":"account_age_days"}', weight: 0.8 },
    { id: 'var_risk_region', name: '风险地区', code: 'risk_region', type: 'boolean', description: '是否来自高风险地区', source_type: 'realtime', source_config: '{"source":"geo_ip","field":"is_high_risk_region"}', weight: 1.3 },
    { id: 'var_consecutive_failures', name: '连续失败次数', code: 'consecutive_failures', type: 'integer', description: '连续登录失败次数', source_type: 'realtime', source_config: '{"source":"security_events","field":"consecutive_failures"}', weight: 1.4 }
  ];

  const insertVar = db.prepare(`INSERT OR IGNORE INTO variables (id, name, code, type, description, source_type, source_config, weight) VALUES (@id, @name, @code, @type, @description, @source_type, @source_config, @weight)`);
  
  for (const v of variables) {
    insertVar.run(v);
  }

  console.log('数据库初始化完成');
  return db;
}

module.exports = { initDatabase };
