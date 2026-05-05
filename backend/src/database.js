const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  insertMockData();
  saveDatabase();

  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      hotel_id INTEGER,
      is_main_account INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      hotel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      payment_complete_at DATETIME,
      pms_submitted_at DATETIME,
      eb_confirmed_at DATETIME,
      eb_synced_at DATETIME,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS e_currency (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      balance REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gold_coins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER UNIQUE NOT NULL,
      balance REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS e_currency_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      operator_id INTEGER NOT NULL,
      hotel_id INTEGER,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (hotel_id) REFERENCES hotels(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gold_coin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      order_id INTEGER,
      operator_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      order_no TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    )
  `);
}

function insertMockData() {
  const hotelResult = db.exec("SELECT id FROM hotels LIMIT 1");
  if (hotelResult.length > 0 && hotelResult[0].values.length > 0) {
    return;
  }

  db.run(`
    INSERT INTO hotels (name, code) VALUES 
    ('阳光客栈', 'HOTEL001'),
    ('海景酒店', 'HOTEL002'),
    ('山水民宿', 'HOTEL003')
  `);

  db.run(`
    INSERT INTO users (username, name, role, hotel_id, is_main_account) VALUES 
    ('admin', '张总', 'admin', NULL, 1),
    ('manager1', '李经理', 'manager', 1, 0),
    ('manager2', '王经理', 'manager', 2, 0),
    ('manager3', '赵经理', 'manager', 3, 0),
    ('staff1', '小刘', 'staff', 1, 0),
    ('staff2', '小陈', 'staff', 1, 0),
    ('staff3', '小孙', 'staff', 2, 0)
  `);

  db.run(`
    INSERT INTO e_currency (user_id, balance) VALUES 
    (1, 1568.50)
  `);

  db.run(`
    INSERT INTO gold_coins (hotel_id, balance) VALUES 
    (1, 892.00),
    (2, 456.50),
    (3, 123.00)
  `);

  const now = new Date();
  const orders = [
    { order_no: 'ORD20260428001', hotel_id: 1, user_id: 5, order_type: '现付', channel: '携程', status: '已确认', created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), payment_complete_at: null, pms_submitted_at: new Date(now - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), eb_confirmed_at: new Date(now - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), eb_synced_at: new Date(now - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString() },
    { order_no: 'ORD20260428002', hotel_id: 1, user_id: 6, order_type: '预付', channel: '美团', status: '已确认', created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), payment_complete_at: new Date(now - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), pms_submitted_at: new Date(now - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), eb_confirmed_at: new Date(now - 3 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(), eb_synced_at: new Date(now - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() },
    { order_no: 'ORD20260427001', hotel_id: 2, user_id: 7, order_type: '现付', channel: '飞猪', status: '已确认', created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), payment_complete_at: null, pms_submitted_at: new Date(now - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(), eb_confirmed_at: new Date(now - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(), eb_synced_at: new Date(now - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString() },
    { order_no: 'ORD20260426001', hotel_id: 1, user_id: 5, order_type: '预付', channel: '携程', status: '已确认', created_at: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), payment_complete_at: new Date(now - 6 * 24 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(), pms_submitted_at: new Date(now - 6 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(), eb_confirmed_at: new Date(now - 6 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(), eb_synced_at: new Date(now - 6 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString() },
    { order_no: 'ORD20260425001', hotel_id: 3, user_id: 4, order_type: '现付', channel: '美团', status: '已确认', created_at: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), payment_complete_at: null, pms_submitted_at: new Date(now - 8 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(), eb_confirmed_at: new Date(now - 8 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(), eb_synced_at: new Date(now - 8 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString() }
  ];

  orders.forEach(order => {
    db.run(`
      INSERT INTO orders (order_no, hotel_id, user_id, order_type, channel, status, created_at, payment_complete_at, pms_submitted_at, eb_confirmed_at, eb_synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [order.order_no, order.hotel_id, order.user_id, order.order_type, order.channel, order.status, order.created_at, order.payment_complete_at, order.pms_submitted_at, order.eb_confirmed_at, order.eb_synced_at]);
  });

  const eCurrencyRecords = [
    { user_id: 1, order_id: 1, operator_id: 5, hotel_id: 1, amount: 5.00, balance_after: 1545.50, reason: '订单确认激励 - 现付订单确认耗时10分钟' },
    { user_id: 1, order_id: 2, operator_id: 6, hotel_id: 1, amount: 8.00, balance_after: 1553.50, reason: '订单确认激励 - 预付订单确认耗时17分钟' },
    { user_id: 1, order_id: 3, operator_id: 7, hotel_id: 2, amount: 6.00, balance_after: 1559.50, reason: '订单确认激励 - 现付订单确认耗时9分钟' },
    { user_id: 1, order_id: 4, operator_id: 5, hotel_id: 1, amount: 4.00, balance_after: 1563.50, reason: '订单确认激励 - 预付订单确认耗时12分钟' },
    { user_id: 1, order_id: 5, operator_id: 4, hotel_id: 3, amount: 5.00, balance_after: 1568.50, reason: '订单确认激励 - 现付订单确认耗时6分钟' }
  ];

  eCurrencyRecords.forEach(record => {
    db.run(`
      INSERT INTO e_currency_records (user_id, order_id, operator_id, hotel_id, amount, balance_after, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.user_id, record.order_id, record.operator_id, record.hotel_id, record.amount, record.balance_after, record.reason, orders[record.order_id - 1].eb_synced_at]);
  });

  const goldCoinRecords = [
    { hotel_id: 1, order_id: 1, operator_id: 5, channel: '携程', order_no: 'ORD20260428001', amount: 10.00, balance_after: 860.00, reason: '订单渠道同步激励 - 携程' },
    { hotel_id: 1, order_id: 2, operator_id: 6, channel: '美团', order_no: 'ORD20260428002', amount: 12.00, balance_after: 872.00, reason: '订单渠道同步激励 - 美团' },
    { hotel_id: 2, order_id: 3, operator_id: 7, channel: '飞猪', order_no: 'ORD20260427001', amount: 8.00, balance_after: 448.50, reason: '订单渠道同步激励 - 飞猪' },
    { hotel_id: 1, order_id: 4, operator_id: 5, channel: '携程', order_no: 'ORD20260426001', amount: 10.00, balance_after: 882.00, reason: '订单渠道同步激励 - 携程' },
    { hotel_id: 3, order_id: 5, operator_id: 4, channel: '美团', order_no: 'ORD20260425001', amount: 10.00, balance_after: 113.00, reason: '订单渠道同步激励 - 美团' }
  ];

  goldCoinRecords.forEach(record => {
    db.run(`
      INSERT INTO gold_coin_records (hotel_id, order_id, operator_id, channel, order_no, amount, balance_after, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.hotel_id, record.order_id, record.operator_id, record.channel, record.order_no, record.amount, record.balance_after, record.reason, orders[record.order_id - 1].eb_synced_at]);
  });
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDB() {
  return db;
}

module.exports = {
  initDatabase,
  getDB,
  saveDatabase
};
