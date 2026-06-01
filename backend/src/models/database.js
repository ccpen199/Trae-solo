const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      connection_config TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS field_calibers (
      id TEXT PRIMARY KEY,
      data_source_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      caliber_definition TEXT NOT NULL,
      data_type TEXT,
      business_meaning TEXT,
      calculation_formula TEXT,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
    );

    CREATE TABLE IF NOT EXISTS field_caliber_history (
      id TEXT PRIMARY KEY,
      field_caliber_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      caliber_definition TEXT NOT NULL,
      version INTEGER NOT NULL,
      changed_by TEXT NOT NULL,
      change_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (field_caliber_id) REFERENCES field_calibers(id)
    );

    CREATE TABLE IF NOT EXISTS cleaning_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      rule_content TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS query_tasks (
      id TEXT PRIMARY KEY,
      task_name TEXT NOT NULL,
      data_source_id TEXT,
      query_sql TEXT,
      description TEXT,
      owner TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      priority TEXT DEFAULT 'normal',
      assignee TEXT,
      due_date TEXT,
      result_table_id TEXT,
      explanation_report_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      submitted_at TEXT,
      executed_at TEXT,
      reviewed_at TEXT,
      closed_at TEXT,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
    );

    CREATE TABLE IF NOT EXISTS task_workflow_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      reason TEXT,
      previous_status TEXT,
      new_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES query_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS result_tables (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_count INTEGER DEFAULT 0,
      anomaly_count INTEGER DEFAULT 0,
      execution_time INTEGER,
      status TEXT DEFAULT 'pending',
      data_preview TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES query_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS anomaly_records (
      id TEXT PRIMARY KEY,
      result_table_id TEXT NOT NULL,
      anomaly_type TEXT NOT NULL,
      field_name TEXT,
      anomaly_value TEXT,
      expected_value TEXT,
      description TEXT,
      severity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      detection_time TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (result_table_id) REFERENCES result_tables(id)
    );

    CREATE TABLE IF NOT EXISTS explanation_reports (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      root_cause TEXT,
      impact_analysis TEXT,
      recommendations TEXT,
      status TEXT DEFAULT 'draft',
      reviewed_by TEXT,
      review_comments TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES query_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS report_attachments (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES explanation_reports(id)
    );

    CREATE TABLE IF NOT EXISTS configuration_rules (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      rule_value TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      effective_date TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exception_handlings (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      exception_type TEXT NOT NULL,
      exception_detail TEXT,
      handling_result TEXT NOT NULL,
      handler TEXT,
      comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (task_id) REFERENCES query_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const stmt = db.prepare("SELECT COUNT(*) as count FROM permissions");
  const result = stmt.get();
  if (result.count === 0) {
    const initPermissions = db.prepare(`
      INSERT INTO permissions (id, user_id, user_name, role, permissions, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    initPermissions.run(
      'perm-admin-001',
      'admin',
      '系统管理员',
      'admin',
      JSON.stringify(['all']),
      'system'
    );
    initPermissions.run(
      'perm-business-001',
      'business_owner',
      '业务负责人',
      'business_owner',
      JSON.stringify(['task:create', 'task:view', 'task:review', 'report:view']),
      'system'
    );
    initPermissions.run(
      'perm-operator-001',
      'operator',
      '模型运营',
      'operator',
      JSON.stringify(['task:create', 'task:view', 'task:execute', 'config:view']),
      'system'
    );
    initPermissions.run(
      'perm-auditor-001',
      'auditor',
      '审核人员',
      'auditor',
      JSON.stringify(['task:view', 'task:review', 'report:view', 'log:view']),
      'system'
    );
    initPermissions.run(
      'perm-user-001',
      'user',
      '一线使用者',
      'user',
      JSON.stringify(['task:create', 'task:view', 'report:view']),
      'system'
    );
  }

  const dsCount = db.prepare("SELECT COUNT(*) as count FROM data_sources").get();
  if (dsCount.count === 0) {
    const initDS = db.prepare(`
      INSERT INTO data_sources (id, name, type, connection_config, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    initDS.run(
      'ds-sales-001',
      '销售数据库',
      'mysql',
      JSON.stringify({ host: '127.0.0.1', port: 3306, database: 'sales' }),
      '核心销售业务数据库',
      'system'
    );
    initDS.run(
      'ds-user-001',
      '用户行为库',
      'clickhouse',
      JSON.stringify({ host: '127.0.0.1', port: 8123, database: 'user_behavior' }),
      '用户行为分析数据库',
      'system'
    );
  }

  const fcCount = db.prepare("SELECT COUNT(*) as count FROM field_calibers").get();
  if (fcCount.count === 0) {
    const initFC = db.prepare(`
      INSERT INTO field_calibers (id, data_source_id, field_name, caliber_definition, data_type, business_meaning, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    initFC.run(
      'fc-gmv-001',
      'ds-sales-001',
      'GMV',
      '商品成交总额，包含退款订单',
      'decimal',
      '衡量平台整体交易规模的核心指标',
      'system'
    );
    initFC.run(
      'fc-dau-001',
      'ds-user-001',
      'DAU',
      '日活跃用户数，当日有访问行为的独立用户',
      'integer',
      '产品活跃度核心指标',
      'system'
    );
  }

  const crCount = db.prepare("SELECT COUNT(*) as count FROM cleaning_rules").get();
  if (crCount.count === 0) {
    const initCR = db.prepare(`
      INSERT INTO cleaning_rules (id, name, rule_type, rule_content, priority, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    initCR.run(
      'cr-null-001',
      '空值过滤',
      'null_filter',
      '过滤掉关键字段为空的记录',
      100,
      'system'
    );
    initCR.run(
      'cr-outlier-001',
      '异常值检测',
      'outlier_detect',
      '使用3σ原则检测数值型字段异常值',
      80,
      'system'
    );
  }

  const cfgCount = db.prepare("SELECT COUNT(*) as count FROM configuration_rules").get();
  if (cfgCount.count === 0) {
    const initCfg = db.prepare(`
      INSERT INTO configuration_rules (id, category, rule_name, rule_value, description, owner, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    initCfg.run(
      'cfg-price-001',
      'price',
      '价格异常阈值',
      '3',
      '价格偏离均值超过3倍标准差视为异常',
      '业务负责人',
      'system'
    );
    initCfg.run(
      'cfg-perm-001',
      'permission',
      '敏感数据访问审批',
      'true',
      '访问敏感数据需要审批',
      '系统管理员',
      'system'
    );
  }

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };
