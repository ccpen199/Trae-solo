const db = require('./src/models/database');

function seedSampleData() {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    const apps = [
      { id: 2, name: '用户中心', type: 'web', status: 'production', description: '统一用户认证中心', owner_id: 4 },
      { id: 3, name: '支付网关', type: 'api', status: 'production', description: '在线支付处理服务', owner_id: 4 },
      { id: 4, name: '消息服务', type: 'service', status: 'testing', description: '短信/邮件/推送服务', owner_id: 3 },
      { id: 5, name: '数据分析平台', type: 'web', status: 'development', description: 'BI 数据分析与可视化', owner_id: 3 }
    ];

    const insertApp = db.prepare(`
      INSERT OR IGNORE INTO applications 
      (id, app_id, name, description, type, owner_id, status, callback_urls, logout_urls, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '[]', 1, ?, ?)
    `);

    apps.forEach(app => {
      insertApp.run(app.id, `app_${Math.random().toString(36).substring(2, 10)}`, app.name, app.description, app.type, app.owner_id, app.status, now, now);
    });

    const envs = [
      { app_id: 1, name: '开发环境', type: 'development', base_url: 'http://dev.example.com' },
      { app_id: 1, name: '测试环境', type: 'testing', base_url: 'http://test.example.com' },
      { app_id: 1, name: '生产环境', type: 'production', base_url: 'https://prod.example.com' },
      { app_id: 2, name: '生产环境', type: 'production', base_url: 'https://user.example.com' },
      { app_id: 3, name: '生产环境', type: 'production', base_url: 'https://pay.example.com' }
    ];

    const insertEnv = db.prepare(`
      INSERT OR IGNORE INTO environments (app_id, name, type, base_url, status, config, created_by, created_at)
      VALUES (?, ?, ?, ?, 'active', '{}', 1, ?)
    `);

    envs.forEach(env => {
      insertEnv.run(env.app_id, env.name, env.type, env.base_url, now);
    });

    const secrets = [
      { app_id: 1, env_id: 3, secret_key: 'JWT_SIGN_KEY', secret_type: 'jwt', expires_at: '2026-12-31 23:59:59' },
      { app_id: 1, env_id: 3, secret_key: 'API_ACCESS_TOKEN', secret_type: 'api_key', expires_at: '2026-08-15 23:59:59' },
      { app_id: 2, env_id: 4, secret_key: 'DB_CONNECTION', secret_type: 'database', expires_at: '2027-01-01 00:00:00' },
      { app_id: 3, env_id: 5, secret_key: 'PAY_CHANNEL_KEY', secret_type: 'payment', expires_at: '2026-06-15 23:59:59' }
    ];

    const insertSecret = db.prepare(`
      INSERT OR IGNORE INTO secrets (app_id, env_id, secret_key, secret_type, secret_value, status, expires_at, created_by, created_at)
      VALUES (?, ?, ?, ?, '***masked***', 'active', ?, 1, ?)
    `);

    secrets.forEach(s => {
      insertSecret.run(s.app_id, s.env_id, s.secret_key, s.secret_type, s.expires_at, now);
    });

    const changes = [
      { app_id: 1, change_no: 'CO-202605-1001', title: '电商平台域名变更', type: 'config', reason: '业务域名升级', status: 'pending' },
      { app_id: 2, change_no: 'CO-202605-1002', title: '用户中心 JWT 密钥轮换', type: 'secret', reason: '安全合规要求', status: 'approved', approved_by: 5 },
      { app_id: 3, change_no: 'CO-202605-1003', title: '支付网关超时时间调整', type: 'config', reason: '银行接口响应变慢', status: 'executed' }
    ];

    const insertChange = db.prepare(`
      INSERT OR IGNORE INTO change_orders (app_id, change_no, title, type, reason, status, created_by, approved_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    changes.forEach(c => {
      insertChange.run(c.app_id, c.change_no, c.title, c.type, c.reason, c.status, c.approved_by || null, now);
    });

    const tasks = [
      { app_id: 2, change_order_id: 2, task_id: 'TASK-2026-2001', title: '执行用户中心密钥轮换', type: 'secret_rotation', status: 'running' },
      { app_id: 3, change_order_id: 3, task_id: 'TASK-2026-2002', title: '调整支付网关超时配置', type: 'config_change', status: 'completed' },
      { app_id: 1, change_order_id: null, task_id: 'TASK-2026-2003', title: '清理过期会话', type: 'maintenance', status: 'failed' }
    ];

    const insertTask = db.prepare(`
      INSERT OR IGNORE INTO execution_tasks (app_id, change_order_id, task_id, title, type, status, created_by, executed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 2, ?)
    `);

    tasks.forEach(t => {
      insertTask.run(t.app_id, t.change_order_id, t.task_id, t.title, t.type, t.status, now);
    });

    const alerts = [
      { app_id: 3, alert_id: 'ALT-2026-3001', type: 'secret_expiry', level: 'high', title: '支付渠道密钥即将过期', description: '支付渠道密钥将在 20 天后过期', suggested_action: '请尽快安排密钥轮换', assignee_id: 4 },
      { app_id: 1, alert_id: 'ALT-2026-3002', type: 'task_failure', level: 'medium', title: '会话清理任务执行失败', description: '定时清理过期会话任务连续失败 2 次', suggested_action: '检查数据库连接和清理脚本逻辑', assignee_id: 2 },
      { app_id: null, alert_id: 'ALT-2026-3003', type: 'permission_audit', level: 'low', title: '检测到异常权限申请', description: '开发者账号申请生产环境写权限', suggested_action: '请安全管理员复核申请合理性', assignee_id: 5 }
    ];

    const insertAlert = db.prepare(`
      INSERT OR IGNORE INTO alerts (app_id, alert_id, type, level, title, description, suggested_action, status, assignee_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `);

    alerts.forEach(a => {
      insertAlert.run(a.app_id, a.alert_id, a.type, a.level, a.title, a.description, a.suggested_action, a.assignee_id, now);
    });

    const audits = [
      { audit_id: 'AUD-1001', user_id: 1, action: 'app.create', resource_type: 'application', resource_id: 1, old_value: null, new_value: '{"name":"电商平台"}' },
      { audit_id: 'AUD-1002', user_id: 1, action: 'secret.create', resource_type: 'secret', resource_id: 1, old_value: null, new_value: '{"secret_key":"JWT_SIGN_KEY"}' },
      { audit_id: 'AUD-1003', user_id: 5, action: 'change.approve', resource_type: 'change_order', resource_id: 2, old_value: '{"status":"pending"}', new_value: '{"status":"approved"}' },
      { audit_id: 'AUD-1004', user_id: 2, action: 'task.execute', resource_type: 'execution_task', resource_id: 2, old_value: '{"status":"pending"}', new_value: '{"status":"completed"}' }
    ];

    const insertAudit = db.prepare(`
      INSERT OR IGNORE INTO audit_logs (audit_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '127.0.0.1', ?)
    `);

    audits.forEach(a => {
      insertAudit.run(a.audit_id, a.user_id, a.action, a.resource_type, a.resource_id, a.old_value, a.new_value, now);
    });

    console.log('✅ 示例数据已填充完成！');
    console.log('');
    console.log('📊 数据统计:');
    console.log('  应用总数:', db.prepare('SELECT COUNT(*) as c FROM applications').get().c);
    console.log('  环境数量:', db.prepare('SELECT COUNT(*) as c FROM environments').get().c);
    console.log('  密钥数量:', db.prepare('SELECT COUNT(*) as c FROM secrets').get().c);
    console.log('  变更单数:', db.prepare('SELECT COUNT(*) as c FROM change_orders').get().c);
    console.log('  执行任务:', db.prepare('SELECT COUNT(*) as c FROM execution_tasks').get().c);
    console.log('  告警数量:', db.prepare('SELECT COUNT(*) as c FROM alerts').get().c);
    console.log('  审计日志:', db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c);
  } catch (e) {
    console.error('❌ 填充数据失败:', e.message);
  }
}

seedSampleData();
