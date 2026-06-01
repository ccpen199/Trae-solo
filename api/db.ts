import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'customer',
      store_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      store_id INTEGER,
      duration INTEGER DEFAULT 60,
      price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS coupon_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      total_count INTEGER DEFAULT 1,
      price REAL NOT NULL,
      cost_price REAL NOT NULL,
      valid_days INTEGER DEFAULT 30,
      purchase_limit INTEGER DEFAULT 1,
      requires_appointment INTEGER DEFAULT 0,
      settlement_rule TEXT DEFAULT 'daily',
      commission_rate REAL DEFAULT 0.1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon_package_stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES coupon_packages(id) ON DELETE CASCADE,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      UNIQUE(package_id, store_id)
    );

    CREATE TABLE IF NOT EXISTS coupon_package_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES coupon_packages(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      UNIQUE(package_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      package_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      store_id INTEGER,
      remaining_count INTEGER NOT NULL,
      total_count INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      expire_at DATETIME NOT NULL,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES coupon_packages(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      service_id INTEGER,
      staff_id INTEGER,
      appointment_time DATETIME NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      service_id INTEGER,
      staff_id INTEGER,
      appointment_id INTEGER,
      verification_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'success',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (staff_id) REFERENCES users(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      verification_id INTEGER NOT NULL,
      coupon_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      commission REAL NOT NULL,
      net_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      settled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (verification_id) REFERENCES verifications(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
    CREATE INDEX IF NOT EXISTS idx_verifications_store ON verifications(store_id);
    CREATE INDEX IF NOT EXISTS idx_verifications_time ON verifications(verification_time);
    CREATE INDEX IF NOT EXISTS idx_settlements_store ON settlements(store_id);
    CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
  `);

  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get() as { count: number };
  if (storeCount.count === 0) {
    const insertStore = db.prepare('INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)');
    insertStore.run('朝阳门店', '北京市朝阳区朝阳路1号', '010-12345678');
    insertStore.run('海淀门店', '北京市海淀区海淀路2号', '010-87654321');

    const insertService = db.prepare('INSERT INTO services (name, store_id, duration, price) VALUES (?, ?, ?, ?)');
    insertService.run('经典洗剪吹', 1, 45, 68);
    insertService.run('资深设计师剪发', 1, 60, 128);
    insertService.run('染发套餐', 1, 120, 298);
    insertService.run('经典洗剪吹', 2, 45, 68);
    insertService.run('护理套餐', 2, 90, 198);

    const insertUser = db.prepare('INSERT INTO users (phone, name, role, store_id) VALUES (?, ?, ?, ?)');
    insertUser.run('13800138001', '张三', 'customer', null);
    insertUser.run('13800138002', '李四', 'customer', null);
    insertUser.run('13800138003', '王店员', 'staff', 1);
    insertUser.run('13800138004', '赵店长', 'admin', 1);
    insertUser.run('13800138005', '财务', 'finance', null);

    const insertPackage = db.prepare(`
      INSERT INTO coupon_packages 
      (name, description, total_count, price, cost_price, valid_days, purchase_limit, requires_appointment, commission_rate) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const pkg1 = insertPackage.run('洗剪吹3次卡', '包含3次经典洗剪吹服务，两店通用', 3, 168, 100, 90, 2, 0, 0.15);
    const pkg2 = insertPackage.run('染发套餐', '专业染发服务，含护理', 1, 268, 150, 60, 1, 1, 0.2);
    const pkg3 = insertPackage.run('洗剪吹月卡', '一月内不限次数洗剪吹', 10, 299, 180, 30, 1, 0, 0.1);

    const insertPkgStore = db.prepare('INSERT INTO coupon_package_stores (package_id, store_id) VALUES (?, ?)');
    insertPkgStore.run(1, 1);
    insertPkgStore.run(1, 2);
    insertPkgStore.run(2, 1);
    insertPkgStore.run(3, 1);
    insertPkgStore.run(3, 2);

    const insertPkgService = db.prepare('INSERT INTO coupon_package_services (package_id, service_id) VALUES (?, ?)');
    insertPkgService.run(1, 1);
    insertPkgService.run(1, 4);
    insertPkgService.run(2, 3);
    insertPkgService.run(3, 1);
    insertPkgService.run(3, 4);

    const generateCode = () => 'CP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (code, package_id, user_id, store_id, remaining_count, total_count, status, expire_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+90 days'))
    `);
    insertCoupon.run(generateCode(), 1, 1, null, 3, 3, 'active');
    insertCoupon.run(generateCode(), 2, 1, 1, 1, 1, 'active');
    insertCoupon.run(generateCode(), 1, 2, null, 2, 3, 'partial');
  }
}

export default db;
