import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      opening_hours TEXT,
      suitable_for TEXT,
      price REAL,
      stock INTEGER DEFAULT 0,
      notes TEXT,
      is_closed INTEGER DEFAULT 0,
      season_start TEXT,
      season_end TEXT,
      supplier_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT,
      content TEXT,
      copyright TEXT,
      channels TEXT,
      expire_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration_days INTEGER,
      created_by TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS route_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER,
      resource_id INTEGER,
      day_number INTEGER,
      order_in_day INTEGER,
      start_time TEXT,
      end_time TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    );

    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER,
      resource_id INTEGER,
      type TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    );
  `);

  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
  if (supplierCount === 0) {
    const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact, phone, email) VALUES (?, ?, ?, ?)');
    insertSupplier.run('携程旅游', '张经理', '13800138001', 'zhang@ctrip.com');
    insertSupplier.run('途牛旅行', '李主管', '13800138002', 'li@tuniu.com');
    insertSupplier.run('同程旅游', '王总监', '13800138003', 'wang@ly.com');
  }

  const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get().count;
  if (resourceCount === 0) {
    const insertResource = db.prepare(`
      INSERT INTO resources (type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, supplier_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertResource.run('scenic', '故宫博物院', '中国明清两代的皇家宫殿', '北京市东城区景山前街4号', 39.9163, 116.3972, '08:30-17:00', '全年龄段', 60, 1000, 1, '周一闭馆');
    insertResource.run('scenic', '长城', '世界文化遗产', '北京市延庆区', 40.4319, 116.5704, '07:30-18:00', '全年龄段', 45, 2000, 1, '建议穿舒适鞋子');
    insertResource.run('hotel', '北京饭店', '五星级豪华酒店', '北京市东城区东长安街33号', 39.9087, 116.4074, '24小时', '商务/旅游', 888, 200, 2, '含早餐');
    insertResource.run('restaurant', '全聚德', '北京烤鸭老字号', '北京市东城区前门大街30号', 39.8995, 116.3978, '10:00-22:00', '全年龄段', 200, 500, 3, '需提前预订');
    insertResource.run('activity', '京剧表演', '传统京剧演出', '北京市西城区', 39.9139, 116.3748, '19:30-21:30', '文化爱好者', 180, 300, 1, '建议提前30分钟入场');
  }
};

export { db, initDatabase };
