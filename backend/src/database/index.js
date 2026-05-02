const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let dbPath = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  dbPath = path.join(__dirname, '../../data/app.sqlite');
  
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initTables();
  }
  
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function saveDb() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function initTables() {
  const sql = getDb();
  
  sql.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      operator_id TEXT,
      venue_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS chargers (
      id TEXT PRIMARY KEY,
      station_id TEXT,
      charger_code TEXT UNIQUE,
      power INTEGER,
      status TEXT DEFAULT 'idle',
      connector_type TEXT,
      qr_code TEXT,
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS charging_sessions (
      id TEXT PRIMARY KEY,
      charger_id TEXT,
      user_id TEXT,
      start_time DATETIME,
      end_time DATETIME,
      start_energy REAL DEFAULT 0,
      end_energy REAL DEFAULT 0,
      total_energy REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS charging_records (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      timestamp DATETIME,
      voltage REAL,
      current REAL,
      power REAL,
      energy REAL,
      temperature REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      user_id TEXT,
      amount REAL,
      payment_method TEXT,
      status TEXT,
      transaction_id TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      operator_id TEXT,
      venue_id TEXT,
      total_amount REAL,
      operator_amount REAL,
      venue_amount REAL,
      platform_fee REAL,
      status TEXT DEFAULT 'pending',
      settled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS maintenance_orders (
      id TEXT PRIMARY KEY,
      charger_id TEXT,
      station_id TEXT,
      user_id TEXT,
      type TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      priority TEXT DEFAULT 'normal',
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      user_id TEXT,
      rating INTEGER,
      comment TEXT,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS hash_chain (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT,
      record_id TEXT,
      hash TEXT,
      previous_hash TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      content TEXT,
      type TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT,
      contact_person TEXT,
      phone TEXT,
      settlement_ratio REAL DEFAULT 0.7,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sql.run(`
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT,
      contact_person TEXT,
      phone TEXT,
      settlement_ratio REAL DEFAULT 0.2,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  initSampleData();
  saveDb();
}

function initSampleData() {
  const sql = getDb();
  const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const operatorId = uuidv4();
  sql.run(`
    INSERT INTO operators (id, name, contact_person, phone, settlement_ratio)
    VALUES (?, ?, ?, ?, ?)
  `, [operatorId, '阳光充电运营有限公司', '张运营', '13800138001', 0.7]);

  const venueId = uuidv4();
  sql.run(`
    INSERT INTO venues (id, name, contact_person, phone, settlement_ratio)
    VALUES (?, ?, ?, ?, ?)
  `, [venueId, '万达广场停车场', '李场长', '13800138002', 0.2]);

  const userId = uuidv4();
  sql.run(`
    INSERT INTO users (id, username, password, name, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, 'user1', '123456', '车主小王', 'owner', '13900139001']);

  const adminId = uuidv4();
  sql.run(`
    INSERT INTO users (id, username, password, name, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [adminId, 'admin', 'admin123', '系统管理员', 'admin', '13900139002']);

  const maintainerId = uuidv4();
  sql.run(`
    INSERT INTO users (id, username, password, name, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [maintainerId, 'maintainer', 'main123', '运维工程师', 'maintainer', '13900139003']);

  const stationId = uuidv4();
  sql.run(`
    INSERT INTO stations (id, name, address, latitude, longitude, operator_id, venue_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [stationId, '万达广场充电站', '北京市朝阳区万达广场地下停车场B2层', 39.9042, 116.4074, operatorId, venueId]);

  for (let i = 1; i <= 6; i++) {
    const chargerId = uuidv4();
    const status = i <= 3 ? 'idle' : 'charging';
    sql.run(`
      INSERT INTO chargers (id, station_id, charger_code, power, status, connector_type, qr_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [chargerId, stationId, `CH-${String(i).padStart(3, '0')}`, 120, status, 'DC-CCS2', `QR-${String(i).padStart(3, '0')}`]);
  }
}

module.exports = {
  initDatabase,
  getDb,
  saveDb
};
