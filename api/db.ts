import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(path.join(dataDir, 'app.sqlite'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('canteen_admin','logistics','parent','regulator')),
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  license_no TEXT,
  qualification_expiry DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','expired')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS procurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  batch_no TEXT NOT NULL,
  material_name TEXT NOT NULL,
  inspection_report TEXT,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  arrival_time DATETIME NOT NULL,
  inspector_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  procurement_id INTEGER NOT NULL REFERENCES procurements(id),
  location TEXT NOT NULL,
  quantity REAL NOT NULL,
  remaining REAL NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal','near_expiry','expired','disposed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS requisitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL REFERENCES inventories(id),
  quantity REAL NOT NULL,
  window_no TEXT NOT NULL,
  menu_id INTEGER REFERENCES menus(id),
  requisition_time DATETIME NOT NULL,
  operator_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS menu_dishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL REFERENCES menus(id),
  dish_name TEXT NOT NULL,
  chef_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS menu_dish_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_dish_id INTEGER NOT NULL REFERENCES menu_dishes(id),
  procurement_id INTEGER NOT NULL REFERENCES procurements(id),
  quantity REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_dish_id INTEGER NOT NULL REFERENCES menu_dishes(id),
  photo_url TEXT,
  sample_time DATETIME NOT NULL,
  operator_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('supplier_expired','material_unqualified','sample_missing','complaint')),
  title TEXT NOT NULL,
  description TEXT,
  related_id INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','processing','closed')),
  reporter_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rectifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anomaly_id INTEGER NOT NULL REFERENCES anomalies(id),
  measure TEXT NOT NULL,
  result TEXT,
  operator_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`)

const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
if (userCount === 0) {
  const h = bcrypt.hashSync('123456', 10)
  db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('admin', h, '\u7cfb\u7edf\u7ba1\u7406\u5458', 'canteen_admin')
  db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('logistics', h, '\u540e\u52e4\u5f20\u4e3b\u4efb', 'logistics')
  db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('parent', h, '\u5bb6\u957f\u674e\u5973\u58eb', 'parent')
  db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('regulator', h, '\u76d1\u7ba1\u738b\u79d1\u957f', 'regulator')
  db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('chef1', h, '\u53a8\u5e08\u5218\u5e08\u5085', 'canteen_admin')
  db.prepare('INSERT INTO suppliers (name, contact, phone, license_no, qualification_expiry, status) VALUES (?, ?, ?, ?, ?, ?)').run('\u7eff\u8272\u7530\u56ed\u519c\u4e1a\u516c\u53f8', '\u5f20\u7ecf\u7406', '13800001111', 'SC1234567890', '2026-12-31', 'active')
  db.prepare('INSERT INTO suppliers (name, contact, phone, license_no, qualification_expiry, status) VALUES (?, ?, ?, ?, ?, ?)').run('\u9c9c\u7f8e\u98df\u54c1\u4f9b\u5e94\u7ad9', '\u674e\u7ecf\u7406', '13900002222', 'SC9876543210', '2025-06-30', 'active')
  db.prepare('INSERT INTO suppliers (name, contact, phone, license_no, qualification_expiry, status) VALUES (?, ?, ?, ?, ?, ?)').run('\u653e\u5fc3\u8089\u8054\u5382', '\u738b\u7ecf\u7406', '13700003333', 'SC5555666677', '2025-03-15', 'expired')
  db.prepare('INSERT INTO procurements (supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(1, 'B20250520-001', '\u6709\u673a\u767d\u83dc', 'RPT20250520-001', 500, 'kg', 3.5, '2025-05-20 07:30:00', 1, 'verified')
  db.prepare('INSERT INTO procurements (supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(1, 'B20250520-002', '\u6709\u673a\u571f\u8c46', 'RPT20250520-002', 300, 'kg', 4.0, '2025-05-20 07:35:00', 1, 'verified')
  db.prepare('INSERT INTO procurements (supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(2, 'B20250521-001', '\u9c9c\u9e21\u86cb', 'RPT20250521-001', 200, 'kg', 12.0, '2025-05-21 06:00:00', 1, 'verified')
  db.prepare('INSERT INTO procurements (supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(3, 'B20250522-001', '\u732a\u91cc\u810a', 'RPT20250522-001', 100, 'kg', 28.0, '2025-05-22 06:30:00', 1, 'pending')
  db.prepare('INSERT INTO procurements (supplier_id, batch_no, material_name, inspection_report, quantity, unit, price, arrival_time, inspector_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(2, 'B20250523-001', '\u897f\u7ea2\u67ff', 'RPT20250523-001', 150, 'kg', 5.5, '2025-05-23 07:00:00', 1, 'verified')
  db.prepare('INSERT INTO inventories (procurement_id, location, quantity, remaining, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(1, 'A-01-01', 500, 350, '2025-06-20', 'normal')
  db.prepare('INSERT INTO inventories (procurement_id, location, quantity, remaining, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(2, 'A-01-02', 300, 200, '2025-07-15', 'normal')
  db.prepare('INSERT INTO inventories (procurement_id, location, quantity, remaining, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(3, 'B-02-01', 200, 150, '2025-06-10', 'normal')
  db.prepare('INSERT INTO inventories (procurement_id, location, quantity, remaining, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(4, 'C-03-01', 100, 100, '2025-06-01', 'near_expiry')
  db.prepare('INSERT INTO inventories (procurement_id, location, quantity, remaining, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(5, 'A-02-01', 150, 80, '2025-06-05', 'near_expiry')
  db.prepare('INSERT INTO menus (menu_date) VALUES (?)').run('2025-05-25')
  db.prepare('INSERT INTO menus (menu_date) VALUES (?)').run('2025-05-26')
  db.prepare('INSERT INTO menu_dishes (menu_id, dish_name, chef_id) VALUES (?, ?, ?)').run(1, '\u767d\u83dc\u7096\u8c46\u8150', 5)
  db.prepare('INSERT INTO menu_dishes (menu_id, dish_name, chef_id) VALUES (?, ?, ?)').run(1, '\u571f\u8c46\u70e7\u725b\u8089', 5)
  db.prepare('INSERT INTO menu_dishes (menu_id, dish_name, chef_id) VALUES (?, ?, ?)').run(1, '\u756a\u8304\u7092\u86cb', 5)
  db.prepare('INSERT INTO menu_dishes (menu_id, dish_name, chef_id) VALUES (?, ?, ?)').run(2, '\u7cd6\u918b\u91cc\u810a', 5)
  db.prepare('INSERT INTO menu_dishes (menu_id, dish_name, chef_id) VALUES (?, ?, ?)').run(2, '\u767d\u83dc\u732a\u8089\u997a\u5b50', 5)
  db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(1, 1, 50)
  db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(2, 2, 30)
  db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(3, 3, 20)
  db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(3, 5, 15)
  db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(4, 4, 25)
  db.prepare('INSERT INTO menu_dish_ingredients (menu_dish_id, procurement_id, quantity) VALUES (?, ?, ?)').run(5, 1, 40)
  db.prepare('INSERT INTO requisitions (inventory_id, quantity, window_no, menu_id, requisition_time, operator_id) VALUES (?, ?, ?, ?, ?, ?)').run(1, 50, '\u7a97\u53e31', 1, '2025-05-25 06:00:00', 1)
  db.prepare('INSERT INTO requisitions (inventory_id, quantity, window_no, menu_id, requisition_time, operator_id) VALUES (?, ?, ?, ?, ?, ?)').run(2, 30, '\u7a97\u53e32', 1, '2025-05-25 06:05:00', 1)
  db.prepare('INSERT INTO requisitions (inventory_id, quantity, window_no, menu_id, requisition_time, operator_id) VALUES (?, ?, ?, ?, ?, ?)').run(3, 20, '\u7a97\u53e31', 1, '2025-05-25 06:10:00', 1)
  db.prepare('INSERT INTO requisitions (inventory_id, quantity, window_no, menu_id, requisition_time, operator_id) VALUES (?, ?, ?, ?, ?, ?)').run(4, 25, '\u7a97\u53e33', 2, '2025-05-26 06:00:00', 1)
  db.prepare('INSERT INTO samples (menu_dish_id, photo_url, sample_time, operator_id) VALUES (?, ?, ?, ?)').run(1, '/uploads/sample_baicai.jpg', '2025-05-25 11:30:00', 1)
  db.prepare('INSERT INTO samples (menu_dish_id, photo_url, sample_time, operator_id) VALUES (?, ?, ?, ?)').run(2, '/uploads/sample_tudou.jpg', '2025-05-25 11:35:00', 1)
  db.prepare('INSERT INTO samples (menu_dish_id, photo_url, sample_time, operator_id) VALUES (?, ?, ?, ?)').run(3, '/uploads/sample_fanqie.jpg', '2025-05-25 11:40:00', 1)
  db.prepare('INSERT INTO anomalies (type, title, description, related_id, status, reporter_id) VALUES (?, ?, ?, ?, ?, ?)').run('supplier_expired', '\u653e\u5fc3\u8089\u8054\u5382\u8d44\u8d28\u8fc7\u671f', '\u4f9b\u5e94\u5546\u8d44\u8d28\u5df2\u4e8e2025-03-15\u8fc7\u671f\uff0c\u9700\u7acb\u5373\u505c\u7528\u5e76\u901a\u77e5\u6574\u6539', 3, 'open', 2)
  db.prepare('INSERT INTO anomalies (type, title, description, related_id, status, reporter_id) VALUES (?, ?, ?, ?, ?, ?)').run('material_unqualified', '\u732a\u91cc\u810a\u68c0\u9a8c\u62a5\u544a\u7f3a\u5931', '\u6279\u6b21B20250522-001\u7684\u732a\u91cc\u810a\u5c1a\u672a\u63d0\u4f9b\u68c0\u9a8c\u62a5\u544a', 4, 'processing', 1)
  db.prepare('INSERT INTO anomalies (type, title, description, related_id, status, reporter_id) VALUES (?, ?, ?, ?, ?, ?)').run('sample_missing', '5\u670826\u65e5\u83dc\u54c1\u672a\u7559\u6837', '2025-05-26\u83dc\u5355\u4e2d\u7684\u7cd6\u918b\u91cc\u810a\u548c\u767d\u83dc\u732a\u8089\u997a\u5b50\u7f3a\u5c11\u7559\u6837\u8bb0\u5f55', 2, 'open', 2)
  db.prepare('INSERT INTO rectifications (anomaly_id, measure, result, operator_id) VALUES (?, ?, ?, ?)').run(2, '\u5df2\u8054\u7cfb\u4f9b\u5e94\u5546\u8865\u4ea4\u68c0\u9a8c\u62a5\u544a\uff0c\u9884\u8ba13\u5929\u5185\u63d0\u4f9b', '\u8fdb\u884c\u4e2d', 2)
}

export default db
