import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const projectRoot = path.join(__dirname, '../..')
const dataDir = path.join(projectRoot, 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      area REAL NOT NULL,
      height REAL NOT NULL,
      capacity REAL NOT NULL,
      fire_rating TEXT NOT NULL,
      temperature_control TEXT,
      monthly_rent REAL NOT NULL,
      available_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      location TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouse_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      reason TEXT,
      operator TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      industry TEXT,
      company TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      area_required REAL NOT NULL,
      lease_term INTEGER NOT NULL,
      budget REAL,
      cargo_type TEXT,
      special_requirements TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS inquiry_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      match_score REAL NOT NULL,
      match_reason TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      monthly_rent REAL NOT NULL,
      property_fee REAL DEFAULT 0,
      deposit REAL NOT NULL,
      rent_free_days INTEGER DEFAULT 0,
      increase_clause TEXT,
      delivery_list TEXT,
      status TEXT DEFAULT 'draft',
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      bill_no TEXT UNIQUE NOT NULL,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      rent_amount REAL NOT NULL,
      property_amount REAL DEFAULT 0,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'unpaid',
      late_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      invoice_no TEXT,
      invoice_date TEXT,
      paid_amount REAL DEFAULT 0,
      paid_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS bill_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      payment_date TEXT NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
  `)

  const warehouseCount = db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as { count: number }
  if (warehouseCount.count === 0) {
    const insertWarehouse = db.prepare(`
      INSERT INTO warehouses (name, code, area, height, capacity, fire_rating, temperature_control, monthly_rent, available_date, status, location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const sampleWarehouses = [
      ['A区-01号仓库', 'WH-A001', 5000, 8, 3, '丙二类', '常温', 45, '2024-01-01', 'available', '上海市浦东新区', '标准高台仓库，带卸货平台'],
      ['A区-02号仓库', 'WH-A002', 3000, 6, 2, '丙二类', '冷藏(2-8℃)', 80, '2024-02-01', 'available', '上海市浦东新区', '冷链仓库，带温控系统'],
      ['B区-01号仓库', 'WH-B001', 8000, 10, 5, '甲类', '常温', 60, '2024-03-01', 'available', '苏州市昆山区', '化工品专用仓库，高消防等级'],
    ]
    sampleWarehouses.forEach(w => insertWarehouse.run(w))

    const insertCustomer = db.prepare('INSERT INTO customers (name, contact, phone, email, industry, company) VALUES (?, ?, ?, ?, ?, ?)')
    const sampleCustomers = [
      ['张三', '张经理', '13800138001', 'zhangsan@example.com', '电商零售', 'XX电商有限公司'],
      ['李四', '李总', '13800138002', 'lisi@example.com', '冷链物流', 'YY冷链物流'],
      ['王五', '王主管', '13800138003', 'wangwu@example.com', '化工', 'ZZ化工科技'],
    ]
    sampleCustomers.forEach(c => insertCustomer.run(c))
  }
}

export default db
