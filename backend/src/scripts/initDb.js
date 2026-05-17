const { db, run } = require('../models/database');

const initTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      merchant_name TEXT NOT NULL,
      store_id TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      merchant_name TEXT NOT NULL,
      store_id TEXT,
      register_agreement INTEGER DEFAULT 0,
      commission_agreement INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS credit_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_name TEXT,
      credit_code TEXT,
      legal_name TEXT,
      id_card TEXT,
      id_card_front TEXT,
      id_card_back TEXT,
      business_license TEXT,
      verify_attempts INTEGER DEFAULT 0,
      last_verify_date TEXT,
      auth_agreement INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      available_limit REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS bank_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      branch_name TEXT,
      reserved_phone TEXT NOT NULL,
      card_type TEXT DEFAULT 'debit',
      is_verified INTEGER DEFAULT 0,
      verify_code TEXT,
      verify_expire DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      batch_no TEXT UNIQUE NOT NULL,
      total_amount REAL NOT NULL,
      pending_amount REAL NOT NULL,
      advanced_amount REAL DEFAULT 0,
      status INTEGER DEFAULT 0,
      has_invoice INTEGER DEFAULT 0,
      project_name TEXT,
      house_address TEXT,
      transaction_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS advance_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      commission_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      apply_amount REAL NOT NULL,
      face_verified INTEGER DEFAULT 0,
      contract_read INTEGER DEFAULT 0,
      signature_auth INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      audit_remark TEXT,
      audit_time DATETIME,
      repay_status INTEGER DEFAULT 0,
      repay_amount REAL DEFAULT 0,
      repay_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (commission_id) REFERENCES commissions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      request_data TEXT,
      response_data TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    await run(sql);
  }

  console.log('Database tables initialized successfully');
};

const insertMockData = async () => {
  const mockWhitelist = [
    { phone: '13800138000', merchant_name: '北京链家房地产经纪有限公司', store_id: 'STORE001', status: 1 },
    { phone: '13900139000', merchant_name: '上海中原物业顾问有限公司', store_id: 'STORE002', status: 1 },
    { phone: '13700137000', merchant_name: '广州满堂红置业有限公司', store_id: 'STORE003', status: 1 },
  ];

  for (const item of mockWhitelist) {
    const existing = await new Promise((resolve) => {
      db.get('SELECT id FROM whitelist WHERE phone = ?', [item.phone], (err, row) => {
        resolve(row);
      });
    });
    if (!existing) {
      await run(
        'INSERT INTO whitelist (phone, merchant_name, store_id, status) VALUES (?, ?, ?, ?)',
        [item.phone, item.merchant_name, item.store_id, item.status]
      );
    }
  }

  const existingUser = await new Promise((resolve) => {
    db.get('SELECT id FROM users WHERE phone = ?', ['13800138000'], (err, row) => {
      resolve(row);
    });
  });

  let userId;
  if (!existingUser) {
    const result = await run(
      'INSERT INTO users (phone, merchant_name, store_id, register_agreement, commission_agreement, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['13800138000', '北京链家房地产经纪有限公司', 'STORE001', 1, 1, 1]
    );
    userId = result.lastID;
  } else {
    userId = existingUser.id;
  }

  const existingCredit = await new Promise((resolve) => {
    db.get('SELECT id FROM credit_info WHERE user_id = ?', [userId], (err, row) => {
      resolve(row);
    });
  });

  if (!existingCredit) {
    await run(
      'INSERT INTO credit_info (user_id, company_name, credit_code, legal_name, id_card, status, credit_limit, available_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, '北京链家房地产经纪有限公司', '911100007263XXXXXX', '张三', '110101199001011234', 2, 500000, 500000]
    );
  }

  const mockCommissions = [
    { user_id: userId, batch_no: 'BATCH202401001', total_amount: 150000, pending_amount: 150000, advanced_amount: 0, status: 1, has_invoice: 1, project_name: '朝阳公园项目', house_address: '北京市朝阳区朝阳公园南路1号' },
    { user_id: userId, batch_no: 'BATCH202401002', total_amount: 80000, pending_amount: 80000, advanced_amount: 0, status: 1, has_invoice: 1, project_name: '国贸中心项目', house_address: '北京市朝阳区建国门外大街1号' },
    { user_id: userId, batch_no: 'BATCH202401003', total_amount: 120000, pending_amount: 60000, advanced_amount: 60000, status: 2, has_invoice: 1, project_name: '望京SOHO项目', house_address: '北京市朝阳区望京街道阜通东大街10号' },
  ];

  for (const item of mockCommissions) {
    const existing = await new Promise((resolve) => {
      db.get('SELECT id FROM commissions WHERE batch_no = ?', [item.batch_no], (err, row) => {
        resolve(row);
      });
    });
    if (!existing) {
      await run(
        'INSERT INTO commissions (user_id, batch_no, total_amount, pending_amount, advanced_amount, status, has_invoice, project_name, house_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.user_id, item.batch_no, item.total_amount, item.pending_amount, item.advanced_amount, item.status, item.has_invoice, item.project_name, item.house_address]
      );
    }
  }

  console.log('Mock data inserted successfully');
};

(async () => {
  try {
    await initTables();
    await insertMockData();
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
})();
