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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      avatar TEXT,
      real_name TEXT,
      id_card TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      agency_name TEXT,
      license_number TEXT UNIQUE,
      experience_years INTEGER DEFAULT 0,
      specialty TEXT,
      introduction TEXT,
      total_deals INTEGER DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      average_rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      credit_score INTEGER DEFAULT 100,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      price_unit TEXT DEFAULT 'wan',
      area REAL NOT NULL,
      bedrooms INTEGER,
      bathrooms INTEGER,
      floor TEXT,
      total_floors INTEGER,
      orientation TEXT,
      decoration TEXT,
      building_type TEXT,
      building_age INTEGER,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      community TEXT,
      latitude REAL,
      longitude REAL,
      metro_station TEXT,
      metro_distance INTEGER,
      school_district TEXT,
      school_rating INTEGER,
      description TEXT,
      features TEXT,
      images TEXT,
      vr_url TEXT,
      owner_id INTEGER NOT NULL,
      agent_id INTEGER,
      publish_type TEXT NOT NULL,
      verify_status TEXT DEFAULT 'pending',
      is_fake INTEGER DEFAULT 0,
      fake_reason TEXT,
      status TEXT DEFAULT 'active',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS price_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      price REAL NOT NULL,
      record_type TEXT NOT NULL,
      record_date DATE NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS community_price_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      avg_price REAL NOT NULL,
      deal_count INTEGER DEFAULT 0,
      listing_count INTEGER DEFAULT 0,
      price_trend REAL DEFAULT 0,
      valuation_deviation REAL DEFAULT 0,
      stat_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS property_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER UNIQUE NOT NULL,
      certificate_ocr_result TEXT,
      certificate_number TEXT,
      certificate_verified INTEGER DEFAULT 0,
      image_duplicate_check INTEGER DEFAULT 0,
      duplicate_images TEXT,
      price_anomaly_check INTEGER DEFAULT 0,
      anomaly_reason TEXT,
      final_verdict TEXT,
      verifier_id INTEGER,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (verifier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS viewing_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      audio_url TEXT,
      audio_text TEXT,
      has_watermark INTEGER DEFAULT 0,
      rating INTEGER,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS mortgage_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      property_id INTEGER,
      total_price REAL NOT NULL,
      down_payment REAL NOT NULL,
      loan_amount REAL NOT NULL,
      loan_type TEXT NOT NULL,
      loan_term INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      lpr_rate REAL,
      lpr_add_points REAL,
      monthly_payment REAL,
      total_interest REAL,
      total_payment REAL,
      prepayment_simulation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS decoration_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      style TEXT NOT NULL,
      budget_min REAL NOT NULL,
      budget_max REAL NOT NULL,
      area_min REAL NOT NULL,
      area_max REAL NOT NULL,
      bedrooms TEXT,
      city TEXT,
      company_name TEXT NOT NULL,
      company_rating REAL DEFAULT 0,
      description TEXT,
      images TEXT,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      review_comment TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS property_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      inspector_id INTEGER,
      quality_score INTEGER,
      issues TEXT,
      suggestions TEXT,
      status TEXT DEFAULT 'pending',
      inspected_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (inspector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agent_risk_controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS region_heatmaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      district TEXT,
      region_name TEXT NOT NULL,
      heat_score REAL NOT NULL,
      view_count INTEGER DEFAULT 0,
      inquiry_count INTEGER DEFAULT 0,
      deal_count INTEGER DEFAULT 0,
      avg_price REAL,
      stat_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      property_id INTEGER,
      rating INTEGER NOT NULL,
      content TEXT,
      service_type TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      agent_id INTEGER,
      message TEXT,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password, role, real_name)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAdmin.run('admin', 'admin@realestate.com', '$2a$10$rWQxPBt5K5aXzqCw7v8u9t0s1r2q3w4e5r6t7y8u9i0o1p2a3s4d5f6g7h', 'admin', '系统管理员');

  console.log('Database initialized successfully');
};

initDatabase();

export default db;
