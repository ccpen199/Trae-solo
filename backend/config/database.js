const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT DEFAULT 'user',
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS trademarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_code TEXT,
    status TEXT DEFAULT 'pending',
    application_number TEXT,
    registration_number TEXT,
    application_date DATE,
    registration_date DATE,
    expiry_date DATE,
    image_url TEXT,
    feature_vector TEXT,
    owner TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS trademark_ocr_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trademark_id INTEGER,
    file_url TEXT,
    ocr_data TEXT,
    applicant_name TEXT,
    application_number TEXT,
    application_date DATE,
    trademark_name TEXT,
    category TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trademark_id) REFERENCES trademarks(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS trademark_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trademark_id INTEGER,
    assignor_id INTEGER,
    assignee_id INTEGER,
    assignor_name TEXT,
    assignee_name TEXT,
    transfer_price DECIMAL(15,2),
    contract_url TEXT,
    notary_certificate_id INTEGER,
    status TEXT DEFAULT 'draft',
    signed_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trademark_id) REFERENCES trademarks(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS patents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    patent_number TEXT,
    application_number TEXT,
    application_date DATE,
    grant_date DATE,
    expiry_date DATE,
    patent_type TEXT,
    status TEXT DEFAULT 'pending',
    legal_status_tree TEXT,
    inventor TEXT,
    applicant TEXT,
    abstract TEXT,
    next_fee_due_date DATE,
    last_fee_paid_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS patent_fee_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patent_id INTEGER,
    fee_type TEXT,
    due_date DATE,
    amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    reminded_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patent_id) REFERENCES patents(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS copyrights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    work_type TEXT,
    creation_date DATE,
    registration_number TEXT,
    registration_date DATE,
    hash_fingerprint TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'pending',
    ai_precheck_result TEXT,
    ai_precheck_score INTEGER,
    author TEXT,
    owner TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notary_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER,
    certificate_number TEXT,
    notary_office TEXT,
    notary_name TEXT,
    notary_date DATE,
    certificate_url TEXT,
    verification_code TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transfer_id) REFERENCES trademark_transfers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS agencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE,
    legal_representative TEXT,
    address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    qualification_level TEXT,
    verification_status TEXT DEFAULT 'pending',
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    case_number TEXT UNIQUE,
    case_type TEXT,
    ip_type TEXT,
    title TEXT,
    status TEXT DEFAULT 'pending',
    agency_id INTEGER,
    official_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS case_progress_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    status TEXT,
    description TEXT,
    official_document_url TEXT,
    ai_interpretation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    content TEXT,
    related_id INTEGER,
    related_type TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ip_portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_trademarks INTEGER DEFAULT 0,
    total_patents INTEGER DEFAULT 0,
    total_copyrights INTEGER DEFAULT 0,
    estimated_value DECIMAL(15,2),
    risk_score INTEGER,
    last_evaluated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cross_border_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    target_countries TEXT,
    strategy_type TEXT,
    recommendation TEXT,
    estimated_cost DECIMAL(15,2),
    timeline TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

module.exports = db;
