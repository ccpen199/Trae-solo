const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      spec TEXT,
      unit TEXT DEFAULT '个',
      category TEXT,
      safety_stock INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      spec TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      version TEXT DEFAULT 'V1.0',
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS bom_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      process TEXT,
      remark TEXT,
      FOREIGN KEY (bom_id) REFERENCES boms(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'raw',
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      location TEXT,
      quantity REAL NOT NULL DEFAULT 0,
      batch_no TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      UNIQUE(material_id, warehouse_id, location, batch_no)
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      location TEXT,
      batch_no TEXT,
      trans_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      balance REAL NOT NULL,
      ref_no TEXT,
      operator TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS in_transit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      po_no TEXT,
      expected_arrival TEXT,
      supplier TEXT,
      status TEXT DEFAULT 'shipping',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS substitute_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_material_id INTEGER NOT NULL,
      substitute_material_id INTEGER NOT NULL,
      priority INTEGER DEFAULT 1,
      approval_required INTEGER DEFAULT 1,
      approved INTEGER DEFAULT 0,
      approved_by TEXT,
      approved_at TEXT,
      valid_from TEXT,
      valid_to TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_material_id) REFERENCES materials(id),
      FOREIGN KEY (substitute_material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wo_no TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL,
      bom_id INTEGER,
      quantity INTEGER NOT NULL,
      production_line TEXT,
      planned_start_date TEXT,
      planned_end_date TEXT,
      status TEXT DEFAULT 'created',
      kitting_status TEXT DEFAULT 'pending',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (bom_id) REFERENCES boms(id)
    );

    CREATE TABLE IF NOT EXISTS work_order_kitting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      required_qty REAL NOT NULL,
      stock_qty REAL DEFAULT 0,
      in_transit_qty REAL DEFAULT 0,
      issued_qty REAL DEFAULT 0,
      short_qty REAL DEFAULT 0,
      is_substituted INTEGER DEFAULT 0,
      substitute_material_id INTEGER,
      substitute_approved INTEGER DEFAULT 0,
      affected_process TEXT,
      status TEXT DEFAULT 'pending',
      checked_at TEXT,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS material_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_no TEXT UNIQUE NOT NULL,
      work_order_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      batch_no TEXT,
      location TEXT,
      operator TEXT,
      issue_type TEXT DEFAULT 'normal',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS material_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_no TEXT UNIQUE NOT NULL,
      work_order_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      batch_no TEXT,
      location TEXT,
      operator TEXT,
      return_type TEXT DEFAULT 'normal',
      reason TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS kitting_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      material_id INTEGER,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      operator TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const warehouseCount = db.prepare('SELECT COUNT(*) as count FROM warehouses').get().count;
  if (warehouseCount === 0) {
    db.prepare(`INSERT INTO warehouses (code, name, type) VALUES 
      ('WH001', '原材料仓', 'raw'),
      ('WH002', '半成品仓', 'semi'),
      ('WH003', '成品仓', 'finished')`).run();
  }
}

module.exports = { db, initDatabase };
