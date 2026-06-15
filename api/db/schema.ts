import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      bio TEXT,
      follower_count INTEGER NOT NULL DEFAULT 0,
      following_count INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      verified INTEGER NOT NULL DEFAULT 0,
      location TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      subscription_price REAL,
      is_subscription INTEGER NOT NULL DEFAULT 0,
      student_count INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      video_url TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_free INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS user_courses (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      purchase_type TEXT NOT NULL DEFAULT 'one_time',
      expires_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      creator_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      deposit REAL NOT NULL DEFAULT 0,
      location TEXT,
      service_time DATETIME,
      duration INTEGER NOT NULL DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'published',
      insurance_policy TEXT,
      requirements TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS service_traces (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      operator_id TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES service_orders(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      course_id TEXT,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES service_orders(id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      course_id TEXT,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      platform_fee REAL NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS review_records (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      submitter_id TEXT NOT NULL,
      reviewer_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reason TEXT,
      auto_check_passed INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (submitter_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      frozen_balance REAL NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_courses_creator ON courses(creator_id);
    CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
    CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
    CREATE INDEX IF NOT EXISTS idx_service_orders_requester ON service_orders(requester_id);
    CREATE INDEX IF NOT EXISTS idx_service_orders_creator ON service_orders(creator_id);
    CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
    CREATE INDEX IF NOT EXISTS idx_service_orders_category ON service_orders(category);
    CREATE INDEX IF NOT EXISTS idx_service_traces_order ON service_traces(order_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_review_records_status ON review_records(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
  `);

  console.log('Database schema initialized successfully.');
}

export default initSchema;
