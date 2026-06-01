import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      owner_id INTEGER REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      name VARCHAR(50) NOT NULL,
      type VARCHAR(20) NOT NULL,
      config TEXT,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      version VARCHAR(50) NOT NULL,
      branch VARCHAR(100),
      commit_hash VARCHAR(64),
      dependencies TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS secret_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      encrypted_value TEXT NOT NULL,
      expires_at DATETIME,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scan_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      version_id INTEGER REFERENCES app_versions(id),
      env_id INTEGER REFERENCES environments(id),
      status VARCHAR(20) DEFAULT 'pending',
      severity_counts TEXT,
      start_time DATETIME,
      end_time DATETIME,
      triggered_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES scan_tasks(id),
      cve_id VARCHAR(30),
      package_name VARCHAR(100) NOT NULL,
      current_version VARCHAR(50),
      fixed_version VARCHAR(50),
      severity VARCHAR(20) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(30) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'open',
      assignee_id INTEGER REFERENCES users(id),
      title VARCHAR(200) NOT NULL,
      content TEXT,
      suggested_action TEXT,
      close_criteria TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(30) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      operator_id INTEGER REFERENCES users(id),
      reason TEXT,
      affected_objects TEXT,
      recovery_path TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method VARCHAR(10) NOT NULL,
      path VARCHAR(500) NOT NULL,
      user_id INTEGER REFERENCES users(id),
      status_code INTEGER,
      duration INTEGER,
      ip VARCHAR(45),
      user_agent TEXT,
      request_body TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(50) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token VARCHAR(64) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_applications_owner ON applications(owner_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_app ON scan_tasks(app_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON scan_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_vulns_task ON vulnerabilities(task_id);
    CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulnerabilities(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_assignee ON alerts(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_logs_user ON api_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON api_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

export function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const passwordHash = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, status)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('admin', passwordHash, 'platform_engineer', 'active');
  insertUser.run('ops_user', passwordHash, 'ops', 'active');
  insertUser.run('dev_user', passwordHash, 'developer', 'active');
  insertUser.run('owner_user', passwordHash, 'app_owner', 'active');
  insertUser.run('security_user', passwordHash, 'security_admin', 'active');

  const insertApp = db.prepare(`
    INSERT INTO applications (name, code, description, owner_id, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const appId1 = insertApp.run('电商平台', 'eshop', '核心电商业务系统', 4, 'active').lastInsertRowid as number;
  const appId2 = insertApp.run('支付网关', 'payment-gateway', '统一支付处理服务', 4, 'active').lastInsertRowid as number;
  const appId3 = insertApp.run('用户中心', 'user-center', '用户身份与权限管理', 4, 'active').lastInsertRowid as number;

  const insertEnv = db.prepare(`
    INSERT INTO environments (app_id, name, type, config, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  [appId1, appId2, appId3].forEach(appId => {
    insertEnv.run(appId, '开发环境', 'dev', '{"debug": true}', 'active');
    insertEnv.run(appId, '测试环境', 'test', '{"debug": true}', 'active');
    insertEnv.run(appId, '预发布环境', 'staging', '{"debug": false}', 'active');
    insertEnv.run(appId, '生产环境', 'prod', '{"debug": false}', 'active');
  });

  const insertVersion = db.prepare(`
    INSERT INTO app_versions (app_id, version, branch, commit_hash, dependencies)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertVersion.run(appId1, 'v1.2.3', 'main', 'a1b2c3d4e5f6', '{"express":"4.18.2","lodash":"4.17.21"}');
  insertVersion.run(appId1, 'v1.2.4', 'develop', 'b2c3d4e5f6a1', '{"express":"4.18.2","lodash":"4.17.21"}');
  insertVersion.run(appId2, 'v2.0.0', 'main', 'c3d4e5f6a1b2', '{"stripe":"12.0.0","express":"4.18.2"}');
  insertVersion.run(appId3, 'v3.1.0', 'main', 'd4e5f6a1b2c3', '{"jsonwebtoken":"9.0.2","bcryptjs":"2.4.3"}');

  const insertSecret = db.prepare(`
    INSERT INTO secret_keys (app_id, name, type, encrypted_value, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  insertSecret.run(appId1, 'DB_PASSWORD', 'database', 'encrypted_xxx_123', futureDate, 'active');
  insertSecret.run(appId1, 'API_KEY', 'api', 'encrypted_xxx_456', futureDate, 'active');
  insertSecret.run(appId2, 'STRIPE_KEY', 'payment', 'encrypted_xxx_789', futureDate, 'active');
  insertSecret.run(appId3, 'JWT_SECRET', 'jwt', 'encrypted_xxx_abc', futureDate, 'active');

  const insertTask = db.prepare(`
    INSERT INTO scan_tasks (app_id, version_id, env_id, status, severity_counts, start_time, end_time, triggered_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const startTime = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const endTime = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const severityCounts = JSON.stringify({ critical: 2, high: 5, medium: 12, low: 8 });

  insertTask.run(appId1, 1, 1, 'success', severityCounts, startTime, endTime, 1);
  insertTask.run(appId1, 2, 2, 'running', null, startTime, null, 2);
  insertTask.run(appId2, 3, 4, 'success', severityCounts, startTime, endTime, 1);
  insertTask.run(appId3, 4, 3, 'failed', null, startTime, endTime, 3);
  insertTask.run(appId1, 1, 4, 'pending', null, null, null, 4);

  const insertVuln = db.prepare(`
    INSERT INTO vulnerabilities (task_id, cve_id, package_name, current_version, fixed_version, severity, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVuln.run(1, 'CVE-2024-1234', 'lodash', '4.17.20', '4.17.21', 'high', 'Prototype pollution vulnerability in lodash', 'open');
  insertVuln.run(1, 'CVE-2024-5678', 'express', '4.18.1', '4.18.2', 'medium', 'ReDoS vulnerability in express', 'fixed');
  insertVuln.run(1, null, 'debug', '2.6.8', '2.6.9', 'low', 'Regular Expression Denial of Service', 'open');
  insertVuln.run(3, 'CVE-2024-9012', 'stripe', '11.0.0', '12.0.0', 'critical', 'Information disclosure in stripe SDK', 'open');
  insertVuln.run(3, 'CVE-2024-3456', 'jsonwebtoken', '8.5.1', '9.0.2', 'high', 'Authentication bypass in jsonwebtoken', 'ignored');

  const insertAlert = db.prepare(`
    INSERT INTO alerts (type, severity, status, assignee_id, title, content, suggested_action, close_criteria)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlert.run('task_failure', 'high', 'open', 2, '扫描任务执行失败', '用户中心在预发布环境的扫描任务失败，请检查配置。', '重新运行扫描任务并检查环境配置', '任务成功执行完成');
  insertAlert.run('permission_violation', 'critical', 'processing', 5, '越权访问尝试', '检测到开发用户尝试访问生产环境密钥。', '调查访问来源并限制敏感操作权限', '完成安全审计并修复权限配置');
  insertAlert.run('data_leak', 'high', 'open', 3, '敏感数据疑似泄露', '日志中发现疑似敏感数据输出。', '检查代码并清理敏感数据输出', '代码审查通过并无敏感数据输出');
  insertAlert.run('config_misuse', 'medium', 'closed', 4, '生产环境配置错误', '生产环境debug模式被启用。', '禁用生产环境debug模式', '配置已修复并验证');

  const insertChange = db.prepare(`
    INSERT INTO change_orders (type, status, operator_id, reason, affected_objects, recovery_path, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertChange.run('config', 'pending', 2, '修复生产环境配置', '应用ID: 1, 环境ID: 4', '回滚到上一版本配置', '{"debug": true}', '{"debug": false}');
  insertChange.run('permission', 'approved', 5, '提升安全团队权限', '用户ID: 5', '撤销权限提升', '{"role": "developer"}', '{"role": "security_admin"}');
  insertChange.run('secret', 'executed', 1, '轮换数据库密码', '密钥ID: 1', '恢复旧密码', 'old_password_hash', 'new_password_hash');
}

export function rowToUser(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

export function rowToApplication(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    ownerId: row.owner_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function rowToEnvironment(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    appId: row.app_id,
    name: row.name,
    type: row.type,
    config: row.config,
    status: row.status,
    createdAt: row.created_at
  };
}

export function rowToAppVersion(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    appId: row.app_id,
    version: row.version,
    branch: row.branch,
    commitHash: row.commit_hash,
    dependencies: row.dependencies,
    createdAt: row.created_at
  };
}

export function rowToSecretKey(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    appId: row.app_id,
    name: row.name,
    type: row.type,
    encryptedValue: row.encrypted_value,
    expiresAt: row.expires_at,
    status: row.status,
    createdAt: row.created_at
  };
}

export function rowToScanTask(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    appId: row.app_id,
    versionId: row.version_id,
    envId: row.env_id,
    status: row.status,
    severityCounts: row.severity_counts,
    startTime: row.start_time,
    endTime: row.end_time,
    triggeredBy: row.triggered_by,
    createdAt: row.created_at
  };
}

export function rowToVulnerability(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    cveId: row.cve_id,
    packageName: row.package_name,
    currentVersion: row.current_version,
    fixedVersion: row.fixed_version,
    severity: row.severity,
    description: row.description,
    status: row.status,
    createdAt: row.created_at
  };
}

export function rowToAlert(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    status: row.status,
    assigneeId: row.assignee_id,
    title: row.title,
    content: row.content,
    suggestedAction: row.suggested_action,
    closeCriteria: row.close_criteria,
    createdAt: row.created_at,
    closedAt: row.closed_at
  };
}

export function rowToChangeOrder(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    operatorId: row.operator_id,
    reason: row.reason,
    affectedObjects: row.affected_objects,
    recoveryPath: row.recovery_path,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: row.created_at,
    executedAt: row.executed_at
  };
}

export function rowToApiLog(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    method: row.method,
    path: row.path,
    userId: row.user_id,
    statusCode: row.status_code,
    duration: row.duration,
    ip: row.ip,
    userAgent: row.user_agent,
    requestBody: row.request_body,
    createdAt: row.created_at
  };
}

export function rowToAuditLog(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: row.created_at
  };
}

export function rowToSession(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    token: row.token,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}
