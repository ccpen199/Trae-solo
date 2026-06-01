const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      temperature_zone TEXT,
      is_weighed INTEGER DEFAULT 0,
      unit TEXT,
      price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      expiry_date TEXT,
      location TEXT,
      quality_level TEXT DEFAULT 'normal',
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sku_id) REFERENCES skus(id),
      UNIQUE(sku_id, batch_no, location, quality_level)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      address TEXT,
      temperature_zone TEXT,
      time_slot TEXT,
      route TEXT,
      priority INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      sku_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      actual_quantity REAL,
      actual_weight REAL,
      status TEXT DEFAULT 'pending',
      substitution_sku_id INTEGER,
      substitution_reason TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (sku_id) REFERENCES skus(id)
    );

    CREATE TABLE IF NOT EXISTS pickers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_no TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pick_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      picker_id INTEGER,
      status TEXT DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (picker_id) REFERENCES pickers(id)
    );

    CREATE TABLE IF NOT EXISTS pick_task_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pick_task_id INTEGER NOT NULL,
      order_item_id INTEGER NOT NULL,
      inventory_id INTEGER,
      picked_quantity REAL,
      picked_weight REAL,
      photo_url TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (pick_task_id) REFERENCES pick_tasks(id),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    );

    CREATE TABLE IF NOT EXISTS reviewers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_no TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewed_at TEXT,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (reviewer_id) REFERENCES reviewers(id)
    );

    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_no TEXT UNIQUE,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rider_id INTEGER,
      status TEXT DEFAULT 'pending',
      accepted_at TEXT,
      arrived_at TEXT,
      signed_at TEXT,
      failed_at TEXT,
      failure_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      refund_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      handled_by TEXT,
      handled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER,
      sku_id INTEGER,
      batch_no TEXT,
      change_type TEXT,
      quantity_change REAL,
      order_id INTEGER,
      operator TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const skuCount = db.prepare('SELECT COUNT(*) as count FROM skus').get().count;
  if (skuCount === 0) {
    const insertSku = db.prepare(`
      INSERT INTO skus (sku_code, name, category, temperature_zone, is_weighed, unit, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const skus = [
      ['SKU001', '新鲜草莓', '水果', 'cold', 0, '盒', 29.9],
      ['SKU002', '有机苹果', '水果', 'cold', 1, 'kg', 15.8],
      ['SKU003', '精选牛肉', '肉类', 'frozen', 1, 'kg', 68.0],
      ['SKU004', '鲜牛奶', '乳制品', 'cold', 0, '盒', 12.5],
      ['SKU005', '绿叶蔬菜', '蔬菜', 'cold', 1, 'kg', 8.9],
      ['SKU006', '速冻饺子', '冷冻食品', 'frozen', 0, '袋', 25.0],
      ['SKU007', '三文鱼', '海鲜', 'frozen', 1, 'kg', 128.0],
      ['SKU008', '鸡蛋', '蛋类', 'normal', 0, '盒', 18.8],
    ];

    for (const sku of skus) {
      insertSku.run(...sku);
    }

    const insertInventory = db.prepare(`
      INSERT INTO inventory (sku_id, batch_no, expiry_date, location, quality_level, quantity, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const inventoryItems = [
      [1, 'B20240101', nextWeek.toISOString().split('T')[0], 'A-01-01', 'normal', 50, '盒'],
      [1, 'B20240101', nextWeek.toISOString().split('T')[0], 'A-01-02', 'normal', 30, '盒'],
      [2, 'B20240102', nextMonth.toISOString().split('T')[0], 'A-02-01', 'normal', 100, 'kg'],
      [2, 'B20240102', yesterday.toISOString().split('T')[0], 'A-02-02', 'expiring', 5, 'kg'],
      [3, 'B20240103', nextMonth.toISOString().split('T')[0], 'B-01-01', 'normal', 50, 'kg'],
      [4, 'B20240104', nextWeek.toISOString().split('T')[0], 'A-03-01', 'normal', 80, '盒'],
      [5, 'B20240105', nextWeek.toISOString().split('T')[0], 'A-04-01', 'normal', 60, 'kg'],
      [5, 'B20240105', yesterday.toISOString().split('T')[0], 'A-04-02', 'rejected', 2, 'kg'],
      [6, 'B20240106', nextMonth.toISOString().split('T')[0], 'B-02-01', 'normal', 100, '袋'],
      [7, 'B20240107', nextMonth.toISOString().split('T')[0], 'B-03-01', 'normal', 20, 'kg'],
      [8, 'B20240108', nextMonth.toISOString().split('T')[0], 'C-01-01', 'normal', 120, '盒'],
    ];

    for (const item of inventoryItems) {
      insertInventory.run(...item);
    }

    const insertPicker = db.prepare('INSERT INTO pickers (name, employee_no) VALUES (?, ?)');
    insertPicker.run('张三', 'P001');
    insertPicker.run('李四', 'P002');
    insertPicker.run('王五', 'P003');

    const insertReviewer = db.prepare('INSERT INTO reviewers (name, employee_no) VALUES (?, ?)');
    insertReviewer.run('赵六', 'R001');
    insertReviewer.run('钱七', 'R002');

    const insertRider = db.prepare('INSERT INTO riders (name, employee_no, phone) VALUES (?, ?, ?)');
    insertRider.run('孙八', 'D001', '13800138001');
    insertRider.run('周九', 'D002', '13800138002');
  }
}

initDatabase();

module.exports = db;
