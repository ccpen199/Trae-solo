const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      changelog TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      env_id INTEGER,
      key TEXT UNIQUE NOT NULL,
      secret TEXT NOT NULL,
      name TEXT NOT NULL,
      permissions TEXT,
      status TEXT DEFAULT 'active',
      expires_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      params TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      assignee_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT UNIQUE NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      api_key_id INTEGER,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      request_params TEXT,
      response_code INTEGER,
      response_body TEXT,
      duration INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      app_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      change_content TEXT,
      impact TEXT,
      rollback_plan TEXT,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      reviewed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT UNIQUE NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'open',
      assignee_id INTEGER,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recovery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT UNIQUE NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      steps TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON execution_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at);
  `);
}

function seedData() {
  const bcrypt = require('bcryptjs');
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertUser.run('admin', hashedPassword, 'admin', '系统管理员', 'admin@example.com');
    insertUser.run('engineer', hashedPassword, 'engineer', '平台工程师', 'engineer@example.com');
    insertUser.run('ops', hashedPassword, 'ops', '运维工程师', 'ops@example.com');
    insertUser.run('developer', hashedPassword, 'developer', '开发者', 'dev@example.com');
    insertUser.run('security', hashedPassword, 'security', '安全管理员', 'security@example.com');
  }

  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  if (appCount === 0) {
    const insertApp = db.prepare(`
      INSERT INTO applications (app_id, name, description, owner_id, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertApp.run('sdk-demo-001', '用户中心SDK', '提供用户认证、权限管理功能', 1, 'active');
    insertApp.run('sdk-demo-002', '支付网关SDK', '处理各类支付请求和回调', 2, 'active');
    insertApp.run('sdk-demo-003', '消息推送SDK', '统一消息推送服务', 3, 'inactive');
  }

  const envCount = db.prepare('SELECT COUNT(*) as count FROM environments').get().count;
  if (envCount === 0) {
    const insertEnv = db.prepare(`
      INSERT INTO environments (app_id, name, type, config, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertEnv.run(1, '开发环境', 'development', '{"apiUrl":"http://dev.example.com","timeout":30000}', 'active');
    insertEnv.run(1, '测试环境', 'testing', '{"apiUrl":"http://test.example.com","timeout":30000}', 'active');
    insertEnv.run(1, '生产环境', 'production', '{"apiUrl":"http://api.example.com","timeout":10000}', 'active');
  }

  const keyCount = db.prepare('SELECT COUNT(*) as count FROM api_keys').get().count;
  if (keyCount === 0) {
    const insertKey = db.prepare(`
      INSERT INTO api_keys (app_id, env_id, key, secret, name, permissions, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertKey.run(1, 1, 'sk-dev-abc123', 'secret-dev-xyz789', '开发环境测试密钥', '["read","write"]', 'active', 1);
    insertKey.run(1, 3, 'sk-prod-def456', 'secret-prod-uvw012', '生产环境主密钥', '["read","write","delete"]', 'active', 1);
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM execution_tasks').get().count;
  if (taskCount === 0) {
    const insertTask = db.prepare(`
      INSERT INTO execution_tasks (task_id, app_id, env_id, type, name, params, status, assignee_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTask.run('task-2024-001', 1, 1, 'deploy', '部署v2.0.0到开发环境', '{"version":"2.0.0"}', 'pending', 2, 1);
    insertTask.run('task-2024-002', 1, 3, 'config', '更新生产环境配置', '{"timeout":15000}', 'running', 3, 1);
    insertTask.run('task-2024-003', 2, 3, 'rollback', '回滚支付SDK版本', '{"targetVersion":"1.2.1"}', 'failed', 2, 2);
  }

  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
  if (alertCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO alerts (alert_id, app_id, env_id, type, level, title, message, status, assignee_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlert.run('alert-2024-001', 1, 3, 'permission', 'high', '密钥权限越权告警', '检测到开发环境密钥被用于生产环境调用', 'open', 5);
    insertAlert.run('alert-2024-002', 2, 3, 'failure', 'critical', '支付接口调用失败率过高', '过去10分钟失败率达25%', 'open', 3);
    insertAlert.run('alert-2024-003', 1, 3, 'duplicate', 'warning', '重复执行任务检测', '发现相同配置更新任务被重复提交', 'resolved', 2);
  }

  const changeCount = db.prepare('SELECT COUNT(*) as count FROM change_orders').get().count;
  if (changeCount === 0) {
    const insertChange = db.prepare(`
      INSERT INTO change_orders (order_id, app_id, type, title, description, change_content, impact, rollback_plan, status, created_by, reviewed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertChange.run('CO-2024-001', 1, 'config', '调整API超时时间', '将生产环境API超时从10s调整为15s', '{"timeout":15000}', '低影响，仅超时配置变更', '恢复原配置值即可', 'approved', 4, 1);
    insertChange.run('CO-2024-002', 2, 'version', '升级支付SDK到v2.1.0', '新增微信支付V3接口支持', '{"version":"2.1.0","features":["wechatpay-v3"]}', '中影响，需验证支付流程', '回滚到v2.0.0版本', 'pending', 2, null);
  }

  const versionCount = db.prepare('SELECT COUNT(*) as count FROM versions').get().count;
  if (versionCount === 0) {
    const insertVersion = db.prepare(`
      INSERT INTO versions (app_id, version, description, changelog, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertVersion.run(1, '1.0.0', '初始版本', '基础功能实现', 'released', 1);
    insertVersion.run(1, '2.0.0', '重大更新', '重构架构，性能提升50%', 'released', 2);
    insertVersion.run(1, '2.1.0-beta', '测试版本', '新增批量接口', 'draft', 4);
  }

  const logCount = db.prepare('SELECT COUNT(*) as count FROM call_logs').get().count;
  if (logCount === 0) {
    const insertLog = db.prepare(`
      INSERT INTO call_logs (log_id, app_id, env_id, api_key_id, endpoint, method, request_params, response_code, duration, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < 10; i++) {
      insertLog.run(
        `log-${Date.now()}-${i}`,
        1,
        3,
        2,
        '/api/v1/user/info',
        'GET',
        JSON.stringify({ userId: 1000 + i }),
        i < 8 ? 200 : 500,
        Math.floor(Math.random() * 200) + 50,
        '192.168.1.' + (100 + i)
      );
    }
  }

  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  if (auditCount === 0) {
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run('audit-001', 1, 'create', 'application', 1, null, '{"name":"用户中心SDK"}', '127.0.0.1');
    insertAudit.run('audit-002', 2, 'update', 'api_key', 1, '{"status":"active"}', '{"status":"active","permissions":["read"]}', '127.0.0.1');
  }

  const recoveryCount = db.prepare('SELECT COUNT(*) as count FROM recovery_records').get().count;
  if (recoveryCount === 0) {
    const insertRecovery = db.prepare(`
      INSERT INTO recovery_records (record_id, app_id, env_id, type, title, description, steps, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRecovery.run('rec-001', 1, 3, 'rollback', 'SDK版本回滚预案', '生产环境SDK版本异常时的回滚操作', '["停止服务","回滚版本","验证功能","恢复服务"]', 'ready', 3);
  }
}

module.exports = { db, initDatabase, seedData };
