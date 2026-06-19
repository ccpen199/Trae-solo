import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'app.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card VARCHAR(18) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(11) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'worker',
      member_status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS union_organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      parent_id INTEGER REFERENCES union_organizations(id),
      member_count INTEGER DEFAULT 0,
      total_employees INTEGER DEFAULT 0,
      coverage_rate DECIMAL(5,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS membership_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      union_id INTEGER REFERENCES union_organizations(id),
      status VARCHAR(30) DEFAULT 'draft',
      police_verified BOOLEAN DEFAULT FALSE,
      social_verified BOOLEAN DEFAULT FALSE,
      social_security_months INTEGER DEFAULT 0,
      current_step INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lawyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      license_number VARCHAR(50) UNIQUE NOT NULL,
      specialty VARCHAR(200) NOT NULL,
      experience_years INTEGER DEFAULT 0,
      case_count INTEGER DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 5.0,
      verified BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS legal_aid_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      lawyer_id INTEGER REFERENCES lawyers(id),
      case_type VARCHAR(20) NOT NULL,
      case_title VARCHAR(200) NOT NULL,
      case_description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assistance_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      assistance_type VARCHAR(30) NOT NULL,
      family_income DECIMAL(10,2) NOT NULL,
      family_member_count INTEGER NOT NULL,
      description TEXT,
      status VARCHAR(30) DEFAULT 'draft',
      auto_review_passed BOOLEAN,
      auto_review_score INTEGER,
      fund_amount DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fund_flows (
      id VARCHAR(32) PRIMARY KEY,
      application_id INTEGER REFERENCES assistance_applications(id),
      from_org VARCHAR(100) NOT NULL,
      to_org VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      purpose VARCHAR(200),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fund_id VARCHAR(32) REFERENCES fund_flows(id),
      action VARCHAR(50) NOT NULL,
      operator VARCHAR(50) NOT NULL,
      operator_role VARCHAR(20) NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL,
      cover_image VARCHAR(255),
      total_hours INTEGER NOT NULL,
      skill_level VARCHAR(20) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      chapter_id INTEGER NOT NULL,
      study_seconds INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id, chapter_id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      certificate_number VARCHAR(50) UNIQUE NOT NULL,
      total_hours INTEGER NOT NULL,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dating_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) UNIQUE,
      age INTEGER,
      city VARCHAR(50),
      occupation VARCHAR(50),
      height INTEGER,
      tags TEXT,
      hobbies TEXT,
      privacy_mode BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS psychology_sessions (
      id VARCHAR(32) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      risk_level VARCHAR(10) DEFAULT 'low',
      crisis_detected BOOLEAN DEFAULT FALSE,
      transferred_to_human BOOLEAN DEFAULT FALSE,
      human_counselor_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id VARCHAR(32) REFERENCES psychology_sessions(id),
      sender_type VARCHAR(10) NOT NULL,
      content TEXT NOT NULL,
      emotion VARCHAR(20),
      emotion_score DECIMAL(5,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      contact_person VARCHAR(50),
      phone VARCHAR(20),
      address VARCHAR(255),
      base_location VARCHAR(100),
      verified BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      image VARCHAR(255),
      category VARCHAR(50) NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id),
      supply_base VARCHAR(100),
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      tracking_number VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(20) NOT NULL,
      sentiment VARCHAR(20),
      sentiment_score DECIMAL(5,2),
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_id_card ON users(id_card);
    CREATE INDEX IF NOT EXISTS idx_union_parent ON union_organizations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_membership_user ON membership_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_legal_aid_user ON legal_aid_cases(user_id);
    CREATE INDEX IF NOT EXISTS idx_assistance_user ON assistance_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_fund_application ON fund_flows(application_id);
    CREATE INDEX IF NOT EXISTS idx_study_user_course ON study_progress(user_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_appeals_created ON appeals(created_at DESC);
  `);
};

createTables();

export default db;
