const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS liquor_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      country TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS liquors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand_id INTEGER,
      specification TEXT NOT NULL,
      bottle_volume_ml REAL NOT NULL,
      cost_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      supplier_id INTEGER,
      batch_number TEXT,
      unit TEXT DEFAULT '瓶',
      conversion_factor REAL DEFAULT 1,
      total_bottles INTEGER DEFAULT 0,
      opened_bottles REAL DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES liquor_brands(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS cup_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      volume_ml REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      cup_type_id INTEGER,
      standard_cost REAL DEFAULT 0,
      sale_price REAL NOT NULL,
      preparation_steps TEXT,
      status TEXT DEFAULT 'draft',
      approved_by INTEGER,
      approved_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cup_type_id) REFERENCES cup_types(id)
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      liquor_id INTEGER,
      ingredient_name TEXT,
      type TEXT NOT NULL,
      quantity_ml REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (liquor_id) REFERENCES liquors(id)
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      liquor_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      reason TEXT,
      reference_id INTEGER,
      created_by INTEGER,
      approver_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (liquor_id) REFERENCES liquors(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER,
      liquor_id INTEGER,
      sale_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      cost_amount REAL DEFAULT 0,
      is_complimentary BOOLEAN DEFAULT 0,
      complimentary_reason TEXT,
      created_by INTEGER,
      approver_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (liquor_id) REFERENCES liquors(id)
    );

    CREATE TABLE IF NOT EXISTS stock_takes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      take_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      total_expected REAL DEFAULT 0,
      total_actual REAL DEFAULT 0,
      total_variance REAL DEFAULT 0,
      item_count INTEGER DEFAULT 0,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_take_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_take_id INTEGER NOT NULL,
      liquor_id INTEGER NOT NULL,
      expected_bottles REAL DEFAULT 0,
      expected_opened REAL DEFAULT 0,
      actual_bottles INTEGER DEFAULT 0,
      actual_opened REAL DEFAULT 0,
      variance REAL DEFAULT 0,
      variance_reason TEXT,
      is_abnormal BOOLEAN DEFAULT 0,
      FOREIGN KEY (stock_take_id) REFERENCES stock_takes(id) ON DELETE CASCADE,
      FOREIGN KEY (liquor_id) REFERENCES liquors(id)
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      approval_type TEXT NOT NULL,
      reference_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      requested_by INTEGER,
      approved_by INTEGER,
      approved_at DATETIME,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_liquors_brand ON liquors(brand_id);
    CREATE INDEX IF NOT EXISTS idx_liquors_supplier ON liquors(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
    CREATE INDEX IF NOT EXISTS idx_stock_trans_liquor ON stock_transactions(liquor_id);
    CREATE INDEX IF NOT EXISTS idx_stock_trans_type ON stock_transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_stock_takes_date ON stock_takes(take_date);
  `);

  try {
    const columns = db.pragma("table_info(stock_takes)").map(c => c.name);
    if (!columns.includes('item_count')) {
      db.exec('ALTER TABLE stock_takes ADD COLUMN item_count INTEGER DEFAULT 0');
    }
    if (!columns.includes('updated_at')) {
      db.exec('ALTER TABLE stock_takes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    }
  } catch (e) {
    console.log('Migration skipped:', e.message);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, name, role, password) VALUES (?, ?, ?, ?)
    `);
    insertUser.run('admin', '系统管理员', 'admin', 'admin123');
    insertUser.run('manager', '张店长', 'manager', '123456');
    insertUser.run('bartender', '李调酒师', 'bartender', '123456');
    insertUser.run('warehouse', '王仓管', 'warehouse', '123456');
    insertUser.run('finance', '赵财务', 'finance', '123456');
  }

  const cupCount = db.prepare('SELECT COUNT(*) as count FROM cup_types').get();
  if (cupCount.count === 0) {
    const insertCup = db.prepare('INSERT INTO cup_types (name, volume_ml, description) VALUES (?, ?, ?)');
    insertCup.run('鸡尾酒杯', 180, '经典鸡尾酒杯');
    insertCup.run('高球杯', 350, '长饮类高球杯');
    insertCup.run('柯林杯', 400, '长饮类柯林杯');
    insertCup.run('古典杯', 250, '威士忌古典杯');
    insertCup.run('子弹杯', 30, '子弹杯');
  }

  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  if (supplierCount.count === 0) {
    const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact, phone) VALUES (?, ?, ?)');
    insertSupplier.run('中粮酒业', '王经理', '13800138001');
    insertSupplier.run('洋酒行', '李总', '13800138002');
    insertSupplier.run('本地酒水批发', '张老板', '13800138003');
  }
}

initDatabase();

module.exports = db;
