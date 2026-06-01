const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('platform_engineer', 'ops', 'developer', 'app_owner', 'security_admin')),
      name TEXT NOT NULL,
      email TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_key TEXT UNIQUE NOT NULL,
      app_name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      owner_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      env_name TEXT NOT NULL,
      env_type TEXT NOT NULL CHECK(env_type IN ('dev', 'test', 'staging', 'prod')),
      db_type TEXT NOT NULL CHECK(db_type IN ('mysql', 'postgresql', 'oracle', 'mongodb', 'redis')),
      db_host TEXT NOT NULL,
      db_port INTEGER NOT NULL,
      db_name TEXT NOT NULL,
      db_user TEXT NOT NULL,
      db_password_encrypted TEXT NOT NULL,
      connection_string TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_id, env_name)
    );

    CREATE TABLE IF NOT EXISTS migration_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      description TEXT,
      script_content TEXT NOT NULL,
      script_hash TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'deployed')),
      created_by INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      UNIQUE(app_id, version)
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      app_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      env_id INTEGER NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
      version_id INTEGER REFERENCES migration_versions(id),
      task_type TEXT NOT NULL CHECK(task_type IN ('migrate', 'rollback', 'validate')),
      status TEXT DEFAULT 'created' CHECK(status IN ('created', 'submitted', 'executing', 'success', 'failed', 'rollbacked', 'reviewing', 'rejected', 'closed')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
      scheduled_at DATETIME,
      executed_at DATETIME,
      completed_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      executed_by INTEGER REFERENCES users(id),
      reviewed_by INTEGER REFERENCES users(id),
      review_result TEXT CHECK(review_result IN ('auto_approve', 'manual_review', 'observe', 'closed')),
      close_reason TEXT,
      reject_reason TEXT,
      rollback_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES execution_tasks(id) ON DELETE CASCADE,
      log_level TEXT NOT NULL CHECK(log_level IN ('info', 'warn', 'error', 'debug')),
      log_type TEXT NOT NULL CHECK(log_type IN ('create', 'submit', 'execute', 'review', 'reject', 'close', 'rollback')),
      message TEXT NOT NULL,
      details TEXT,
      operator_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES execution_tasks(id),
      api_name TEXT NOT NULL,
      request_method TEXT NOT NULL,
      request_url TEXT NOT NULL,
      request_headers TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_body TEXT,
      duration_ms INTEGER,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      task_id INTEGER NOT NULL REFERENCES execution_tasks(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL REFERENCES applications(id),
      change_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'executed', 'closed')),
      approver_id INTEGER REFERENCES users(id),
      approved_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL CHECK(alert_type IN ('duplicate_execution', 'permission_violation', 'config_misdispatch', 'task_failure', 'sensitive_leak')),
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      task_id INTEGER REFERENCES execution_tasks(id),
      app_id INTEGER REFERENCES applications(id),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'auto_blocked', 'manual_review', 'observing', 'closed')),
      handled_by INTEGER REFERENCES users(id),
      handled_at DATETIME,
      handle_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS config_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('permission', 'category', 'security', 'workflow')),
      rule_content TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER REFERENCES users(id),
      valid_from DATETIME,
      valid_to DATETIME,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permission_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      task_id INTEGER REFERENCES execution_tasks(id),
      version_id INTEGER REFERENCES migration_versions(id),
      uploaded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      operation TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name, email, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);

    insertUser.run('admin', hashedPassword, 'platform_engineer', '系统管理员', 'admin@example.com');
    insertUser.run('ops_user', hashedPassword, 'ops', '运维人员', 'ops@example.com');
    insertUser.run('dev_user', hashedPassword, 'developer', '开发人员', 'dev@example.com');
    insertUser.run('owner_user', hashedPassword, 'app_owner', '应用负责人', 'owner@example.com');
    insertUser.run('sec_user', hashedPassword, 'security_admin', '安全管理员', 'sec@example.com');
  }

  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  if (appCount === 0) {
    db.exec(`
      INSERT INTO applications (app_key, app_name, description, category, owner_id, status, created_by)
      VALUES 
        ('order-service', '订单服务', '核心订单处理服务', 'business', 1, 'active', 1),
        ('user-service', '用户服务', '用户管理服务', 'business', 1, 'active', 1),
        ('payment-service', '支付服务', '支付处理服务', 'payment', 1, 'active', 1);
    `);
  }

  const envCount = db.prepare('SELECT COUNT(*) as count FROM environments').get().count;
  if (envCount === 0) {
    db.exec(`
      INSERT INTO environments (app_id, env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, status, created_by)
      VALUES 
        (1, '开发环境', 'dev', 'mysql', '127.0.0.1', 3306, 'order_dev', 'root', 'encrypted_pass_123', 'active', 1),
        (1, '生产环境', 'prod', 'mysql', '10.0.0.1', 3306, 'order_prod', 'admin', 'encrypted_prod_123', 'active', 1),
        (2, '开发环境', 'dev', 'postgresql', '127.0.0.1', 5432, 'user_dev', 'postgres', 'encrypted_456', 'active', 1);
    `);
  }
}

initDatabase();

module.exports = db;
