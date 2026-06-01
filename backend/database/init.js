const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'land_transfer.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      village TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_no TEXT UNIQUE NOT NULL,
      owner_id INTEGER,
      owner_name TEXT NOT NULL,
      area REAL NOT NULL,
      location TEXT NOT NULL,
      village TEXT NOT NULL,
      soil_grade TEXT,
      crop_adapt TEXT,
      ownership_proof TEXT,
      is_transferable INTEGER DEFAULT 1,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_demands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      price_unit TEXT DEFAULT 'mu/year',
      term INTEGER NOT NULL,
      term_unit TEXT DEFAULT 'year',
      usage_restriction TEXT,
      description TEXT,
      publisher_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (publisher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id INTEGER NOT NULL,
      bidder_id INTEGER NOT NULL,
      bidder_name TEXT NOT NULL,
      bid_price REAL,
      bid_term INTEGER,
      intention TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES transfer_demands(id),
      FOREIGN KEY (bidder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_no TEXT UNIQUE NOT NULL,
      demand_id INTEGER,
      parcel_id INTEGER,
      lessor_id INTEGER,
      lessor_name TEXT NOT NULL,
      lessee_id INTEGER,
      lessee_name TEXT NOT NULL,
      type TEXT,
      area REAL,
      price REAL,
      total_amount REAL,
      term INTEGER,
      start_date DATE,
      end_date DATE,
      usage TEXT,
      village_approval INTEGER DEFAULT 0,
      village_approval_date DATE,
      sign_date DATE,
      status TEXT DEFAULT 'draft',
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (demand_id) REFERENCES transfer_demands(id)
    );

    CREATE TABLE IF NOT EXISTS rent_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      period_no INTEGER NOT NULL,
      due_date DATE NOT NULL,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      paid_date DATE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      record_date DATE NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'normal',
      reporter_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER,
      complainant_id INTEGER,
      complainant_name TEXT,
      respondent_name TEXT,
      type TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      handle_result TEXT,
      handle_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      target_id INTEGER,
      details TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_parcels_village ON parcels(village);
    CREATE INDEX IF NOT EXISTS idx_parcels_owner ON parcels(owner_id);
    CREATE INDEX IF NOT EXISTS idx_demands_status ON transfer_demands(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_rent_due ON rent_plans(due_date);
    CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
  `);

  console.log('数据库表结构初始化完成');
};

const seed = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('已有测试数据，跳过初始化');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (username, name, role, phone, village)
    VALUES (?, ?, ?, ?, ?)
  `);

  const users = [
    ['admin', '系统管理员', 'admin', '13800138000', null],
    ['village1', '东村村集体', 'village', '13800138001', '东村'],
    ['village2', '西村村集体', 'village', '13800138002', '西村'],
    ['town', '镇监管员', 'supervisor', '13800138003', null],
    ['farmer1', '张三', 'farmer', '13900139001', '东村'],
    ['farmer2', '李四', 'farmer', '13900139002', '东村'],
    ['farmer3', '王五', 'farmer', '13900139003', '西村'],
    ['coop1', '绿农合作社', 'cooperative', '13700137001', '东村'],
    ['lessee1', '丰收农业公司', 'lessee', '13600136001', null]
  ];

  users.forEach(u => insertUser.run(...u));

  const insertParcel = db.prepare(`
    INSERT INTO parcels (parcel_no, owner_id, owner_name, area, location, village, soil_grade, crop_adapt, is_transferable)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const parcels = [
    ['DC-001', 5, '张三', 5.2, '东村一组南地块', '东村', 'A', '水稻,小麦', 1],
    ['DC-002', 5, '张三', 3.8, '东村一组北地块', '东村', 'B', '玉米,大豆', 1],
    ['DC-003', 6, '李四', 8.5, '东村二组西地块', '东村', 'A', '水稻,蔬菜', 1],
    ['DC-004', 6, '李四', 2.1, '东村二组东地块', '东村', 'C', '玉米', 0],
    ['XC-001', 7, '王五', 12.3, '西村一组大田', '西村', 'A', '水稻,小麦', 1],
    ['XC-002', 7, '王五', 6.7, '西村一组坡地', '西村', 'B', '果树,杂粮', 1]
  ];

  parcels.forEach(p => insertParcel.run(...p));

  const insertDemand = db.prepare(`
    INSERT INTO transfer_demands (parcel_id, type, price, term, usage_restriction, description, publisher_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demands = [
    [1, 'lease', 800, 5, '粮食种植', '优质水田，灌溉便利', 5, 'published'],
    [3, 'sublease', 750, 3, '农业生产', '连片土地，适合机械化', 6, 'published'],
    [5, 'share', 1000, 10, '生态农业', '入股合作，年终分红', 7, 'published']
  ];

  demands.forEach(d => insertDemand.run(...d));

  const insertBid = db.prepare(`
    INSERT INTO bids (demand_id, bidder_id, bidder_name, bid_price, bid_term, intention, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const bids = [
    [1, 8, '绿农合作社', 800, 5, '意向承租，用于有机水稻种植', 'confirmed'],
    [2, 9, '丰收农业公司', 780, 3, '意向转包，建设蔬菜基地', 'pending']
  ];

  bids.forEach(b => insertBid.run(...b));

  const insertContract = db.prepare(`
    INSERT INTO contracts (contract_no, demand_id, parcel_id, lessor_id, lessor_name, lessee_id, lessee_name, type, area, price, total_amount, term, start_date, end_date, usage, village_approval, village_approval_date, sign_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const contracts = [
    ['HT-2024-001', 1, 1, 5, '张三', 8, '绿农合作社', 'lease', 5.2, 800, 20800, 5, '2024-01-01', '2028-12-31', '有机水稻种植', 1, '2024-01-05', '2024-01-10', 'active']
  ];

  contracts.forEach(c => insertContract.run(...c));

  const insertRentPlan = db.prepare(`
    INSERT INTO rent_plans (contract_id, period_no, due_date, amount, paid_amount, paid_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const rentPlans = [
    [1, 1, '2024-01-15', 4160, 4160, '2024-01-12', 'paid'],
    [1, 2, '2025-01-15', 4160, 0, null, 'pending'],
    [1, 3, '2026-01-15', 4160, 0, null, 'pending']
  ];

  rentPlans.forEach(r => insertRentPlan.run(...r));

  console.log('测试数据初始化完成');
};

init();
seed();

db.close();
console.log('数据库初始化完成');
