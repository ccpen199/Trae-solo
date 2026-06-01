const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS webhook_configs (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      env_id TEXT NOT NULL,
      name TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      url TEXT NOT NULL,
      method TEXT DEFAULT 'POST',
      headers TEXT,
      secret_key TEXT,
      timeout INTEGER DEFAULT 30000,
      retry_count INTEGER DEFAULT 3,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (env_id) REFERENCES environments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id TEXT PRIMARY KEY,
      config_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      approver TEXT,
      approved_at DATETIME,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (config_id) REFERENCES webhook_configs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id TEXT PRIMARY KEY,
      config_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      payload TEXT,
      status TEXT DEFAULT 'pending',
      priority INTEGER DEFAULT 5,
      scheduled_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      result TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (config_id) REFERENCES webhook_configs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      request_url TEXT NOT NULL,
      request_method TEXT NOT NULL,
      request_headers TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_headers TEXT,
      response_body TEXT,
      duration INTEGER,
      success INTEGER DEFAULT 0,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (config_id) REFERENCES webhook_configs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exception_records (
      id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      original_request TEXT,
      compensation_action TEXT,
      manual_remark TEXT,
      handled INTEGER DEFAULT 0,
      handled_by TEXT,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (log_id) REFERENCES call_logs(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app_id TEXT,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, app_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      log_id TEXT,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      acknowledged_by TEXT,
      acknowledged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const initSeedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, username, name, email, role) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('user-1', 'admin', '系统管理员', 'admin@example.com', 'admin');
    insertUser.run('user-2', 'devops', '运维工程师', 'devops@example.com', 'devops');
    insertUser.run('user-3', 'developer', '开发工程师', 'dev@example.com', 'developer');
    insertUser.run('user-4', 'secadmin', '安全管理员', 'sec@example.com', 'security');
    insertUser.run('user-5', 'appowner', '应用负责人', 'owner@example.com', 'owner');
  }

  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  if (appCount === 0) {
    const insertApp = db.prepare('INSERT INTO applications (id, name, code, description, owner, status) VALUES (?, ?, ?, ?, ?, ?)');
    insertApp.run('app-1', '订单系统', 'order-service', '核心订单处理系统', 'user-5', 'active');
    insertApp.run('app-2', '支付系统', 'payment-service', '支付网关系统', 'user-2', 'active');

    const insertEnv = db.prepare('INSERT INTO environments (id, app_id, name, type, config) VALUES (?, ?, ?, ?, ?)');
    insertEnv.run('env-1', 'app-1', '开发环境', 'dev', '{}');
    insertEnv.run('env-2', 'app-1', '测试环境', 'test', '{}');
    insertEnv.run('env-3', 'app-1', '生产环境', 'prod', '{}');
    insertEnv.run('env-4', 'app-2', '开发环境', 'dev', '{}');
    insertEnv.run('env-5', 'app-2', '生产环境', 'prod', '{}');

    const insertConfig = db.prepare(`
      INSERT INTO webhook_configs (id, app_id, env_id, name, version, url, method, headers, secret_key, timeout, retry_count, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertConfig.run(
      'config-1', 'app-1', 'env-1', '订单创建回调', 1,
      'https://httpbin.org/post', 'POST',
      JSON.stringify({ 'Content-Type': 'application/json' }),
      'secret-12345', 30000, 3, 'active', 'user-1'
    );
    insertConfig.run(
      'config-2', 'app-2', 'env-4', '支付成功通知', 1,
      'https://httpbin.org/post', 'POST',
      JSON.stringify({ 'Content-Type': 'application/json' }),
      'secret-67890', 30000, 2, 'active', 'user-2'
    );
  }
};

initTables();
initSeedData();

module.exports = db;
