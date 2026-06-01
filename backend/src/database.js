const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact_person TEXT,
      contact_phone TEXT,
      floor TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      is_blacklisted INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'low',
      blacklist_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parking_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_spaces INTEGER NOT NULL,
      available_spaces INTEGER NOT NULL,
      location TEXT,
      hourly_rate REAL DEFAULT 5.0,
      daily_max REAL DEFAULT 50.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_no TEXT UNIQUE NOT NULL,
      visitor_id INTEGER,
      visitor_name TEXT NOT NULL,
      visitor_phone TEXT,
      visitor_id_card TEXT,
      license_plate TEXT,
      enterprise_id INTEGER NOT NULL,
      enterprise_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_phone TEXT,
      visit_reason TEXT,
      scheduled_arrival DATETIME NOT NULL,
      scheduled_departure DATETIME,
      status TEXT DEFAULT 'pending',
      review_status TEXT DEFAULT 'auto_passed',
      reviewer_id INTEGER,
      review_comment TEXT,
      review_time DATETIME,
      qr_code TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visitor_id) REFERENCES visitors(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      checkin_method TEXT NOT NULL,
      checkin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      gate_no TEXT,
      operator_id INTEGER,
      remarks TEXT,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS parking_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      license_plate TEXT NOT NULL,
      parking_lot_id INTEGER,
      space_no TEXT,
      entry_time DATETIME,
      exit_time DATETIME,
      parking_duration INTEGER,
      parking_fee REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      discount_reason TEXT,
      discount_status TEXT DEFAULT 'none',
      discount_approver_id INTEGER,
      payment_status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id)
    );

    CREATE TABLE IF NOT EXISTS checkouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      checkout_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      stay_duration INTEGER,
      visitor_confirmation INTEGER DEFAULT 0,
      contact_confirmation INTEGER DEFAULT 0,
      security_confirmation INTEGER DEFAULT 0,
      anomalies TEXT,
      operator_id INTEGER,
      remarks TEXT,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      action TEXT NOT NULL,
      action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      operator_id INTEGER,
      details TEXT,
      ip_address TEXT,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS operators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const enterpriseCount = db.prepare('SELECT COUNT(*) as count FROM enterprises').get().count;
  if (enterpriseCount === 0) {
    const insertEnterprise = db.prepare('INSERT INTO enterprises (name, contact_person, contact_phone, floor) VALUES (?, ?, ?, ?)');
    insertEnterprise.run('腾讯科技', '张经理', '13800138001', 'A座15层');
    insertEnterprise.run('阿里巴巴', '李总监', '13800138002', 'B座20层');
    insertEnterprise.run('字节跳动', '王主管', '13800138003', 'C座8层');
    insertEnterprise.run('华为技术', '赵工程师', '13800138004', 'D座12层');
  }

  const parkingLotCount = db.prepare('SELECT COUNT(*) as count FROM parking_lots').get().count;
  if (parkingLotCount === 0) {
    const insertParkingLot = db.prepare('INSERT INTO parking_lots (name, total_spaces, available_spaces, location, hourly_rate, daily_max) VALUES (?, ?, ?, ?, ?, ?)');
    insertParkingLot.run('地下停车场A区', 100, 100, '地下一层A区', 5.0, 50.0);
    insertParkingLot.run('地下停车场B区', 80, 80, '地下一层B区', 5.0, 50.0);
    insertParkingLot.run('地面停车场', 50, 50, '园区东门', 3.0, 30.0);
  }

  const operatorCount = db.prepare('SELECT COUNT(*) as count FROM operators').get().count;
  if (operatorCount === 0) {
    const insertOperator = db.prepare('INSERT INTO operators (username, password, name, role) VALUES (?, ?, ?, ?)');
    insertOperator.run('admin', 'admin123', '系统管理员', 'admin');
    insertOperator.run('security', 'security123', '安保人员', 'security');
    insertOperator.run('reception', 'reception123', '前台接待', 'reception');
    insertOperator.run('parking', 'parking123', '车场管理', 'parking');
  }
}

module.exports = {
  db,
  initDatabase
};
