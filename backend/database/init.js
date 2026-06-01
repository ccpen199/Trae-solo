require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT UNIQUE NOT NULL,
    plate_number TEXT,
    brand TEXT,
    model TEXT,
    year INTEGER,
    color TEXT,
    mileage REAL,
    current_valuation REAL,
    status TEXT DEFAULT 'pending',
    photos TEXT,
    ownership_docs TEXT,
    insurance_docs TEXT,
    mortgage_docs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS valuations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    valuator_id INTEGER,
    valuator_name TEXT,
    valuation_value REAL NOT NULL,
    valuation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    reviewer_id INTEGER,
    reviewer_name TEXT,
    review_date DATETIME,
    review_notes TEXT,
    difference_explanation TEXT,
    is_anomaly INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    contract_number TEXT UNIQUE NOT NULL,
    borrower_name TEXT,
    borrower_id_card TEXT,
    borrower_phone TEXT,
    loan_amount REAL NOT NULL,
    loan_term INTEGER NOT NULL,
    interest_rate REAL,
    status TEXT DEFAULT 'pending',
    disbursement_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS mortgage_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    registration_number TEXT UNIQUE,
    handler_name TEXT,
    handle_date DATETIME,
    status TEXT DEFAULT 'pending',
    attachments TEXT,
    release_date DATETIME,
    release_handler TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS gps_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    device_number TEXT UNIQUE NOT NULL,
    install_date DATETIME,
    install_location TEXT,
    status TEXT DEFAULT 'installed',
    last_online_time DATETIME,
    current_lat REAL,
    current_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS gps_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    lat REAL,
    lng REAL,
    description TEXT,
    is_alert INTEGER DEFAULT 0,
    handled INTEGER DEFAULT 0,
    handled_by TEXT,
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES gps_devices(id)
  );

  CREATE TABLE IF NOT EXISTS repayment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    period INTEGER NOT NULL,
    due_date DATETIME NOT NULL,
    amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    paid_date DATETIME,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS risk_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    vehicle_id INTEGER,
    loan_id INTEGER,
    gps_event_id INTEGER,
    level TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    description TEXT,
    handler TEXT,
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS disposal_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    loan_id INTEGER,
    action_type TEXT NOT NULL,
    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    handler TEXT,
    result TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS collection_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    vehicle_id INTEGER,
    collector TEXT,
    contact_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    contact_result TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
`);

console.log('数据库初始化完成');
db.close();
