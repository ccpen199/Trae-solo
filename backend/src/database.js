const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      spec TEXT,
      unit TEXT NOT NULL,
      supplier_id INTEGER,
      price REAL NOT NULL,
      shelf_life_days INTEGER,
      min_order_qty REAL DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      position TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      manager_id INTEGER,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_calendars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      is_delivery_day INTEGER DEFAULT 1,
      cut_off_time TEXT DEFAULT '18:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      UNIQUE(store_id, day_of_week)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL DEFAULT 0,
      safety_stock REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(store_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS sales_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sale_date DATE NOT NULL,
      quantity REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      store_id INTEGER NOT NULL,
      order_date DATE NOT NULL,
      delivery_date DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      total_amount REAL DEFAULT 0,
      remark TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      suggested_qty REAL NOT NULL,
      ordered_qty REAL NOT NULL,
      adjust_reason TEXT,
      price REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS pickings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      picking_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      driver TEXT,
      driver_phone TEXT,
      estimated_arrival DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS picking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      picking_id INTEGER NOT NULL,
      order_item_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      picked_qty REAL DEFAULT 0,
      shipped_qty REAL DEFAULT 0,
      shortage_qty REAL DEFAULT 0,
      substitute_product_id INTEGER,
      shortage_reason TEXT,
      FOREIGN KEY (picking_id) REFERENCES pickings(id),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      receipt_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      received_by TEXT,
      received_at DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      picking_item_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      received_qty REAL DEFAULT 0,
      rejected_qty REAL DEFAULT 0,
      reject_reason TEXT,
      temperature REAL,
      is_expiring_soon INTEGER DEFAULT 0,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (picking_item_id) REFERENCES picking_items(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      store_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      order_amount REAL DEFAULT 0,
      adjust_amount REAL DEFAULT 0,
      final_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      settled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      order_amount REAL NOT NULL,
      receipt_amount REAL NOT NULL,
      diff_amount REAL NOT NULL,
      FOREIGN KEY (settlement_id) REFERENCES settlements(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
  if (supplierCount === 0) {
    const insertSupplier = db.prepare('INSERT INTO suppliers (code, name, contact, phone, address) VALUES (?, ?, ?, ?, ?)');
    insertSupplier.run('S001', '鲜农蔬菜配送', '张经理', '13800138001', '北京市蔬菜批发市场A区');
    insertSupplier.run('S002', '肉联厂直销', '李经理', '13800138002', '北京市肉类加工园区');
    insertSupplier.run('S003', '粮油批发中心', '王经理', '13800138003', '北京市粮油交易市场');

    const insertProduct = db.prepare('INSERT INTO products (code, name, category, spec, unit, supplier_id, price, shelf_life_days, min_order_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertProduct.run('P001', '大白菜', '蔬菜', '500g/份', '份', 1, 2.5, 7, 10);
    insertProduct.run('P002', '西红柿', '蔬菜', '500g/份', '份', 1, 4.0, 5, 5);
    insertProduct.run('P003', '土豆', '蔬菜', '1kg/份', '份', 1, 3.0, 30, 10);
    insertProduct.run('P004', '猪五花肉', '肉类', '500g/份', '份', 2, 25.0, 3, 5);
    insertProduct.run('P005', '鸡胸肉', '肉类', '500g/份', '份', 2, 18.0, 5, 5);
    insertProduct.run('P006', '大米', '粮油', '5kg/袋', '袋', 3, 35.0, 180, 2);
    insertProduct.run('P007', '大豆油', '粮油', '5L/桶', '桶', 3, 60.0, 365, 2);

    const insertEmployee = db.prepare('INSERT INTO employees (code, name, position, phone) VALUES (?, ?, ?, ?)');
    insertEmployee.run('E001', '陈店长', '店长', '13900139001');
    insertEmployee.run('E002', '刘店长', '店长', '13900139002');
    insertEmployee.run('E003', '王店长', '店长', '13900139003');
    insertEmployee.run('E004', '赵店长', '店长', '13900139004');
    insertEmployee.run('E005', '孙店长', '店长', '13900139005');

    const insertStore = db.prepare('INSERT INTO stores (code, name, address, manager_id, phone) VALUES (?, ?, ?, ?, ?)');
    insertStore.run('ST001', '朝阳门店', '北京市朝阳区建国路88号', 1, '13900139001');
    insertStore.run('ST002', '海淀门店', '北京市海淀区中关村大街1号', 2, '13900139002');

    const insertCalendar = db.prepare('INSERT OR IGNORE INTO delivery_calendars (store_id, day_of_week, is_delivery_day, cut_off_time) VALUES (?, ?, ?, ?)');
    for (let storeId = 1; storeId <= 2; storeId++) {
      for (let day = 0; day <= 6; day++) {
        const isDelivery = day !== 0 ? 1 : 0;
        insertCalendar.run(storeId, day, isDelivery, '18:00');
      }
    }

    const insertInventory = db.prepare('INSERT OR IGNORE INTO inventory (store_id, product_id, quantity, safety_stock) VALUES (?, ?, ?, ?)');
    for (let storeId = 1; storeId <= 2; storeId++) {
      for (let productId = 1; productId <= 7; productId++) {
        insertInventory.run(storeId, productId, 20 + Math.floor(Math.random() * 30), 10 + Math.floor(Math.random() * 10));
      }
    }

    const insertSales = db.prepare('INSERT INTO sales_history (store_id, product_id, sale_date, quantity) VALUES (?, ?, ?, ?)');
    const today = new Date();
    for (let storeId = 1; storeId <= 2; storeId++) {
      for (let d = 1; d <= 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        for (let productId = 1; productId <= 7; productId++) {
          insertSales.run(storeId, productId, dateStr, 5 + Math.floor(Math.random() * 15));
        }
      }
    }
  }
}

initDatabase();

module.exports = db;
