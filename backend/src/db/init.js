import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../../data/app.sqlite');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    business_hours_start TEXT DEFAULT '08:00',
    business_hours_end TEXT DEFAULT '22:00',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT,
    skills TEXT,
    position TEXT,
    max_daily_hours REAL DEFAULT 8,
    max_weekly_hours REAL DEFAULT 40,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_date DATE NOT NULL,
    leave_type TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    shift_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    warning_days INTEGER DEFAULT 7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS material_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    batch_no TEXT,
    quantity REAL NOT NULL,
    unit_price REAL,
    production_date DATE,
    expiry_date DATE,
    received_date DATE,
    status TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS material_consumption (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    batch_id INTEGER,
    consumption_date DATE NOT NULL,
    theoretical_qty REAL,
    actual_qty REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (batch_id) REFERENCES material_batches(id)
  );

  CREATE TABLE IF NOT EXISTS material_loss (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    batch_id INTEGER,
    loss_date DATE NOT NULL,
    quantity REAL NOT NULL,
    loss_type TEXT NOT NULL,
    reason TEXT,
    is_abnormal INTEGER DEFAULT 0,
    follow_up_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (batch_id) REFERENCES material_batches(id)
  );

  CREATE TABLE IF NOT EXISTS prep_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    plan_date DATE NOT NULL,
    material_id INTEGER NOT NULL,
    predicted_qty REAL,
    actual_prep_qty REAL,
    weather TEXT,
    activity TEXT,
    adjust_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  );

  CREATE TABLE IF NOT EXISTS sales_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    sale_date DATE NOT NULL,
    product_name TEXT,
    quantity INTEGER,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS inventory_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    check_date DATE NOT NULL,
    system_qty REAL,
    actual_qty REAL,
    difference REAL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  );
`);

const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get();
if (storeCount.count === 0) {
  const storeStmt = db.prepare('INSERT INTO stores (name, address) VALUES (?, ?)');
  storeStmt.run('朝阳门店', '北京市朝阳区建国路88号');
  storeStmt.run('海淀门店', '北京市海淀区中关村大街1号');
}

const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get();
if (materialCount.count === 0) {
  const matStmt = db.prepare('INSERT INTO materials (name, category, unit, warning_days) VALUES (?, ?, ?, ?)');
  matStmt.run('红茶', '茶叶', 'kg', 30);
  matStmt.run('绿茶', '茶叶', 'kg', 30);
  matStmt.run('牛奶', '乳制品', 'L', 7);
  matStmt.run('珍珠', '配料', 'kg', 15);
  matStmt.run('椰果', '配料', 'kg', 15);
  matStmt.run('糖浆', '调味', 'L', 30);
}

const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
if (empCount.count === 0) {
  const empStmt = db.prepare('INSERT INTO employees (store_id, name, phone, skills, position) VALUES (?, ?, ?, ?, ?)');
  empStmt.run(1, '张三', '13800138001', '泡茶,收银,制作', '店长');
  empStmt.run(1, '李四', '13800138002', '泡茶,制作', '店员');
  empStmt.run(1, '王五', '13800138003', '收银,制作', '店员');
  empStmt.run(2, '赵六', '13800138004', '泡茶,收银,制作', '店长');
  empStmt.run(2, '钱七', '13800138005', '泡茶,制作', '店员');
}

const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales_data').get();
if (salesCount.count === 0) {
  const salesStmt = db.prepare('INSERT INTO sales_data (store_id, sale_date, product_name, quantity, amount) VALUES (?, ?, ?, ?, ?)');
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    salesStmt.run(1, dateStr, '珍珠奶茶', Math.floor(Math.random() * 50) + 30, (Math.floor(Math.random() * 50) + 30) * 15);
    salesStmt.run(1, dateStr, '绿茶奶茶', Math.floor(Math.random() * 40) + 20, (Math.floor(Math.random() * 40) + 20) * 14);
    salesStmt.run(1, dateStr, '椰果奶茶', Math.floor(Math.random() * 30) + 15, (Math.floor(Math.random() * 30) + 15) * 16);
  }
}

export default db;
