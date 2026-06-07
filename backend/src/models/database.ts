import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/app.sqlite');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brokers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      avatar TEXT,
      certified INTEGER DEFAULT 0,
      certification_no TEXT,
      store_id INTEGER,
      rating REAL DEFAULT 5.0,
      deal_count INTEGER DEFAULT 0,
      experience_years INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lng REAL,
      phone TEXT,
      business_hours TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS estates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT,
      district TEXT,
      city TEXT DEFAULT '北京',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      developer TEXT,
      property_company TEXT,
      property_fee REAL,
      build_year INTEGER,
      total_households INTEGER,
      parking_count INTEGER,
      green_rate REAL,
      volume_rate REAL,
      average_price REAL,
      description TEXT,
      metro_lines TEXT,
      school_district TEXT,
      facilities TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estate_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      unit_price REAL NOT NULL,
      area REAL NOT NULL,
      bedrooms INTEGER DEFAULT 0,
      livingrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      floor TEXT,
      total_floors INTEGER,
      orientation TEXT,
      decoration TEXT,
      building_type TEXT,
      has_vr INTEGER DEFAULT 0,
      vr_url TEXT,
      floor_plan_url TEXT,
      images TEXT,
      hotspots TEXT,
      description TEXT,
      features TEXT,
      tags TEXT,
      broker_id INTEGER,
      status TEXT DEFAULT 'active',
      is_fake INTEGER DEFAULT 0,
      fake_score REAL DEFAULT 0,
      price_deviation REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (estate_id) REFERENCES estates(id),
      FOREIGN KEY (broker_id) REFERENCES brokers(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      price REAL NOT NULL,
      date DATE NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS pois (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      city TEXT DEFAULT '北京',
      properties TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS metro_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_name TEXT NOT NULL,
      line_number TEXT,
      color TEXT,
      stations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS school_districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      level TEXT,
      boundary TEXT,
      lat REAL,
      lng REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      broker_id INTEGER NOT NULL,
      property_id INTEGER,
      appointment_date DATE NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      type TEXT DEFAULT 'viewing',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (broker_id) REFERENCES brokers(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS viewings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      broker_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      viewing_date DATE NOT NULL,
      viewing_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      feedback TEXT,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (broker_id) REFERENCES brokers(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS customer_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      follow_date DATE NOT NULL,
      content TEXT NOT NULL,
      next_follow_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broker_id) REFERENCES brokers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      deal_amount REAL NOT NULL,
      commission_rate REAL DEFAULT 0.025,
      commission_amount REAL NOT NULL,
      deal_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broker_id) REFERENCES brokers(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS training_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration INTEGER,
      category TEXT,
      level TEXT DEFAULT 'beginner',
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS broker_training (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      start_date DATE,
      complete_date DATE,
      score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broker_id) REFERENCES brokers(id),
      FOREIGN KEY (course_id) REFERENCES training_courses(id)
    );

    CREATE TABLE IF NOT EXISTS user_browsing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      property_id INTEGER NOT NULL,
      view_duration INTEGER DEFAULT 0,
      action TEXT DEFAULT 'view',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    CREATE TABLE IF NOT EXISTS fake_detection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      image_similarity_score REAL,
      price_deviation_score REAL,
      total_score REAL,
      is_fake INTEGER,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checked_by TEXT DEFAULT 'system',
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE INDEX IF NOT EXISTS idx_estates_location ON estates(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_estates_type ON estates(type);
    CREATE INDEX IF NOT EXISTS idx_estates_district ON estates(district);
    CREATE INDEX IF NOT EXISTS idx_properties_estate ON properties(estate_id);
    CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
    CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
    CREATE INDEX IF NOT EXISTS idx_properties_broker ON properties(broker_id);
    CREATE INDEX IF NOT EXISTS idx_pois_location ON pois(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_pois_type ON pois(type);
    CREATE INDEX IF NOT EXISTS idx_appointments_broker ON appointments(broker_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
    CREATE INDEX IF NOT EXISTS idx_viewings_broker ON viewings(broker_id);
    CREATE INDEX IF NOT EXISTS idx_user_browsing_property ON user_browsing(property_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_property ON price_history(property_id);
  `);

  console.log('Database initialized successfully');
}
