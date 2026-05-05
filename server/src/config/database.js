const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let db = null;
const DB_PATH = path.join(__dirname, '..', '..', process.env.DB_PATH || './data/smart_home.db');

async function init() {
  const SQL = await initSqlJs();
  
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      last_online DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS device_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      data_type TEXT NOT NULL,
      value TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS control_commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      command TEXT NOT NULL,
      parameters TEXT,
      status TEXT DEFAULT 'pending',
      executed_by INTEGER,
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS temperature_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      temperature REAL NOT NULL,
      target_temperature REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS video_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      device_id TEXT,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      acknowledged BOOLEAN DEFAULT 0,
      acknowledged_by INTEGER,
      acknowledged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_device_data_device_id ON device_data(device_id)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_device_data_created_at ON device_data(created_at)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_temperature_records_created_at ON temperature_records(created_at)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)
  `);
  
  const adminResult = db.exec("SELECT id FROM users WHERE username = ?", [process.env.ADMIN_USERNAME || 'admin']);
  if (adminResult.length === 0 || adminResult[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [process.env.ADMIN_USERNAME || 'admin', hashedPassword, 'admin']
    );
    console.log('默认管理员账户已创建');
  }
  
  const userResult = db.exec("SELECT id FROM users WHERE username = ?", [process.env.USER_USERNAME || 'user']);
  if (userResult.length === 0 || userResult[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync(process.env.USER_PASSWORD || 'user123', 10);
    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [process.env.USER_USERNAME || 'user', hashedPassword, 'user']
    );
    console.log('默认普通用户账户已创建');
  }
  
  saveDatabase();
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function run(sql, params = []) {
  const result = db.run(sql, params);
  saveDatabase();
  return result;
}

function get(sql, params = []) {
  const result = db.exec(sql, params);
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const row = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

function all(sql, params = []) {
  const result = db.exec(sql, params);
  if (result.length === 0) {
    return [];
  }
  
  const columns = result[0].columns;
  return result[0].values.map(values => {
    const row = {};
    columns.forEach((col, i) => {
      row[col] = values[i];
    });
    return row;
  });
}

module.exports = {
  init,
  run,
  get,
  all,
  saveDatabase
};
