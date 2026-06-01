import Database from 'better-sqlite3';

const db = new Database('./data/app.sqlite');

const apps = db.prepare('SELECT id, app_code FROM applications').all();
const appIdMap = {};
apps.forEach(a => appIdMap[a.app_code] = a.id);
console.log('现有应用:', apps);

if (!appIdMap['PAY']) {
  const insertApp = db.prepare(`INSERT INTO applications (app_code, app_name, description, app_owner_id, status, created_by) VALUES (?, ?, ?, ?, 'active', 1)`);
  const r1 = insertApp.run('PAY', '支付系统', '第三方支付网关及清算系统', 4);
  const r2 = insertApp.run('CRM', '客户管理系统', '客户关系管理与数据分析', 4);
  const r3 = insertApp.run('LOG', '日志中心', '统一日志收集与分析平台', 4);
  appIdMap['PAY'] = r1.lastInsertRowid;
  appIdMap['CRM'] = r2.lastInsertRowid;
  appIdMap['LOG'] = r3.lastInsertRowid;
  console.log('补充3个应用');
}

const envs = db.prepare('SELECT id, app_id, env_name FROM environments').all();
const envNameMap = {};
envs.forEach(e => envNameMap[e.env_name] = e.id);

if (!envNameMap['pay-prod-redis']) {
  const insertEnv = db.prepare(`INSERT INTO environments (app_id, env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, version, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)`);
  const r1 = insertEnv.run(appIdMap['PAY'] || 2, 'pay-prod-redis', 'prod', 'redis', '192.168.1.201', 6379, 'pay_cache', 'pay_user', 'encrypted_redis_pass', '7.0');
  const r2 = insertEnv.run(appIdMap['CRM'] || 3, 'crm-prod-pg', 'prod', 'postgresql', '192.168.1.301', 5432, 'crm_prod', 'crm_user', 'encrypted_pg_pass', '14.0');
  envNameMap['pay-prod-redis'] = r1.lastInsertRowid;
  envNameMap['crm-prod-pg'] = r2.lastInsertRowid;
  console.log('补充2个环境');
}

const strategyCount = db.prepare('SELECT COUNT(*) as c FROM backup_strategies').get().c;
if (strategyCount === 0) {
  const ecomProdId = envNameMap['ecom-prod-mysql'] || 1;
  const ecomTestId = envNameMap['ecom-test-mysql'] || 2;
  const payId = envNameMap['pay-prod-redis'];
  const crmId = envNameMap['crm-prod-pg'];
  
  const insertStrategy = db.prepare(`INSERT INTO backup_strategies (env_id, strategy_name, strategy_type, schedule_type, schedule_cron, retention_days, storage_path, compression_enabled, encryption_enabled, rule_version, status, approved_by, approved_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 'active', 1, CURRENT_TIMESTAMP, 1)`);
  insertStrategy.run(ecomProdId, '电商生产库每日全量备份', 'full', 'daily', '0 2 * * *', 30, '/backup/ecom/prod/full', 'v1.2');
  insertStrategy.run(ecomProdId, '电商生产库每小时增量备份', 'incremental', 'cron', '0 * * * *', 7, '/backup/ecom/prod/incr', 'v1.2');
  insertStrategy.run(ecomTestId, '电商测试库每日备份', 'full', 'daily', '0 3 * * *', 14, '/backup/ecom/test/full', 'v1.0');
  if (payId) insertStrategy.run(payId, '支付Redis快照备份', 'full', 'cron', '0 * * * *', 3, '/backup/pay/redis', 'v1.1');
  if (crmId) insertStrategy.run(crmId, 'CRM库周备份', 'full', 'weekly', '0 1 * * 0', 90, '/backup/crm/weekly', 'v1.0');
  console.log('插入备份策略');
}

const taskCount = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c;
if (taskCount === 0) {
  const now = new Date();
  const strategies = db.prepare('SELECT id FROM backup_strategies LIMIT 1').get();
  const stratId = strategies?.id || 1;
  const ecomAppId = appIdMap['ECOM'] || appIdMap['DEMO001'] || 1;
  const ecomEnvId = envNameMap['ecom-prod-mysql'] || 1;
  
  const insertTask = db.prepare(`INSERT INTO tasks (task_no, task_type, app_id, env_id, strategy_id, status, priority, rule_version, permission_checked, previous_node_check_passed, materials_verified, original_request, parameters, backup_file_path, backup_size, started_at, completed_at, duration_seconds, operator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?, ?, ?, ?, ?, ?, 1)`);

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
      ecomAppId,
      ecomEnvId,
      stratId,
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

  const crmId = appIdMap['CRM'];
  const crmEnvId = envNameMap['crm-prod-pg'];
  const crmStratId = db.prepare('SELECT id FROM backup_strategies WHERE env_id = ?').get(crmEnvId)?.id;
  if (crmId && crmEnvId) {
    insertTask.run(
      'TASK-FAILED-001',
      'backup',
      crmId,
      crmEnvId,
      crmStratId || stratId,
      'failed',
      'high',
      'v1.0',
      JSON.stringify({ user_id: 1, action: 'backup' }),
      JSON.stringify({ error: 'connection_timeout' }),
      null, null,
      new Date(now - 3600000).toISOString().replace('T', ' ').slice(0, 19),
      new Date(now - 3300000).toISOString().replace('T', ' ').slice(0, 19),
      300,
      1
    );
  }
  console.log('插入任务数据');
}

const stepCount = db.prepare('SELECT COUNT(*) as c FROM task_steps').get().c;
if (stepCount === 0) {
  const tasks = db.prepare('SELECT id FROM tasks LIMIT 5').all();
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
  tasks.forEach((task, ti) => {
    steps.forEach((step, idx) => {
      insertStep.run(task.id, step[0], idx + 1, ti === 2 && idx >= 4 ? 'running' : 'success', step[1], step[2]);
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

console.log('示例数据插入完成');
console.log('应用数:', db.prepare('SELECT COUNT(*) as c FROM applications').get().c);
console.log('环境数:', db.prepare('SELECT COUNT(*) as c FROM environments').get().c);
console.log('策略数:', db.prepare('SELECT COUNT(*) as c FROM backup_strategies').get().c);
console.log('任务数:', db.prepare('SELECT COUNT(*) as c FROM tasks').get().c);
db.close();
