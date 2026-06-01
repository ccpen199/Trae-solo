const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS factories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region TEXT,
      category TEXT,
      scale TEXT,
      equipment TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      main_customers TEXT,
      cooperation_status TEXT DEFAULT 'pending',
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      issue_date DATE,
      expiry_date DATE,
      file_url TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS production_capacity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL UNIQUE,
      monthly_capacity TEXT,
      moq TEXT,
      delivery_time TEXT,
      peak_season_restriction TEXT,
      outsourcing_capability TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      process TEXT,
      material TEXT,
      price DECIMAL(10,2),
      sample_cycle TEXT,
      customer_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      sample_id INTEGER,
      product_name TEXT NOT NULL,
      process TEXT,
      material TEXT,
      price DECIMAL(10,2),
      quantity INTEGER,
      delivery_time TEXT,
      customer_feedback TEXT,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
      FOREIGN KEY (sample_id) REFERENCES samples(id)
    );

    CREATE TABLE IF NOT EXISTS factory_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      description TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS factory_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      inspector TEXT,
      inspection_date DATE,
      result TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      source TEXT,
      content TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cooperation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      customer_name TEXT,
      project_name TEXT,
      start_date DATE,
      end_date DATE,
      status TEXT,
      amount DECIMAL(12,2),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      auditor TEXT,
      action TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );
  `);
};

initDatabase();

module.exports = db;
