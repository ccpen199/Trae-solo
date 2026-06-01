const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, dbPath));

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_floors INTEGER DEFAULT 0,
      total_area REAL DEFAULT 0,
      address TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS floors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL,
      floor_number INTEGER NOT NULL,
      area REAL DEFAULT 0,
      unit_count INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL,
      floor_id INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      area REAL NOT NULL,
      business_type TEXT,
      rent_price REAL NOT NULL,
      rent_unit TEXT DEFAULT 'month',
      available_date DATE,
      supporting_facilities TEXT,
      status TEXT DEFAULT 'available',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (floor_id) REFERENCES floors(id)
    );

    CREATE TABLE IF NOT EXISTS room_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by INTEGER,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      company_scale TEXT,
      industry TEXT,
      required_area REAL,
      budget REAL,
      source_channel TEXT,
      follow_person TEXT,
      status TEXT DEFAULT 'new',
      description TEXT,
      is_duplicate INTEGER DEFAULT 0,
      merge_with_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      follow_type TEXT,
      follow_time DATETIME,
      content TEXT,
      feedback TEXT,
      follow_person TEXT,
      next_follow_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS viewings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      viewing_time DATETIME NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      room_ids TEXT,
      feedback TEXT,
      satisfaction_level INTEGER,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      viewing_id INTEGER,
      version INTEGER DEFAULT 1,
      is_locked INTEGER DEFAULT 0,
      room_ids TEXT,
      base_rent REAL,
      discount_policy TEXT,
      discount_amount REAL,
      final_price REAL,
      payment_method TEXT,
      valid_days INTEGER DEFAULT 30,
      expire_date DATE,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (viewing_id) REFERENCES viewings(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      quote_id INTEGER,
      room_ids TEXT NOT NULL,
      contract_number TEXT UNIQUE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      rent_amount REAL NOT NULL,
      rent_payment_cycle TEXT DEFAULT 'month',
      deposit_amount REAL,
      deposit_type TEXT,
      free_rent_days INTEGER DEFAULT 0,
      property_fee REAL,
      property_fee_cycle TEXT,
      delivery_items TEXT,
      status TEXT DEFAULT 'pending',
      approval_status TEXT DEFAULT 'pending',
      signed_by_tenant TEXT,
      signed_by_park TEXT,
      sign_date DATE,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      company_name TEXT,
      check_in_date DATE,
      actual_check_in_date DATE,
      status TEXT DEFAULT 'pending',
      handover_status TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'operator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, role) VALUES (?, ?, ?)');
    insertUser.run('admin', '系统管理员', 'admin');
    insertUser.run('manager1', '招商经理1', 'manager');
    insertUser.run('operator1', '运营人员1', 'operator');
  }
}

initDatabase();

module.exports = db;
