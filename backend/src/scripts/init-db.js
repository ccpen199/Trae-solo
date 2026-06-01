const db = require('../db');
const dayjs = require('dayjs');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      team TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      level TEXT DEFAULT 'normal',
      risk_level TEXT DEFAULT 'low',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      premium REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_cycle TEXT NOT NULL,
      effective_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      next_renewal_date TEXT,
      status TEXT DEFAULT 'active',
      grace_period_days INTEGER DEFAULT 60,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS renewal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      reminder_channel TEXT,
      reminder_count INTEGER DEFAULT 0,
      last_reminder_date TEXT,
      next_follow_up_date TEXT,
      customer_feedback TEXT,
      status TEXT DEFAULT 'pending',
      risk_level TEXT DEFAULT 'medium',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT,
      status TEXT NOT NULL,
      failure_reason TEXT,
      retry_count INTEGER DEFAULT 0,
      next_retry_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    );

    CREATE TABLE IF NOT EXISTS policy_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      reason TEXT,
      operator TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    );

    CREATE INDEX IF NOT EXISTS idx_policies_expiry ON policies(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_policies_agent ON policies(agent_id);
    CREATE INDEX IF NOT EXISTS idx_renewal_plans_policy ON renewal_plans(policy_id);
    CREATE INDEX IF NOT EXISTS idx_payment_records_policy ON payment_records(policy_id);
  `);

  console.log('数据库表结构创建完成');
};

const seedTestData = () => {
  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
  if (agentCount > 0) {
    console.log('测试数据已存在，跳过初始化');
    return;
  }

  const insertAgent = db.prepare(`
    INSERT INTO agents (name, employee_id, phone, email, team)
    VALUES (?, ?, ?, ?, ?)
  `);

  const agents = [
    ['张三', 'A001', '13800138001', 'zhangsan@insurance.com', '一组'],
    ['李四', 'A002', '13800138002', 'lisi@insurance.com', '一组'],
    ['王五', 'A003', '13800138003', 'wangwu@insurance.com', '二组']
  ];

  agents.forEach(a => insertAgent.run(a));
  console.log('代理人测试数据插入完成');

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, level, risk_level)
    VALUES (?, ?, ?, ?, ?)
  `);

  const customers = [];
  for (let i = 1; i <= 10; i++) {
    customers.push([
      `客户${i}`,
      `1390013800${i}`,
      `customer${i}@example.com`,
      i <= 3 ? 'vip' : 'normal',
      i <= 2 ? 'low' : i <= 5 ? 'medium' : 'high'
    ]);
  }
  customers.forEach(c => insertCustomer.run(c));
  console.log('客户测试数据插入完成');

  const insertPolicy = db.prepare(`
    INSERT INTO policies (
      policy_no, customer_id, agent_id, product_name, product_type,
      premium, payment_method, payment_cycle, effective_date,
      expiry_date, next_renewal_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = dayjs();
  const productTypes = ['重疾险', '寿险', '医疗险', '意外险', '年金险'];
  const paymentMethods = ['银行卡代扣', '微信支付', '支付宝', '银行转账'];
  const policies = [];

  for (let i = 1; i <= 20; i++) {
    const daysOffset = Math.floor(Math.random() * 90) - 30;
    const expiryDate = today.add(daysOffset, 'day').format('YYYY-MM-DD');
    const nextRenewalDate = dayjs(expiryDate).subtract(30, 'day').isAfter(today)
      ? dayjs(expiryDate).subtract(30, 'day').format('YYYY-MM-DD')
      : today.format('YYYY-MM-DD');
    
    policies.push([
      `POL${String(i).padStart(6, '0')}`,
      (i % 10) + 1,
      (i % 3) + 1,
      `${productTypes[i % 5]}产品${i}`,
      productTypes[i % 5],
      (Math.floor(Math.random() * 50) + 10) * 100,
      paymentMethods[i % 4],
      '年交',
      today.subtract(1, 'year').format('YYYY-MM-DD'),
      expiryDate,
      nextRenewalDate,
      daysOffset < -60 ? 'expired' : daysOffset < 0 ? 'grace_period' : 'active'
    ]);
  }
  policies.forEach(p => insertPolicy.run(p));
  console.log('保单测试数据插入完成');

  const insertRenewalPlan = db.prepare(`
    INSERT INTO renewal_plans (
      policy_id, agent_id, reminder_channel, reminder_count,
      last_reminder_date, next_follow_up_date, customer_feedback, status, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 15; i++) {
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(i);
    const riskLevel = dayjs(policy.expiry_date).isBefore(today) ? 'high' : 'medium';
    
    insertRenewalPlan.run(
      i,
      policy.agent_id,
      i % 3 === 0 ? '电话' : i % 3 === 1 ? '短信' : '微信',
      Math.floor(Math.random() * 3),
      today.subtract(Math.floor(Math.random() * 7), 'day').format('YYYY-MM-DD'),
      today.add(Math.floor(Math.random() * 7), 'day').format('YYYY-MM-DD'),
      i % 4 === 0 ? '客户表示会续费' : i % 4 === 1 ? '需要再考虑' : '',
      'pending',
      riskLevel
    );
  }
  console.log('续期计划测试数据插入完成');

  const insertPaymentRecord = db.prepare(`
    INSERT INTO payment_records (
      policy_id, amount, payment_date, status, failure_reason, retry_count
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const paymentStatuses = ['success', 'insufficient_balance', 'card_expired', 'auth_expired', 'pending_manual'];
  for (let i = 1; i <= 12; i++) {
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(i);
    const status = paymentStatuses[(i - 1) % 5];
    const failureReasons = {
      insufficient_balance: '账户余额不足',
      card_expired: '银行卡已过期',
      auth_expired: '代扣授权已过期',
      pending_manual: '待人工处理'
    };
    
    insertPaymentRecord.run(
      i,
      policy.premium,
      status === 'success' ? today.format('YYYY-MM-DD HH:mm:ss') : null,
      status,
      failureReasons[status] || null,
      status !== 'success' ? Math.floor(Math.random() * 2) : 0
    );
  }
  console.log('扣费记录测试数据插入完成');

  console.log('所有测试数据初始化完成');
};

if (require.main === module) {
  initDatabase();
  seedTestData();
  db.close();
  console.log('数据库初始化完成');
}

module.exports = { initDatabase, seedTestData };
