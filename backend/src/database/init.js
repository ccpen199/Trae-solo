const fs = require('fs');
const path = require('path');
const db = require('./index');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cloud_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT UNIQUE NOT NULL,
      project_name TEXT NOT NULL,
      department TEXT,
      product_line TEXT,
      owner TEXT,
      budget_monthly REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id TEXT UNIQUE NOT NULL,
      resource_name TEXT,
      resource_type TEXT,
      provider TEXT,
      region TEXT,
      account_id TEXT,
      project_id INTEGER,
      tags TEXT,
      status TEXT DEFAULT 'running',
      is_assigned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_date TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      project_id INTEGER,
      product TEXT NOT NULL,
      region TEXT,
      tags TEXT,
      cost REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS resource_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id TEXT NOT NULL,
      metric_date TEXT NOT NULL,
      cpu_avg REAL DEFAULT 0,
      cpu_max REAL DEFAULT 0,
      memory_avg REAL DEFAULT 0,
      memory_max REAL DEFAULT 0,
      network_in REAL DEFAULT 0,
      network_out REAL DEFAULT 0,
      disk_read REAL DEFAULT 0,
      disk_write REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resource_id, metric_date)
    );

    CREATE TABLE IF NOT EXISTS optimization_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      resource_id TEXT,
      resource_type TEXT,
      estimated_saving_monthly REAL DEFAULT 0,
      risk_level TEXT DEFAULT 'low',
      action TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      suggestion_id INTEGER,
      resource_id TEXT,
      action_type TEXT,
      status TEXT DEFAULT 'pending',
      requester TEXT,
      approver TEXT,
      risk_confirmation INTEGER DEFAULT 0,
      maintenance_window TEXT,
      estimated_saving REAL DEFAULT 0,
      actual_saving REAL DEFAULT 0,
      execution_time DATETIME,
      completion_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (suggestion_id) REFERENCES optimization_suggestions(id)
    );

    CREATE TABLE IF NOT EXISTS work_order_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
    );

    CREATE TABLE IF NOT EXISTS cost_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      department TEXT,
      product_line TEXT,
      project_id INTEGER,
      total_cost REAL DEFAULT 0,
      compute_cost REAL DEFAULT 0,
      storage_cost REAL DEFAULT 0,
      network_cost REAL DEFAULT 0,
      database_cost REAL DEFAULT 0,
      other_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period, department, product_line, project_id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      department TEXT,
      product_line TEXT,
      project_id INTEGER,
      budget_amount REAL DEFAULT 0,
      warning_threshold REAL DEFAULT 80,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period, department, product_line, project_id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS operations_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      action TEXT NOT NULL,
      module TEXT,
      detail TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
    CREATE INDEX IF NOT EXISTS idx_bills_account ON bills(account_id);
    CREATE INDEX IF NOT EXISTS idx_bills_project ON bills(project_id);
    CREATE INDEX IF NOT EXISTS idx_bills_product ON bills(product);
    CREATE INDEX IF NOT EXISTS idx_resources_account ON resources(account_id);
    CREATE INDEX IF NOT EXISTS idx_resources_project ON resources(project_id);
    CREATE INDEX IF NOT EXISTS idx_resources_assigned ON resources(is_assigned);
  `);

  console.log('数据库表结构初始化完成');
};

const seed = () => {
  const accountCount = db.prepare('SELECT COUNT(*) as count FROM cloud_accounts').get().count;
  if (accountCount > 0) {
    console.log('已存在初始化数据，跳过');
    return;
  }

  const insertAccount = db.prepare('INSERT INTO cloud_accounts (account_id, account_name, provider) VALUES (?, ?, ?)');
  insertAccount.run('aliyun-001', '阿里云-生产主账号', 'aliyun');
  insertAccount.run('aliyun-002', '阿里云-测试账号', 'aliyun');
  insertAccount.run('tencent-001', '腾讯云-主账号', 'tencent');
  insertAccount.run('aws-001', 'AWS-海外账号', 'aws');

  const insertProject = db.prepare('INSERT INTO projects (project_code, project_name, department, product_line, owner, budget_monthly) VALUES (?, ?, ?, ?, ?, ?)');
  insertProject.run('PROJ-001', '电商平台', '研发一部', '电商产品线', '张三', 150000);
  insertProject.run('PROJ-002', '用户中心', '研发一部', '基础服务', '李四', 80000);
  insertProject.run('PROJ-003', '支付系统', '研发二部', '金融产品线', '王五', 120000);
  insertProject.run('PROJ-004', '数据分析平台', '研发三部', '大数据产品线', '赵六', 200000);
  insertProject.run('PROJ-005', '移动APP', '研发一部', '电商产品线', '钱七', 60000);

  const insertBudget = db.prepare('INSERT INTO budgets (period, department, product_line, project_id, budget_amount, warning_threshold) VALUES (?, ?, ?, ?, ?, ?)');
  for (let i = 1; i <= 5; i++) {
    const proj = db.prepare('SELECT * FROM projects WHERE id = ?').get(i);
    insertBudget.run('2026-05', proj.department, proj.product_line, proj.id, proj.budget_monthly, 80);
  }

  const products = ['ECS', 'RDS', 'OSS', 'CDN', 'EIP', 'SLB', 'Redis', 'MongoDB', 'Kubernetes', 'CloudMonitor'];
  const regions = ['cn-hangzhou', 'cn-beijing', 'cn-shanghai', 'cn-shenzhen', 'ap-southeast-1'];
  const instanceTypes = ['ecs.g6.large', 'ecs.g6.xlarge', 'ecs.c6.large', 'ecs.r6.large', 'ecs.g7.large'];

  const insertResource = db.prepare('INSERT INTO resources (resource_id, resource_name, resource_type, provider, region, account_id, project_id, tags, status, is_assigned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertBill = db.prepare('INSERT INTO bills (bill_date, resource_id, account_id, project_id, product, region, tags, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertMetric = db.prepare('INSERT OR IGNORE INTO resource_metrics (resource_id, metric_date, cpu_avg, cpu_max, memory_avg, memory_max, network_in, network_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (let i = 1; i <= 60; i++) {
    const resourceId = `i-${String(i).padStart(8, '0')}`;
    const product = products[Math.floor(Math.random() * products.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const accountId = ['aliyun-001', 'aliyun-002', 'tencent-001', 'aws-001'][Math.floor(Math.random() * 4)];
    const projectId = i <= 45 ? Math.floor(Math.random() * 5) + 1 : null;
    const isAssigned = i <= 45 ? 1 : 0;
    const instanceType = product === 'ECS' ? instanceTypes[Math.floor(Math.random() * instanceTypes.length)] : null;
    const tags = projectId ? JSON.stringify({ Environment: Math.random() > 0.5 ? 'production' : 'testing', Owner: ['zhangsan', 'lisi', 'wangwu'][Math.floor(Math.random() * 3)] }) : '{}';

    insertResource.run(
      resourceId,
      `${product}-实例-${String(i).padStart(3, '0')}`,
      product,
      ['aliyun', 'aliyun', 'tencent', 'aws'][Math.floor(Math.random() * 4)],
      region,
      accountId,
      projectId,
      tags,
      'running',
      isAssigned
    );

    for (let d = 1; d <= 25; d++) {
      const billDate = `2026-05-${String(d).padStart(2, '0')}`;
      const baseCost = product === 'ECS' ? 30 : product === 'RDS' ? 50 : product === 'Kubernetes' ? 80 : 15;
      const cost = baseCost * (0.8 + Math.random() * 0.4);
      insertBill.run(billDate, resourceId, accountId, projectId, product, region, tags, cost);
    }

    const cpuAvg = Math.random() * 100;
    const memoryAvg = Math.random() * 100;
    insertMetric.run(resourceId, '2026-05-25', cpuAvg, cpuAvg * 1.3, memoryAvg, memoryAvg * 1.2, Math.random() * 1000, Math.random() * 1000);
  }

  const suggestionTypes = ['idle_resource', 'low_utilization', 'reserved_instance', 'storage_lifecycle', 'traffic_anomaly', 'instance_downsize'];
  const suggestionTitles = [
    '检测到闲置ECS实例，建议释放',
    '实例CPU利用率低于10%，建议降配',
    '可购买预留实例，节省30%成本',
    'OSS存储桶可配置生命周期策略',
    '检测到异常流量增长',
    '实例规格过大，建议降配'
  ];

  const insertSuggestion = db.prepare('INSERT INTO optimization_suggestions (suggestion_type, title, description, resource_id, resource_type, estimated_saving_monthly, risk_level, action, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 1; i <= 25; i++) {
    const typeIdx = Math.floor(Math.random() * suggestionTypes.length);
    const resourceId = `i-${String(Math.floor(Math.random() * 45) + 1).padStart(8, '0')}`;
    const saving = Math.floor(Math.random() * 5000) + 500;
    insertSuggestion.run(
      suggestionTypes[typeIdx],
      suggestionTitles[typeIdx],
      `根据最近7天监控数据分析，该资源${typeIdx === 0 ? '连续7天CPU利用率低于5%' : typeIdx === 1 ? '平均CPU利用率仅8%' : '存在优化空间'}，建议采取优化措施。`,
      resourceId,
      'ECS',
      saving,
      ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      typeIdx === 0 ? '释放实例' : typeIdx === 1 ? '降配实例' : '购买RI',
      ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
    );
  }

  const insertWorkOrder = db.prepare('INSERT INTO work_orders (work_order_no, title, suggestion_id, resource_id, action_type, status, requester, approver, risk_confirmation, maintenance_window, estimated_saving) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 1; i <= 15; i++) {
    const suggestion = db.prepare('SELECT * FROM optimization_suggestions WHERE id = ?').get(i);
    if (suggestion) {
      insertWorkOrder.run(
        `WO-${String(2605000 + i).padStart(7, '0')}`,
        suggestion.title,
        suggestion.id,
        suggestion.resource_id,
        suggestion.action,
        ['pending', 'approved', 'executing', 'completed'][Math.floor(Math.random() * 4)],
        '张三',
        '李四',
        Math.random() > 0.5 ? 1 : 0,
        '2026-05-28 02:00-04:00',
        suggestion.estimated_saving_monthly
      );
    }
  }

  const insertAllocation = db.prepare('INSERT OR REPLACE INTO cost_allocations (period, department, product_line, project_id, total_cost, compute_cost, storage_cost, network_cost, database_cost, other_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 1; i <= 5; i++) {
    const proj = db.prepare('SELECT * FROM projects WHERE id = ?').get(i);
    const total = proj.budget_monthly * (0.7 + Math.random() * 0.4);
    insertAllocation.run(
      '2026-05',
      proj.department,
      proj.product_line,
      proj.id,
      total,
      total * 0.4,
      total * 0.2,
      total * 0.15,
      total * 0.15,
      total * 0.1
    );
  }

  console.log('初始化数据已插入');
};

init();
seed();

console.log('数据库初始化完成');
