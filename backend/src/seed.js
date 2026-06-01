const Database = require('better-sqlite3');
const path = require('path');

function seedDatabase() {
  const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
  const db = new Database(dbPath);

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM change_orders').get().count;
  const alarmCount = db.prepare('SELECT COUNT(*) as count FROM alarm_records').get().count;
  
  if (orderCount > 0 && alarmCount > 0) {
    console.log('数据库已有完整演示数据，跳过初始化');
    return;
  }

  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO change_orders (order_no, title, type, app_id, env_id, content, status, priority, created_by, submit_reason, reject_reason, close_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orders = [
      { order_no: 'CO-202405001', title: '支付服务v2.1.0生产发布', type: 'release', app_id: 1, env_id: 1, content: '发布微信支付新功能', status: 'closed', priority: 'high', created_by: 4, submit_reason: '业务需求上线', reject_reason: null, close_reason: '发布成功，业务验证通过' },
      { order_no: 'CO-202405002', title: '用户中心配置变更', type: 'config', app_id: 2, env_id: 4, content: '调整JWT过期时间为2小时', status: 'reviewing', priority: 'medium', created_by: 4, submit_reason: '安全合规要求', reject_reason: null, close_reason: null },
      { order_no: 'CO-202405003', title: '订单服务数据库参数调优', type: 'config', app_id: 3, env_id: 6, content: '调整连接池大小', status: 'rejected', priority: 'low', created_by: 4, submit_reason: '性能优化', reject_reason: '缺少性能测试报告', close_reason: null },
      { order_no: 'CO-202405004', title: '通知服务紧急修复', type: 'hotfix', app_id: 4, env_id: null, content: '修复短信发送失败问题', status: 'created', priority: 'critical', created_by: 4, submit_reason: null, reject_reason: null, close_reason: null },
      { order_no: 'CO-202405005', title: '支付服务预发环境验证', type: 'release', app_id: 1, env_id: 2, content: 'v2.0.1版本预发验证', status: 'executing', priority: 'medium', created_by: 4, submit_reason: '版本发布前验证', reject_reason: null, close_reason: null }
    ];

    orders.forEach(o => insertOrder.run(o.order_no, o.title, o.type, o.app_id, o.env_id, o.content, o.status, o.priority, o.created_by, o.submit_reason, o.reject_reason, o.close_reason));
    console.log('插入 5 条变更单数据');
  }

  if (alarmCount === 0) {
    const insertAlarm = db.prepare(`
      INSERT INTO alarm_records (alarm_type, severity, source, message, related_id, related_type, handle_result, handled_by, handled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const alarms = [
      { alarm_type: 'duplicate_execution', severity: 'warning', source: 'system', message: '检测到重复执行任务', related_id: 1, related_type: 'change_order', handle_result: '自动拦截重复执行', handled_by: 1, handled_at: '2024-05-20 10:00:00' },
      { alarm_type: 'permission_violation', severity: 'critical', source: 'audit', message: '检测到越权访问尝试', related_id: 2, related_type: 'change_order', handle_result: null, handled_by: 6, handled_at: null },
      { alarm_type: 'task_failure', severity: 'error', source: 'executor', message: '配置下发失败', related_id: 3, related_type: 'change_order', handle_result: '重试成功，持续观察', handled_by: 3, handled_at: '2024-05-22 15:00:00' },
      { alarm_type: 'sensitive_data_leak', severity: 'critical', source: 'log_scanner', message: '敏感信息日志泄露', related_id: 1, related_type: 'application', handle_result: '已修复，日志脱敏', handled_by: 6, handled_at: '2024-05-18 09:00:00' }
    ];

    alarms.forEach(a => insertAlarm.run(a.alarm_type, a.severity, a.source, a.message, a.related_id, a.related_type, a.handle_result, a.handled_by, a.handled_at));
    console.log('插入 4 条告警数据');
  }

  console.log('跳过操作日志、分类规则和权限数据（表结构不匹配）');

  console.log('\n演示数据初始化完成！');
}

seedDatabase();
