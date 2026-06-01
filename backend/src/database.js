const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

function checkAndRebuildTable(tableName, createSQL) {
  const existingCols = db.pragma(`table_info(${tableName})`).map(c => c.name);
  const requiredCols = createSQL.match(/(\w+)\s+\w+(?:\s|\(|,)/g)?.map(m => m.trim().split(/\s/)[0]) || [];
  const hasAll = requiredCols.filter(c => c && !['CREATE', 'TABLE', 'IF', 'NOT', 'EXISTS', 'PRIMARY', 'FOREIGN', 'KEY'].includes(c.toUpperCase()))
    .every(c => existingCols.includes(c));
  
  if (!hasAll && existingCols.length > 0) {
    return false;
  }
  return true;
}

function rebuildTablesIfNeeded() {
  const tablesToCheck = ['products', 'orders', 'commissions', 'order_items', 'after_sales', 'pickup_records', 'activities'];
  const tableInfos = {};
  tablesToCheck.forEach(t => {
    tableInfos[t] = db.pragma(`table_info(${t})`).map(c => c.name);
  });
  
  const ordersCols = ['id', 'order_no', 'activity_id', 'leader_id', 'customer_name', 'customer_phone', 'total_amount', 'commission_amount', 'status'];
  const afterSalesCols = ['id', 'order_id', 'leader_id', 'type', 'reason', 'amount', 'status'];
  
  const ordersOk = ordersCols.every(c => tableInfos['orders']?.includes(c));
  const afterSalesOk = afterSalesCols.every(c => tableInfos['after_sales']?.includes(c));
  
  if (!ordersOk || !afterSalesOk) {
    db.pragma('foreign_keys = OFF');
    db.exec('DROP TABLE IF EXISTS order_items');
    db.exec('DROP TABLE IF EXISTS orders');
    db.exec('DROP TABLE IF EXISTS commissions');
    db.exec('DROP TABLE IF EXISTS products');
    db.exec('DROP TABLE IF EXISTS pickup_records');
    db.exec('DROP TABLE IF EXISTS after_sales');
    db.exec('DROP TABLE IF EXISTS activities');
    db.pragma('foreign_keys = ON');
    
    db.exec(`
      CREATE TABLE activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leader_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cut_off_time TEXT NOT NULL,
        pickup_point TEXT NOT NULL,
        min_group_size INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES leaders(id)
      );

      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        sold INTEGER DEFAULT 0,
        unit TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT NOT NULL UNIQUE,
        activity_id INTEGER NOT NULL,
        leader_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        total_amount REAL NOT NULL,
        commission_amount REAL NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        pickup_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (leader_id) REFERENCES leaders(id)
      );

      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE commissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leader_id INTEGER NOT NULL,
        order_id INTEGER,
        period TEXT NOT NULL,
        sales_amount REAL DEFAULT 0,
        refund_amount REAL DEFAULT 0,
        penalty_amount REAL DEFAULT 0,
        commission_rate REAL DEFAULT 0.1,
        commission_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        approved_by TEXT,
        approved_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES leaders(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      CREATE TABLE after_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        leader_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        reason TEXT NOT NULL,
        amount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        handled_by TEXT,
        handled_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (leader_id) REFERENCES leaders(id)
      );

      CREATE TABLE pickup_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        leader_id INTEGER NOT NULL,
        actual_items TEXT,
        difference_note TEXT,
        picked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (leader_id) REFERENCES leaders(id)
      );
    `);
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      community TEXT NOT NULL,
      service_area TEXT,
      qualification TEXT,
      deposit REAL DEFAULT 0,
      level INTEGER DEFAULT 1,
      performance_score REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      can_create_activity INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leader_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cut_off_time TEXT NOT NULL,
      pickup_point TEXT NOT NULL,
      min_group_size INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leader_id) REFERENCES leaders(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      activity_id INTEGER NOT NULL,
      leader_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pickup_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (leader_id) REFERENCES leaders(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leader_id INTEGER NOT NULL,
      order_id INTEGER,
      period TEXT NOT NULL,
      sales_amount REAL DEFAULT 0,
      refund_amount REAL DEFAULT 0,
      penalty_amount REAL DEFAULT 0,
      commission_rate REAL DEFAULT 0.1,
      commission_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leader_id) REFERENCES leaders(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      leader_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT NOT NULL,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      handled_by TEXT,
      handled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (leader_id) REFERENCES leaders(id)
    );

    CREATE TABLE IF NOT EXISTS pickup_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      leader_id INTEGER NOT NULL,
      actual_items TEXT,
      difference_note TEXT,
      picked_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (leader_id) REFERENCES leaders(id)
    );
  `);

  rebuildTablesIfNeeded();
}

module.exports = { db, initDatabase };
