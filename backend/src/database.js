const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_floors INTEGER DEFAULT 33,
      units_per_floor INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL,
      unit_number TEXT NOT NULL,
      floor INTEGER NOT NULL,
      house_type TEXT NOT NULL,
      area REAL NOT NULL,
      orientation TEXT NOT NULL,
      decoration TEXT NOT NULL,
      base_price REAL NOT NULL,
      list_price REAL NOT NULL,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      UNIQUE(building_id, unit_number)
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      source TEXT NOT NULL,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      consultant_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      expire_at DATETIME NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (consultant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      consultant_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      id_card TEXT,
      agreed_price REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      discount_reason TEXT,
      status TEXT DEFAULT 'pending_approval',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (consultant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      approver_id INTEGER,
      approval_level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      contract_number TEXT UNIQUE,
      final_price REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      payment_type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      transaction_no TEXT,
      status TEXT DEFAULT 'pending',
      operator_id INTEGER,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      operator_id INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const insertUser = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    
    insertUser.run('admin', bcrypt.hashSync('admin123', 10), '系统管理员', 'admin');
    insertUser.run('manager', bcrypt.hashSync('manager123', 10), '案场经理', 'manager');
    insertUser.run('consultant1', bcrypt.hashSync('123456', 10), '置业顾问张三', 'consultant');
    insertUser.run('consultant2', bcrypt.hashSync('123456', 10), '置业顾问李四', 'consultant');
    insertUser.run('finance', bcrypt.hashSync('finance123', 10), '财务人员', 'finance');
    insertUser.run('operation', bcrypt.hashSync('operation123', 10), '运营人员', 'operation');
  }

  const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get();
  if (buildingCount.count === 0) {
    const insertBuilding = db.prepare('INSERT INTO buildings (name, total_floors, units_per_floor) VALUES (?, ?, ?)');
    insertBuilding.run('1号楼', 33, 4);
    insertBuilding.run('2号楼', 33, 4);
    
    const insertProperty = db.prepare(`
      INSERT INTO properties (building_id, unit_number, floor, house_type, area, orientation, decoration, base_price, list_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `);

    const houseTypes = ['三室两厅', '四室两厅', '两室一厅', '三室一厅'];
    const orientations = ['南北通透', '朝南', '朝东', '朝西'];
    const decorations = ['精装修', '毛坯', '简装'];

    for (let buildingId = 1; buildingId <= 2; buildingId++) {
      for (let floor = 1; floor <= 33; floor++) {
        for (let unit = 1; unit <= 4; unit++) {
          const unitNumber = `${floor}0${unit}`;
          const houseType = houseTypes[(unit - 1) % houseTypes.length];
          const area = 90 + Math.floor(Math.random() * 60);
          const orientation = orientations[(unit - 1) % orientations.length];
          const decoration = decorations[Math.floor(Math.random() * decorations.length)];
          const basePrice = 15000 + Math.floor(Math.random() * 3000);
          const listPrice = basePrice + 2000 + Math.floor(Math.random() * 2000);
          
          insertProperty.run(buildingId, unitNumber, floor, houseType, area, orientation, decoration, basePrice, listPrice);
        }
      }
    }
  }
}

initDatabase();

module.exports = db;
