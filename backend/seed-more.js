import Database from 'better-sqlite3';

const db = new Database('./data/app.sqlite');

const appIdMap = {};
db.prepare('SELECT id, app_code FROM applications').all().forEach(a => appIdMap[a.app_code] = a.id);

const envNameMap = {};
db.prepare('SELECT id, app_id, env_name FROM environments').all().forEach(e => envNameMap[e.env_name] = e.id);

const stratMap = {};
db.prepare('SELECT id, env_id FROM backup_strategies').all().forEach(s => stratMap[s.env_id] = s.id);

const tasks = db.prepare('SELECT id, status FROM tasks').all();
console.log('现有任务数:', tasks.length, '策略数:', Object.keys(stratMap).length);

const now = new Date();

if (tasks.length === 5) {
  const crmId = appIdMap['CRM'];
  const crmEnvId = envNameMap['crm-prod-pg'];
  const crmStratId = stratMap[crmEnvId] || 1;
  
  const insertTask = db.prepare(`INSERT INTO tasks (task_no, task_type, app_id, env_id, strategy_id, status, priority, rule_version, permission_checked, previous_node_check_passed, materials_verified, original_request, parameters, started_at, completed_at, duration_seconds, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1, ?, ?, ?, ?, ?, 1)`);
  insertTask.run(
    'TASK-FAILED-001',
    'backup',
    crmId,
    crmEnvId,
    crmStratId,
    'failed',
    'high',
    'v1.0',
    JSON.stringify({ user_id: 1, action: 'backup' }),
    JSON.stringify({ error: 'connection_timeout' }),
    new Date(now - 3600000).toISOString().replace('T', ' ').slice(0, 19),
    new Date(now - 3300000).toISOString().replace('T', ' ').slice(0, 19),
    300
  );
  console.log('插入失败任务');
}

const stepCount = db.prepare('SELECT COUNT(*) as c FROM task_steps').get().c;
if (stepCount === 0) {
  const taskIds = db.prepare('SELECT id FROM tasks WHERE status != ?').all('failed').map(t => t.id);
  const insertStep = db.prepare(`INSERT INTO task_steps (task_id, step_name, step_order, status, input_data, output_data) VALUES (?, ?, ?, ?, ?, ?)`);
  const steps = [
    ['权限校验', 'check permissions', 'granted'],
    ['连接数据库', 'connect db', 'connected'],
    ['锁定表', 'lock tables', 'locked'],
    ['执行备份', 'execute dump', 'completed'],
    ['压缩文件', 'compress', 'compressed'],
    ['加密存储', 'encrypt', 'encrypted'],
    ['校验完整性', 'verify checksum', 'verified'],
    ['解锁释放', 'unlock', 'released']
  ];
  taskIds.forEach((taskId, ti) => {
    steps.forEach((step, idx) => {
      insertStep.run(taskId, step[0], idx + 1, ti === 2 && idx >= 4 ? 'running' : 'success', step[1], step[2]);
    });
  });
  console.log('插入任务步骤');
}

const excCount = db.prepare('SELECT COUNT(*) as c FROM exceptions').get().c;
if (excCount === 0) {
  const failedTask = db.prepare('SELECT id FROM tasks WHERE status = ?').get('failed');
  if (failedTask) {
    const insertException = db.prepare(`INSERT INTO exceptions (exception_no, task_id, exception_type, severity, error_details, stack_trace, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    insertException.run(
      'EXC-20260524-0001',
      failedTask.id,
      'timeout',
      'high',
      '数据库连接超时，超过30秒无响应',
      'Error: Connection timeout\n    at Socket.<anonymous> (/app/lib/db.js:123:45)',
      'investigating'
    );
    console.log('插入异常记录');
  }
}

const alertCount = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
if (alertCount === 0) {
  const failedTask = db.prepare('SELECT id, app_id, env_id FROM tasks WHERE status = ?').get('failed');
  const insertAlert = db.prepare(`INSERT INTO alerts (alert_no, alert_type, severity, title, content, task_id, app_id, env_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  if (failedTask) {
    insertAlert.run(
      'ALT-20260524-0001',
      'task_failed',
      'error',
      '备份任务执行失败',
      'CRM生产库周备份任务执行失败，错误码：connection_timeout，请检查网络连接',
      failedTask.id, failedTask.app_id, failedTask.env_id, 'active'
    );
  }
  const payAppId = appIdMap['PAY'];
  const payEnvId = envNameMap['pay-prod-redis'];
  insertAlert.run(
    'ALT-20260524-0002',
    'backup_missed',
    'warning',
    '备份任务延迟告警',
    '支付系统Redis备份任务延迟超过预期执行时间',
    null, payAppId || 2, payEnvId, 'acknowledged'
  );
  console.log('插入告警记录');
}

const changeCount = db.prepare('SELECT COUNT(*) as c FROM change_orders').get().c;
if (changeCount === 0) {
  const ecomAppId = appIdMap['ECOM'] || appIdMap['DEMO001'] || 1;
  const ecomEnvId = envNameMap['ecom-prod-mysql'] || 1;
  const ecomTestEnvId = envNameMap['ecom-test-mysql'] || 2;
  const strat = db.prepare('SELECT id FROM backup_strategies WHERE env_id = ?').get(ecomEnvId);
  
  const insertChange = db.prepare(`INSERT INTO change_orders (change_no, change_type, title, description, app_id, env_id, strategy_id, status, applicant_id, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertChange.run(
    'CHG-20260524-0001',
    'strategy_change',
    '调整电商生产库备份保留周期',
    '因合规要求，将生产库备份保留周期从30天调整为90天',
    ecomAppId, ecomEnvId, strat?.id, 'pending_approval', 1, 'medium'
  );
  insertChange.run(
    'CHG-20260524-0002',
    'config_change',
    '新增测试环境MySQL实例',
    '为电商测试环境新增只读从库实例，用于压测',
    ecomAppId, ecomTestEnvId, null, 'approved', 1, 'low'
  );
  console.log('插入变更单');
}

const auditCount = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
if (auditCount === 0) {
  const insertAudit = db.prepare(`INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_name, ip_address, permission_granted, risk_level, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertAudit.run('login', 1, 'admin', 'login', 'user', 'admin', '127.0.0.1', 1, 'low', '用户登录系统');
  insertAudit.run('config_change', 1, 'admin', 'create', 'application', '电商平台', '127.0.0.1', 1, 'medium', '创建应用：电商平台');
  insertAudit.run('config_change', 1, 'admin', 'create', 'environment', 'ecom-prod-mysql', '127.0.0.1', 1, 'high', '创建生产环境配置');
  insertAudit.run('task_execute', 1, 'admin', 'execute', 'task', 'TASK-20260523-1000', '127.0.0.1', 1, 'medium', '执行备份任务');
  insertAudit.run('permission_check', 2, 'ops_user', 'access', 'strategy', '电商生产库备份', '127.0.0.1', 1, 'low', '访问备份策略配置');
  console.log('插入审计日志');
}

console.log('');
console.log('=== 数据汇总 ===');
console.log('应用数:', db.prepare('SELECT COUNT(*) as c FROM applications').get().c);
console.log('环境数:', db.prepare('SELECT COUNT(*) as c FROM environments').get().c);
console.log('策略数:', db.prepare('SELECT COUNT(*) as c FROM backup_strategies').get().c);
console.log('任务数:', db.prepare('SELECT COUNT(*) as c FROM tasks').get().c);
console.log('任务步骤数:', db.prepare('SELECT COUNT(*) as c FROM task_steps').get().c);
console.log('异常数:', db.prepare('SELECT COUNT(*) as c FROM exceptions').get().c);
console.log('告警数:', db.prepare('SELECT COUNT(*) as c FROM alerts').get().c);
console.log('变更单数:', db.prepare('SELECT COUNT(*) as c FROM change_orders').get().c);
console.log('审计日志数:', db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c);

db.close();
