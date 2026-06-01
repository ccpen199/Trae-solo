const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '..', dbPath));

db.exec(`
  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stall_number TEXT NOT NULL UNIQUE,
    phone TEXT,
    contact_person TEXT,
    status TEXT DEFAULT 'active',
    credit_limit REAL DEFAULT 0,
    current_debt REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    specification TEXT,
    grade TEXT,
    unit TEXT NOT NULL,
    price REAL NOT NULL,
    stock REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    type TEXT DEFAULT 'retail',
    credit_limit REAL DEFAULT 0,
    current_debt REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    type TEXT DEFAULT 'spot',
    status TEXT DEFAULT 'pending',
    total_amount REAL DEFAULT 0,
    actual_amount REAL DEFAULT 0,
    payment_method TEXT,
    is_credit INTEGER DEFAULT 0,
    credit_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    refund_amount REAL DEFAULT 0,
    service_fee REAL DEFAULT 0,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    specification TEXT,
    grade TEXT,
    unit TEXT NOT NULL,
    quoted_price REAL NOT NULL,
    negotiated_price REAL,
    booked_quantity REAL,
    weighed_quantity REAL,
    unit_price REAL NOT NULL,
    amount REAL DEFAULT 0,
    actual_amount REAL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS weighings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    weight REAL NOT NULL,
    operator TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_no TEXT,
    operator TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    invoice_no TEXT UNIQUE,
    amount REAL NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'pending',
    title TEXT,
    tax_no TEXT,
    address TEXT,
    phone TEXT,
    bank TEXT,
    account TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    evidence_images TEXT,
    status TEXT DEFAULT 'pending',
    result TEXT,
    responsible_party TEXT,
    refund_amount REAL DEFAULT 0,
    handler TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS transaction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    order_id INTEGER,
    merchant_id INTEGER,
    customer_id INTEGER,
    amount REAL,
    balance_before REAL,
    balance_after REAL,
    operator TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const initData = db.transaction(() => {
  const catCount = db.prepare('SELECT COUNT(*) as cnt FROM categories').get().cnt;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
    insertCat.run('蔬菜');
    insertCat.run('水果');
    insertCat.run('肉类');
    insertCat.run('海鲜');
    insertCat.run('粮油');
  }

  const merCount = db.prepare('SELECT COUNT(*) as cnt FROM merchants').get().cnt;
  if (merCount === 0) {
    const insertMer = db.prepare('INSERT INTO merchants (name, stall_number, phone, contact_person, credit_limit) VALUES (?, ?, ?, ?, ?)');
    insertMer.run('张三蔬菜批发', 'A-001', '13800138001', '张三', 50000);
    insertMer.run('李四水果行', 'B-001', '13800138002', '李四', 30000);
    insertMer.run('王五肉业', 'C-001', '13800138003', '王五', 80000);
  }

  const prodCount = db.prepare('SELECT COUNT(*) as cnt FROM products').get().cnt;
  if (prodCount === 0) {
    const insertProd = db.prepare('INSERT INTO products (merchant_id, category_id, name, specification, grade, unit, price, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertProd.run(1, 1, '大白菜', '500g', '一级', '斤', 1.5, 2000);
    insertProd.run(1, 1, '西红柿', '500g', '特级', '斤', 3.5, 1000);
    insertProd.run(2, 2, '红富士苹果', '80mm', '一级', '斤', 5.0, 1500);
    insertProd.run(3, 3, '五花肉', '500g', '新鲜', '斤', 18.0, 500);
  }

  const custCount = db.prepare('SELECT COUNT(*) as cnt FROM customers').get().cnt;
  if (custCount === 0) {
    const insertCust = db.prepare('INSERT INTO customers (name, phone, type, credit_limit) VALUES (?, ?, ?, ?)');
    insertCust.run('王老板', '13900139001', 'wholesale', 20000);
    insertCust.run('李阿姨', '13900139002', 'retail', 0);
  }
});

initData();

module.exports = db;
