const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
require('dotenv').config();

const dbPath = process.env.DB_PATH || '../data/app.sqlite';
const fullDbPath = path.resolve(__dirname, '..', '..', dbPath);

console.log('数据库路径:', fullDbPath);

const db = new Database(fullDbPath, { 
  verbose: console.log,
  fileMustExist: false
});

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log('成功连接到 SQLite 数据库 (better-sqlite3)');

function initializeTables() {
  const tables = [
    {
      name: 'subjects',
      sql: `CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id TEXT,
        balance_direction TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    },
    {
      name: 'vouchers',
      sql: `CREATE TABLE IF NOT EXISTS vouchers (
        id TEXT PRIMARY KEY,
        voucher_no TEXT NOT NULL UNIQUE,
        voucher_type TEXT NOT NULL,
        voucher_date TEXT NOT NULL,
        period TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        responsible_id TEXT,
        responsible_name TEXT,
        expected_completion_time TEXT,
        total_debit REAL DEFAULT 0,
        total_credit REAL DEFAULT 0,
        is_locked INTEGER DEFAULT 0,
        locked_by TEXT,
        locked_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    },
    {
      name: 'voucher_details',
      sql: `CREATE TABLE IF NOT EXISTS voucher_details (
        id TEXT PRIMARY KEY,
        voucher_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        debit_amount REAL DEFAULT 0,
        credit_amount REAL DEFAULT 0,
        summary TEXT,
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    },
    {
      name: 'attachments',
      sql: `CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        voucher_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    },
    {
      name: 'status_flows',
      sql: `CREATE TABLE IF NOT EXISTS status_flows (
        id TEXT PRIMARY KEY,
        voucher_id TEXT NOT NULL,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        operator_id TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        comment TEXT,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    },
    {
      name: 'messages',
      sql: `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        voucher_id TEXT,
        recipient_id TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        message_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        is_read INTEGER DEFAULT 0,
        action_url TEXT,
        created_at TEXT NOT NULL
      )`
    },
    {
      name: 'ledgers',
      sql: `CREATE TABLE IF NOT EXISTS ledgers (
        id TEXT PRIMARY KEY,
        voucher_id TEXT NOT NULL,
        voucher_detail_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        period TEXT NOT NULL,
        debit_amount REAL DEFAULT 0,
        credit_amount REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        created_at TEXT NOT NULL
      )`
    },
    {
      name: 'balance_sheets',
      sql: `CREATE TABLE IF NOT EXISTS balance_sheets (
        id TEXT PRIMARY KEY,
        period TEXT NOT NULL UNIQUE,
        total_assets REAL DEFAULT 0,
        total_liabilities REAL DEFAULT 0,
        total_equity REAL DEFAULT 0,
        is_balanced INTEGER DEFAULT 0,
        check_result TEXT,
        generated_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    },
    {
      name: 'profit_sheets',
      sql: `CREATE TABLE IF NOT EXISTS profit_sheets (
        id TEXT PRIMARY KEY,
        period TEXT NOT NULL UNIQUE,
        total_revenue REAL DEFAULT 0,
        total_cost REAL DEFAULT 0,
        total_expenses REAL DEFAULT 0,
        net_profit REAL DEFAULT 0,
        generated_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    },
    {
      name: 'period_closures',
      sql: `CREATE TABLE IF NOT EXISTS period_closures (
        id TEXT PRIMARY KEY,
        period TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'open',
        closed_by TEXT,
        closed_at TEXT,
        reopened_by TEXT,
        reopened_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    },
    {
      name: 'operation_logs',
      sql: `CREATE TABLE IF NOT EXISTS operation_logs (
        id TEXT PRIMARY KEY,
        voucher_id TEXT,
        operator_id TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        before_value TEXT,
        after_value TEXT,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    },
    {
      name: 'difference_records',
      sql: `CREATE TABLE IF NOT EXISTS difference_records (
        id TEXT PRIMARY KEY,
        voucher_id TEXT,
        difference_type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL,
        status TEXT NOT NULL DEFAULT 'pending',
        handled_by TEXT,
        handled_at TEXT,
        created_at TEXT NOT NULL
      )`
    },
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      )`
    }
  ];

  for (const table of tables) {
    db.exec(table.sql);
  }

  initializeData();
}

function initializeData() {
  const now = moment().format('YYYY-MM-DD HH:mm:ss');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const users = [
      { id: uuidv4(), username: 'accountant', password: '123456', name: '张会计', role: 'accountant' },
      { id: uuidv4(), username: 'auditor', password: '123456', name: '李审计', role: 'auditor' },
      { id: uuidv4(), username: 'cashier', password: '123456', name: '王出纳', role: 'cashier' },
      { id: uuidv4(), username: 'boss', password: '123456', name: '赵老板', role: 'boss' },
      { id: uuidv4(), username: 'tax', password: '123456', name: '孙税务', role: 'tax' }
    ];

    for (const user of users) {
      insertUser.run(user.id, user.username, user.password, user.name, user.role, now);
    }
    console.log('初始化用户数据完成');
  }

  const subjectCount = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
  if (subjectCount === 0) {
    const insertSubject = db.prepare(`
      INSERT INTO subjects (id, code, name, type, balance_direction, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const subjects = [
      { id: uuidv4(), code: '1001', name: '库存现金', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1002', name: '银行存款', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1101', name: '交易性金融资产', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1121', name: '应收票据', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1122', name: '应收账款', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1221', name: '其他应收款', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1403', name: '原材料', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1405', name: '库存商品', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1601', name: '固定资产', type: 'asset', balance_direction: 'debit' },
      { id: uuidv4(), code: '1602', name: '累计折旧', type: 'asset', balance_direction: 'credit' },
      { id: uuidv4(), code: '2001', name: '短期借款', type: 'liability', balance_direction: 'credit' },
      { id: uuidv4(), code: '2201', name: '应付票据', type: 'liability', balance_direction: 'credit' },
      { id: uuidv4(), code: '2202', name: '应付账款', type: 'liability', balance_direction: 'credit' },
      { id: uuidv4(), code: '2211', name: '应付职工薪酬', type: 'liability', balance_direction: 'credit' },
      { id: uuidv4(), code: '2221', name: '应交税费', type: 'liability', balance_direction: 'credit' },
      { id: uuidv4(), code: '2241', name: '其他应付款', type: 'liability', balance_direction: 'credit' },
      { id: uuidv4(), code: '3001', name: '实收资本', type: 'equity', balance_direction: 'credit' },
      { id: uuidv4(), code: '3002', name: '资本公积', type: 'equity', balance_direction: 'credit' },
      { id: uuidv4(), code: '3101', name: '盈余公积', type: 'equity', balance_direction: 'credit' },
      { id: uuidv4(), code: '3103', name: '本年利润', type: 'equity', balance_direction: 'credit' },
      { id: uuidv4(), code: '3104', name: '利润分配', type: 'equity', balance_direction: 'credit' },
      { id: uuidv4(), code: '5001', name: '主营业务收入', type: 'revenue', balance_direction: 'credit' },
      { id: uuidv4(), code: '5051', name: '其他业务收入', type: 'revenue', balance_direction: 'credit' },
      { id: uuidv4(), code: '5301', name: '营业外收入', type: 'revenue', balance_direction: 'credit' },
      { id: uuidv4(), code: '5401', name: '主营业务成本', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5402', name: '其他业务成本', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5403', name: '税金及附加', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5601', name: '销售费用', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5602', name: '管理费用', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5603', name: '财务费用', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5711', name: '营业外支出', type: 'expense', balance_direction: 'debit' },
      { id: uuidv4(), code: '5801', name: '所得税费用', type: 'expense', balance_direction: 'debit' }
    ];

    for (const subject of subjects) {
      insertSubject.run(
        subject.id, subject.code, subject.name, subject.type, subject.balance_direction,
        now, now
      );
    }
    console.log('初始化科目数据完成');
  }
}

initializeTables();

function cleanParams(params) {
  if (!params) return [];
  return params.map(p => {
    if (p === undefined) return null;
    if (p === '') return null;
    return p;
  });
}

function extractArgs(args) {
  const params = [];
  let callback = null;
  
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === 'function') {
      callback = args[i];
    } else if (Array.isArray(args[i])) {
      params.push(...args[i]);
    } else {
      params.push(args[i]);
    }
  }
  
  return { params: cleanParams(params), callback };
}

const nativeRun = Database.prototype.run;
const nativeGet = Database.prototype.get;
const nativeAll = Database.prototype.all;

Database.prototype.run = function(sql, ...args) {
  const { params, callback } = extractArgs(args);
  
  try {
    const stmt = this.prepare(sql);
    let result;
    if (params.length === 0) {
      result = stmt.run();
    } else {
      result = stmt.run(...params);
    }
    const info = { lastID: result.lastInsertRowid, changes: result.changes };
    
    if (callback) {
      callback(null, info);
    }
    return info;
  } catch (error) {
    console.error('SQL Error:', sql, params, error.message);
    if (callback) {
      callback(error);
    }
    throw error;
  }
};

Database.prototype.get = function(sql, ...args) {
  const { params, callback } = extractArgs(args);
  
  try {
    const stmt = this.prepare(sql);
    let row;
    if (params.length === 0) {
      row = stmt.get();
    } else {
      row = stmt.get(...params);
    }
    
    if (callback) {
      callback(null, row);
    }
    return row;
  } catch (error) {
    console.error('SQL Error:', sql, params, error.message);
    if (callback) {
      callback(error);
    }
    throw error;
  }
};

Database.prototype.all = function(sql, ...args) {
  const { params, callback } = extractArgs(args);
  
  try {
    const stmt = this.prepare(sql);
    let rows;
    if (params.length === 0) {
      rows = stmt.all();
    } else {
      rows = stmt.all(...params);
    }
    
    if (callback) {
      callback(null, rows);
    }
    return rows;
  } catch (error) {
    console.error('SQL Error:', sql, params, error.message);
    if (callback) {
      callback(error);
    }
    throw error;
  }
};

db.serialize = function(fn) {
  fn();
};

module.exports = db;
