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
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      is_child BOOLEAN DEFAULT 0,
      is_special BOOLEAN DEFAULT 0,
      special_notes TEXT,
      frame_preference TEXT,
      health_tips TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS optometry_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      optometrist TEXT NOT NULL,
      sphere_od REAL,
      sphere_os REAL,
      cylinder_od REAL,
      cylinder_os REAL,
      axis_od INTEGER,
      axis_os INTEGER,
      pd REAL,
      corrected_vision_od TEXT,
      corrected_vision_os TEXT,
      notes TEXT,
      version INTEGER DEFAULT 1,
      parent_id INTEGER,
      is_current BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      optometry_id INTEGER,
      frame_id INTEGER,
      lens_id INTEGER,
      frame_price REAL DEFAULT 0,
      lens_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      delivery_date DATETIME,
      salesperson TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (optometry_id) REFERENCES optometry_records(id),
      FOREIGN KEY (frame_id) REFERENCES products(id),
      FOREIGN KEY (lens_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS processing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      processor TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      handler TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_optometry_customer ON optometry_records(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_processing_order ON processing_records(order_id);
  `);

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (type, name, brand, model, price, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const frames = [
      ['frame', '经典金属全框', '雷朋', 'RB5154', 299, 50],
      ['frame', '复古半框板材', '精工', 'HK-1001', 459, 30],
      ['frame', '超轻TR90全框', '派丽蒙', 'PR824', 199, 100],
      ['frame', '商务钛架', '夏蒙', 'CH1024', 899, 20],
    ];

    const lenses = [
      ['lens', '1.56非球面镜片', '依视路', '1.56-AS', 199, 200],
      ['lens', '1.61超薄非球面', '依视路', '1.61-AS', 399, 150],
      ['lens', '1.67防蓝光镜片', '蔡司', '1.67-BL', 699, 80],
      ['lens', '1.74超超薄镜片', '尼康', '1.74-AS', 1299, 30],
    ];

    [...frames, ...lenses].forEach(p => insertProduct.run(...p));
  }
}

initDatabase();

module.exports = db;
