import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','worker','employer','expert')),
      phone TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('nanny','cleaner','maternity')),
      avatar TEXT,
      phone TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('male','female')),
      experience_years INTEGER DEFAULT 0,
      native_place TEXT,
      education TEXT,
      skills TEXT,
      languages TEXT,
      certificates TEXT,
      health_report_url TEXT,
      health_report_expiry TEXT,
      lbs_fence TEXT,
      service_cities TEXT,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending_review' CHECK(status IN ('active','inactive','pending_review')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skill_certificates (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      certificate_type TEXT NOT NULL,
      certificate_number TEXT NOT NULL,
      issuing_authority TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      image_url TEXT NOT NULL,
      ocr_data TEXT,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      district TEXT,
      longitude REAL,
      latitude REAL,
      family_members INTEGER DEFAULT 1,
      special_requirements TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
      worker_id TEXT REFERENCES workers(id),
      mode TEXT NOT NULL CHECK(mode IN ('grab','dispatch')),
      service_type TEXT NOT NULL CHECK(service_type IN ('nanny','cleaner','maternity')),
      title TEXT NOT NULL,
      description TEXT,
      duration_hours INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      work_times TEXT,
      budget_min REAL NOT NULL,
      budget_max REAL NOT NULL,
      special_requirements TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','in_progress','completed','cancelled','disputed')),
      longitude REAL,
      latitude REAL,
      address TEXT,
      city TEXT,
      district TEXT,
      checkin_gps TEXT,
      checkin_face_verified INTEGER DEFAULT 0,
      checkin_time TEXT,
      checkout_time TEXT,
      actual_amount REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_nodes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      node_name TEXT NOT NULL,
      node_description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed')),
      completed_at TEXT,
      note TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS grab_order_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      grab_time TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
      UNIQUE(order_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS training_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      video_url TEXT,
      duration INTEGER DEFAULT 0,
      category TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('beginner','intermediate','advanced')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS training_quizzes (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS training_progress (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
      progress INTEGER DEFAULT 0,
      quiz_score INTEGER,
      completed INTEGER DEFAULT 0,
      certificate_url TEXT,
      certificate_hash TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(worker_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_role TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      is_private INTEGER DEFAULT 0,
      is_answered INTEGER DEFAULT 0,
      expert_id TEXT REFERENCES users(id),
      expert_answer TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_policies (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      order_id TEXT REFERENCES orders(id),
      policy_number TEXT NOT NULL,
      insurance_type TEXT NOT NULL,
      coverage_amount REAL NOT NULL,
      premium REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispute_tickets (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reporter_type TEXT NOT NULL CHECK(reporter_type IN ('worker','employer')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved','closed')),
      resolution TEXT,
      handler_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_records (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      bank_card TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','paid','failed')),
      transaction_id TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_grids (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      worker_capacity INTEGER DEFAULT 0,
      current_workers INTEGER DEFAULT 0,
      order_demand INTEGER DEFAULT 0,
      min_rating REAL DEFAULT 0,
      max_orders_per_day INTEGER DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(city, district)
    );

    CREATE TABLE IF NOT EXISTS conversion_funnels (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      city TEXT NOT NULL,
      worker_role TEXT NOT NULL,
      registered_workers INTEGER DEFAULT 0,
      certified_workers INTEGER DEFAULT 0,
      online_workers INTEGER DEFAULT 0,
      order_received INTEGER DEFAULT 0,
      order_accepted INTEGER DEFAULT 0,
      order_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, city, worker_role)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      employer_id TEXT NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      content TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_workers_role ON workers(role);
    CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
    CREATE INDEX IF NOT EXISTS idx_workers_rating ON workers(rating);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_mode ON orders(mode);
    CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
    CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);
    CREATE INDEX IF NOT EXISTS idx_training_progress_worker ON training_progress(worker_id);
    CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts(tags);
  `);

  console.log('Database initialized successfully');
  return db;
}

export default db;
