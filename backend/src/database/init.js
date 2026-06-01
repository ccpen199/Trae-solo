import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'app.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('platform_engineer', 'ops', 'developer', 'app_owner', 'security_admin')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_code TEXT UNIQUE NOT NULL,
    app_name TEXT NOT NULL,
    description TEXT,
    app_owner_id INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS environments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    env_name TEXT NOT NULL,
    env_type TEXT NOT NULL CHECK(env_type IN ('dev', 'test', 'staging', 'prod')),
    db_type TEXT NOT NULL CHECK(db_type IN ('mysql', 'postgresql', 'oracle', 'mongodb', 'redis')),
    db_host TEXT NOT NULL,
    db_port INTEGER NOT NULL,
    db_name TEXT NOT NULL,
    db_user TEXT NOT NULL,
    db_password_encrypted TEXT NOT NULL,
    connection_string TEXT,
    version TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, env_name)
  );

  CREATE TABLE IF NOT EXISTS backup_strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    env_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
    strategy_name TEXT NOT NULL,
    strategy_type TEXT NOT NULL CHECK(strategy_type IN ('full', 'incremental', 'differential', 'log')),
    schedule_type TEXT NOT NULL CHECK(schedule_type IN ('manual', 'daily', 'weekly', 'monthly', 'cron')),
    schedule_cron TEXT,
    retention_days INTEGER DEFAULT 30,
    storage_path TEXT NOT NULL,
    compression_enabled INTEGER DEFAULT 1,
    encryption_enabled INTEGER DEFAULT 1,
    rule_version TEXT NOT NULL DEFAULT 'v1.0',
    pre_checks TEXT,
    post_actions TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'draft')),
    approved_by INTEGER REFERENCES users(id),
    approved_at DATETIME,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS change_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_no TEXT UNIQUE NOT NULL,
    change_type TEXT NOT NULL CHECK(change_type IN ('config_change', 'strategy_change', 'access_change', 'emergency')),
    title TEXT NOT NULL,
    description TEXT,
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    strategy_id INTEGER REFERENCES backup_strategies(id),
    original_config TEXT,
    new_config TEXT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'pending_approval', 'approved', 'rejected', 'executed', 'cancelled')),
    current_node INTEGER DEFAULT 0,
    workflow_def TEXT,
    applicant_id INTEGER REFERENCES users(id),
    approver_ids TEXT,
    approved_by TEXT,
    previous_node_result TEXT,
    required_materials TEXT,
    risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    planned_at DATETIME,
    executed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_no TEXT UNIQUE NOT NULL,
    task_type TEXT NOT NULL CHECK(task_type IN ('backup', 'restore', 'verify', 'delete')),
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    strategy_id INTEGER REFERENCES backup_strategies(id),
    change_order_id INTEGER REFERENCES change_orders(id),
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'success', 'failed', 'cancelled', 'partially_success')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    rule_version TEXT NOT NULL,
    permission_checked INTEGER DEFAULT 0,
    previous_node_check_passed INTEGER DEFAULT 0,
    materials_verified INTEGER DEFAULT 0,
    original_request TEXT,
    parameters TEXT,
    backup_file_path TEXT,
    backup_size BIGINT,
    started_at DATETIME,
    completed_at DATETIME,
    duration_seconds INTEGER,
    operator_id INTEGER REFERENCES users(id),
    error_code TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    parent_task_id INTEGER REFERENCES tasks(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'success', 'failed', 'skipped')),
    started_at DATETIME,
    completed_at DATETIME,
    input_data TEXT,
    output_data TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exception_no TEXT UNIQUE NOT NULL,
    task_id INTEGER REFERENCES tasks(id),
    exception_type TEXT NOT NULL CHECK(exception_type IN ('network_error', 'permission_denied', 'config_error', 'data_error', 'timeout', 'unknown')),
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    original_request TEXT,
    error_details TEXT,
    stack_trace TEXT,
    compensation_action TEXT,
    compensation_status TEXT DEFAULT 'pending' CHECK(compensation_status IN ('pending', 'in_progress', 'success', 'failed', 'not_required')),
    compensation_result TEXT,
    manual_note TEXT,
    handled_by INTEGER REFERENCES users(id),
    handled_at DATETIME,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_type TEXT NOT NULL CHECK(audit_type IN ('login', 'logout', 'permission_check', 'config_change', 'task_execute', 'data_access', 'exception', 'export')),
    user_id INTEGER REFERENCES users(id),
    username TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id INTEGER,
    resource_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    request_params TEXT,
    response_data TEXT,
    permission_granted INTEGER DEFAULT 1,
    risk_level TEXT DEFAULT 'low',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_no TEXT UNIQUE NOT NULL,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('task_failed', 'task_timeout', 'backup_missed', 'storage_full', 'permission_violation', 'security_risk')),
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    content TEXT,
    task_id INTEGER REFERENCES tasks(id),
    env_id INTEGER REFERENCES environments(id),
    app_id INTEGER REFERENCES applications(id),
    status TEXT NOT NULL CHECK(status IN ('active', 'acknowledged', 'resolved', 'closed')),
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at DATETIME,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at DATETIME,
    resolution_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attachment_no TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    md5_hash TEXT,
    task_id INTEGER REFERENCES tasks(id),
    change_order_id INTEGER REFERENCES change_orders(id),
    exception_id INTEGER REFERENCES exceptions(id),
    uploaded_by INTEGER REFERENCES users(id),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS keys_secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,
    key_type TEXT NOT NULL CHECK(key_type IN ('db_password', 'encryption_key', 'api_key', 'certificate')),
    encrypted_value TEXT NOT NULL,
    iv TEXT,
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    version TEXT NOT NULL DEFAULT 'v1.0',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'revoked')),
    created_by INTEGER REFERENCES users(id),
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS permission_matrix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('platform_engineer', 'ops', 'developer', 'app_owner', 'security_admin')),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    allowed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_app_id ON tasks(app_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_env_id ON tasks(env_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
  CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
  CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
`);

const permissionRules = [
  ['platform_engineer', 'application', 'create', 1],
  ['platform_engineer', 'application', 'read', 1],
  ['platform_engineer', 'application', 'update', 1],
  ['platform_engineer', 'application', 'delete', 1],
  ['platform_engineer', 'environment', 'create', 1],
  ['platform_engineer', 'environment', 'read', 1],
  ['platform_engineer', 'environment', 'update', 1],
  ['platform_engineer', 'environment', 'delete', 1],
  ['platform_engineer', 'strategy', 'create', 1],
  ['platform_engineer', 'strategy', 'read', 1],
  ['platform_engineer', 'strategy', 'update', 1],
  ['platform_engineer', 'strategy', 'delete', 1],
  ['platform_engineer', 'strategy', 'approve', 1],
  ['platform_engineer', 'task', 'create', 1],
  ['platform_engineer', 'task', 'read', 1],
  ['platform_engineer', 'task', 'execute', 1],
  ['platform_engineer', 'task', 'cancel', 1],
  ['platform_engineer', 'change_order', 'create', 1],
  ['platform_engineer', 'change_order', 'read', 1],
  ['platform_engineer', 'change_order', 'approve', 1],
  ['platform_engineer', 'change_order', 'execute', 1],
  ['platform_engineer', 'audit', 'read', 1],
  ['platform_engineer', 'report', 'export', 1],
  ['platform_engineer', 'user', 'manage', 1],

  ['ops', 'application', 'read', 1],
  ['ops', 'environment', 'read', 1],
  ['ops', 'environment', 'update', 1],
  ['ops', 'strategy', 'read', 1],
  ['ops', 'strategy', 'update', 1],
  ['ops', 'task', 'create', 1],
  ['ops', 'task', 'read', 1],
  ['ops', 'task', 'execute', 1],
  ['ops', 'task', 'cancel', 1],
  ['ops', 'change_order', 'create', 1],
  ['ops', 'change_order', 'read', 1],
  ['ops', 'change_order', 'execute', 1],
  ['ops', 'exception', 'handle', 1],
  ['ops', 'alert', 'acknowledge', 1],
  ['ops', 'audit', 'read', 1],
  ['ops', 'report', 'export', 1],

  ['developer', 'application', 'read', 1],
  ['developer', 'environment', 'read', 1],
  ['developer', 'strategy', 'read', 1],
  ['developer', 'task', 'read', 1],
  ['developer', 'task', 'create', 1],
  ['developer', 'change_order', 'read', 1],
  ['developer', 'change_order', 'create', 1],

  ['app_owner', 'application', 'read', 1],
  ['app_owner', 'application', 'update', 1],
  ['app_owner', 'environment', 'read', 1],
  ['app_owner', 'strategy', 'read', 1],
  ['app_owner', 'strategy', 'approve', 1],
  ['app_owner', 'task', 'read', 1],
  ['app_owner', 'change_order', 'read', 1],
  ['app_owner', 'change_order', 'approve', 1],
  ['app_owner', 'audit', 'read', 1],

  ['security_admin', 'application', 'read', 1],
  ['security_admin', 'environment', 'read', 1],
  ['security_admin', 'strategy', 'read', 1],
  ['security_admin', 'task', 'read', 1],
  ['security_admin', 'change_order', 'read', 1],
  ['security_admin', 'audit', 'read', 1],
  ['security_admin', 'audit', 'export', 1],
  ['security_admin', 'key', 'manage', 1],
  ['security_admin', 'user', 'read', 1],
  ['security_admin', 'permission', 'manage', 1],
  ['security_admin', 'report', 'export', 1],
];

const insertPermission = db.prepare(`
  INSERT OR IGNORE INTO permission_matrix (role, resource, action, allowed)
  VALUES (?, ?, ?, ?)
`);

for (const [role, resource, action, allowed] of permissionRules) {
  insertPermission.run(role, resource, action, allowed);
}

const hasUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (hasUsers.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, real_name, email, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  const users = [
    ['admin', bcrypt.hashSync('admin123', 10), '平台管理员', 'admin@example.com', 'platform_engineer'],
    ['ops_user', bcrypt.hashSync('ops123', 10), '运维工程师', 'ops@example.com', 'ops'],
    ['dev_user', bcrypt.hashSync('dev123', 10), '开发工程师', 'dev@example.com', 'developer'],
    ['owner_user', bcrypt.hashSync('owner123', 10), '应用负责人', 'owner@example.com', 'app_owner'],
    ['sec_user', bcrypt.hashSync('sec123', 10), '安全管理员', 'sec@example.com', 'security_admin'],
  ];

  for (const [username, password, real_name, email, role] of users) {
    insertUser.run(username, password, real_name, email, role);
  }
}

const hasApps = db.prepare('SELECT COUNT(*) as count FROM applications').get();
if (hasApps.count === 0) {
  const insertApp = db.prepare(`
    INSERT INTO applications (app_code, app_name, description, app_owner_id, status, created_by)
    VALUES (?, ?, ?, ?, 'active', 1)
  `);
  insertApp.run('ECOM', '电商平台', '核心电商交易系统，支持高并发订单处理', 4);
  insertApp.run('PAY', '支付系统', '第三方支付网关及清算系统', 4);
  insertApp.run('CRM', '客户管理系统', '客户关系管理与数据分析', 4);
  insertApp.run('LOG', '日志中心', '统一日志收集与分析平台', 4);
}

const hasEnvs = db.prepare('SELECT COUNT(*) as count FROM environments').get();
if (hasEnvs.count === 0) {
  const insertEnv = db.prepare(`
    INSERT INTO environments (app_id, env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, version, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)
  `);
  insertEnv.run(1, 'ecom-prod-mysql', 'prod', 'mysql', '192.168.1.101', 3306, 'ecommerce_prod', 'ecom_user', 'encrypted_pass_prod', '8.0', 'active');
  insertEnv.run(1, 'ecom-test-mysql', 'test', 'mysql', '192.168.1.102', 3306, 'ecommerce_test', 'ecom_user', 'encrypted_pass_test', '8.0', 'active');
  insertEnv.run(1, 'ecom-dev-mysql', 'dev', 'mysql', '127.0.0.1', 3306, 'ecommerce_dev', 'root', 'encrypted_pass_dev', '8.0', 'active');
  insertEnv.run(2, 'pay-prod-redis', 'prod', 'redis', '192.168.1.201', 6379, 'pay_cache', 'pay_user', 'encrypted_redis_pass', '7.0', 'active');
  insertEnv.run(3, 'crm-prod-pg', 'prod', 'postgresql', '192.168.1.301', 5432, 'crm_prod', 'crm_user', 'encrypted_pg_pass', '14.0', 'active');
}

const hasStrategies = db.prepare('SELECT COUNT(*) as count FROM backup_strategies').get();
if (hasStrategies.count === 0) {
  const insertStrategy = db.prepare(`
    INSERT INTO backup_strategies (env_id, strategy_name, strategy_type, schedule_type, schedule_cron, retention_days, storage_path, compression_enabled, encryption_enabled, rule_version, status, approved_by, approved_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 'active', 1, CURRENT_TIMESTAMP, 1)
  `);
  insertStrategy.run(1, '电商生产库每日全量备份', 'full', 'daily', '0 2 * * *', 30, '/backup/ecom/prod/full', 'v1.2');
  insertStrategy.run(1, '电商生产库每小时增量备份', 'incremental', 'cron', '0 * * * *', 7, '/backup/ecom/prod/incr', 'v1.2');
  insertStrategy.run(2, '电商测试库每日备份', 'full', 'daily', '0 3 * * *', 14, '/backup/ecom/test/full', 'v1.0');
  insertStrategy.run(3, '支付Redis快照备份', 'full', 'hourly', '0 * * * *', 3, '/backup/pay/redis', 'v1.1');
  insertStrategy.run(5, 'CRM库周备份', 'full', 'weekly', '0 1 * * 0', 90, '/backup/crm/weekly', 'v1.0');
}

const hasTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
if (hasTasks.count === 0) {
  const now = new Date();
  const insertTask = db.prepare(`
    INSERT INTO tasks (task_no, task_type, app_id, env_id, strategy_id, status, priority, rule_version, permission_checked, previous_node_check_passed, materials_verified, original_request, parameters, backup_file_path, backup_size, started_at, completed_at, duration_seconds, operator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (let i = 0; i < 5; i++) {
    const taskDate = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = taskDate.toISOString().split('T')[0].replace(/-/g, '');
    const startedAt = new Date(taskDate.setHours(2, 0, 0, 0));
    const completedAt = new Date(startedAt.getTime() + 45 * 60 * 1000 + Math.random() * 300000);
    const duration = Math.floor((completedAt - startedAt) / 1000);
    const backupSize = 1024 * 1024 * (500 + Math.random() * 500);

    insertTask.run(
      `TASK-${dateStr}-${String(1000 + i).padStart(4, '0')}`,
      'backup',
      1,
      1,
      1,
      i === 2 ? 'running' : 'success',
      'normal',
      'v1.2',
      JSON.stringify({ user_id: 1, action: 'backup' }),
      JSON.stringify({ verify: true }),
      `/backup/ecom/prod/full/backup_${dateStr}.tar.gz`,
      Math.floor(backupSize),
      startedAt.toISOString().replace('T', ' ').slice(0, 19),
      completedAt.toISOString().replace('T', ' ').slice(0, 19),
      duration
    );
  }

  insertTask.run(
    'TASK-FAILED-001',
    'backup',
    5,
    5,
    5,
    'failed',
    'high',
    'v1.0',
    1, 0, 1,
    JSON.stringify({ user_id: 1, action: 'backup' }),
    JSON.stringify({ error: 'connection_timeout' }),
    null, null,
    new Date(now - 3600000).toISOString().replace('T', ' ').slice(0, 19),
    new Date(now - 3300000).toISOString().replace('T', ' ').slice(0, 19),
    300,
    1
  );
}

const hasSteps = db.prepare('SELECT COUNT(*) as count FROM task_steps').get();
if (hasSteps.count === 0) {
  const insertStep = db.prepare(`
    INSERT INTO task_steps (task_id, step_name, step_order, status, started_at, completed_at, input_data, output_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const steps = [
    ['权限校验', 'pending', 'check permissions', 'granted'],
    ['连接数据库', 'pending', 'connect db', 'connected'],
    ['锁定表', 'pending', 'lock tables', 'locked'],
    ['执行备份', 'pending', 'execute dump', 'completed'],
    ['压缩文件', 'pending', 'compress', 'compressed'],
    ['加密存储', 'pending', 'encrypt', 'encrypted'],
    ['校验完整性', 'pending', 'verify checksum', 'verified'],
    ['解锁释放', 'pending', 'unlock', 'released']
  ];
  for (let i = 1; i <= 5; i++) {
    steps.forEach((step, idx) => {
      insertStep.run(i, step[0], idx + 1, i === 2 && idx >= 4 ? 'running' : 'success', null, null, step[2], step[3]);
    });
  }
}

const hasExceptions = db.prepare('SELECT COUNT(*) as count FROM exceptions').get();
if (hasExceptions.count === 0) {
  const insertException = db.prepare(`
    INSERT INTO exceptions (exception_no, task_id, exception_type, severity, error_details, stack_trace, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertException.run(
    'EXC-20260524-0001',
    6,
    'timeout',
    'high',
    '数据库连接超时，超过30秒无响应',
    'Error: Connection timeout\n    at Socket.<anonymous> (/app/lib/db.js:123:45)',
    'investigating'
  );
}

const hasAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts').get();
if (hasAlerts.count === 0) {
  const insertAlert = db.prepare(`
    INSERT INTO alerts (alert_no, alert_type, severity, title, content, task_id, app_id, env_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAlert.run(
    'ALT-20260524-0001',
    'task_failed',
    'error',
    '备份任务执行失败',
    'CRM生产库周备份任务执行失败，错误码：connection_timeout，请检查网络连接',
    6, 3, 5, 'active'
  );
  insertAlert.run(
    'ALT-20260524-0002',
    'backup_missed',
    'warning',
    '备份任务延迟告警',
    '支付系统Redis备份任务延迟超过预期执行时间',
    null, 2, 4, 'acknowledged'
  );
}

const hasChangeOrders = db.prepare('SELECT COUNT(*) as count FROM change_orders').get();
if (hasChangeOrders.count === 0) {
  const insertChange = db.prepare(`
    INSERT INTO change_orders (change_no, change_type, title, description, app_id, env_id, strategy_id, status, applicant_id, risk_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertChange.run(
    'CHG-20260524-0001',
    'strategy_change',
    '调整电商生产库备份保留周期',
    '因合规要求，将生产库备份保留周期从30天调整为90天',
    1, 1, 1, 'pending_approval', 1, 'medium'
  );
  insertChange.run(
    'CHG-20260524-0002',
    'config_change',
    '新增测试环境MySQL实例',
    '为电商测试环境新增只读从库实例，用于压测',
    1, 2, null, 'approved', 1, 'low'
  );
}

const hasAuditLogs = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
if (hasAuditLogs.count === 0) {
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_name, ip_address, permission_granted, risk_level, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('login', 1, 'admin', 'login', 'user', 'admin', '127.0.0.1', 1, 'low', '用户登录系统');
  insertAudit.run('config_change', 1, 'admin', 'create', 'application', '电商平台', '127.0.0.1', 1, 'medium', '创建应用：电商平台');
  insertAudit.run('config_change', 1, 'admin', 'create', 'environment', 'ecom-prod-mysql', '127.0.0.1', 1, 'high', '创建生产环境配置');
  insertAudit.run('task_execute', 1, 'admin', 'execute', 'task', 'TASK-20260523-1000', '127.0.0.1', 1, 'medium', '执行备份任务');
  insertAudit.run('permission_check', 2, 'ops_user', 'access', 'strategy', '电商生产库备份', '127.0.0.1', 1, 'low', '访问备份策略配置');
}

console.log('数据库初始化完成');
console.log('默认账号: admin / admin123');
console.log('示例数据已加载：4个应用 + 5个环境 + 5个策略 + 6个任务 + 告警 + 异常 + 变更单');

export default db;
