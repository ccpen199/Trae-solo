import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'spare_parts.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      rating INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      model TEXT,
      category TEXT,
      compatible_devices TEXT,
      supplier_id INTEGER,
      purchase_price DECIMAL(10,2) NOT NULL,
      shelf_life_months INTEGER,
      safety_stock INTEGER DEFAULT 0,
      alternative_parts TEXT,
      specifications TEXT,
      unit TEXT DEFAULT '个',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      warehouse TEXT,
      description TEXT,
      status INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      batch_no TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      available_qty INTEGER NOT NULL DEFAULT 0,
      unit_price DECIMAL(10,2),
      expire_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (location_id) REFERENCES locations(id),
      UNIQUE(part_id, location_id, batch_no)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_no TEXT UNIQUE NOT NULL,
      supplier_id INTEGER,
      total_amount DECIMAL(12,2) DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      approved_by INTEGER,
      invoice_status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER NOT NULL,
      part_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      received_qty INTEGER DEFAULT 0,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (part_id) REFERENCES spare_parts(id)
    );

    CREATE TABLE IF NOT EXISTS stock_in (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      in_no TEXT UNIQUE NOT NULL,
      po_id INTEGER,
      supplier_id INTEGER,
      batch_no TEXT NOT NULL,
      part_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2),
      expire_date DATE,
      inspection_result TEXT DEFAULT 'pending',
      inspection_remark TEXT,
      inspector_id INTEGER,
      invoice_status TEXT DEFAULT 'pending',
      invoice_no TEXT,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wo_no TEXT UNIQUE NOT NULL,
      device_model TEXT,
      device_sn TEXT,
      customer_name TEXT,
      fault_description TEXT,
      status TEXT DEFAULT 'pending',
      engineer_id INTEGER,
      priority TEXT DEFAULT 'normal',
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_out (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      out_no TEXT UNIQUE NOT NULL,
      wo_id INTEGER,
      part_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      batch_no TEXT,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2),
      engineer_id INTEGER,
      approver_id INTEGER,
      status TEXT DEFAULT 'pending',
      purpose TEXT,
      remark TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wo_id) REFERENCES work_orders(id),
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS stock_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_no TEXT UNIQUE NOT NULL,
      out_id INTEGER,
      part_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      batch_no TEXT,
      quantity INTEGER NOT NULL,
      return_reason TEXT,
      condition TEXT,
      status TEXT DEFAULT 'pending',
      inspector_id INTEGER,
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (out_id) REFERENCES stock_out(id),
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS stock_scrap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scrap_no TEXT UNIQUE NOT NULL,
      part_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      batch_no TEXT,
      quantity INTEGER NOT NULL,
      scrap_reason TEXT,
      approver_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS stock_transfer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_no TEXT UNIQUE NOT NULL,
      part_id INTEGER NOT NULL,
      from_location_id INTEGER NOT NULL,
      to_location_id INTEGER NOT NULL,
      batch_no TEXT,
      quantity INTEGER NOT NULL,
      approver_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (from_location_id) REFERENCES locations(id),
      FOREIGN KEY (to_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS stock_take (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      take_no TEXT UNIQUE NOT NULL,
      location_id INTEGER,
      take_date DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      approver_id INTEGER,
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_take_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      take_id INTEGER NOT NULL,
      part_id INTEGER NOT NULL,
      batch_no TEXT,
      system_qty INTEGER NOT NULL,
      actual_qty INTEGER NOT NULL,
      diff_qty INTEGER NOT NULL,
      diff_amount DECIMAL(10,2),
      reason TEXT,
      FOREIGN KEY (take_id) REFERENCES stock_take(id),
      FOREIGN KEY (part_id) REFERENCES spare_parts(id)
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trans_no TEXT UNIQUE NOT NULL,
      trans_type TEXT NOT NULL,
      ref_id INTEGER,
      ref_no TEXT,
      part_id INTEGER NOT NULL,
      location_id INTEGER,
      batch_no TEXT,
      qty_change INTEGER NOT NULL,
      balance_after INTEGER,
      unit_price DECIMAL(10,2),
      created_by INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (part_id) REFERENCES spare_parts(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT DEFAULT '123456',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_stock_part ON stock(part_id);
    CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
    CREATE INDEX IF NOT EXISTS idx_stock_batch ON stock(batch_no);
    CREATE INDEX IF NOT EXISTS idx_trans_part ON stock_transactions(part_id);
    CREATE INDEX IF NOT EXISTS idx_trans_type ON stock_transactions(trans_type);
    CREATE INDEX IF NOT EXISTS idx_trans_date ON stock_transactions(created_at);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    db.exec(`
      INSERT INTO users (username, name, role) VALUES
      ('admin', '系统管理员', 'admin'),
      ('warehouse', '仓管员', 'warehouse'),
      ('engineer', '维修工程师', 'engineer'),
      ('purchaser', '采购员', 'purchaser'),
      ('finance', '财务', 'finance');
    `);
  }

  const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
  if (locationCount === 0) {
    db.exec(`
      INSERT INTO locations (code, name, warehouse) VALUES
      ('WH-A-01', 'A区01库位', '主仓库'),
      ('WH-A-02', 'A区02库位', '主仓库'),
      ('WH-B-01', 'B区01库位', '主仓库'),
      ('WH-B-02', 'B区02库位', '主仓库'),
      ('WH-C-01', '待检区', '主仓库');
    `);
  }

  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
  if (supplierCount === 0) {
    db.exec(`
      INSERT INTO suppliers (code, name, contact, phone, rating) VALUES
      ('SUP001', '深圳电子科技有限公司', '张经理', '13800138001', 5),
      ('SUP002', '上海机电设备有限公司', '李经理', '13800138002', 4),
      ('SUP003', '广州配件批发中心', '王经理', '13800138003', 3);
    `);
  }
}

initDatabase();

export default db;
