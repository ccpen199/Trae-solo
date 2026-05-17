const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: '../../.env' });

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '../../../', dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lawyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT,
      specialty TEXT,
      location TEXT,
      experience_years INTEGER DEFAULT 0,
      description TEXT,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      quick_consult_price REAL DEFAULT 49.9,
      text_consult_price REAL DEFAULT 99.9,
      offline_price REAL DEFAULT 299.9,
      document_price REAL DEFAULT 199.9,
      is_online INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS question_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      base_price REAL DEFAULT 49.9,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER,
      type TEXT NOT NULL,
      question_type_id INTEGER,
      status TEXT DEFAULT 'pending',
      amount REAL NOT NULL,
      description TEXT,
      images TEXT,
      is_free INTEGER DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
      FOREIGN KEY (question_type_id) REFERENCES question_types(id)
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      last_message_at DATETIME,
      expire_at DATETIME,
      recording_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      complaint TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    );

    CREATE TABLE IF NOT EXISTS daily_laws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date DATE UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const questionTypes = [
    { name: '婚姻家庭', icon: '🏠', base_price: 49.9 },
    { name: '劳动纠纷', icon: '💼', base_price: 49.9 },
    { name: '交通事故', icon: '🚗', base_price: 59.9 },
    { name: '债权债务', icon: '💰', base_price: 59.9 },
    { name: '房产纠纷', icon: '🏢', base_price: 79.9 },
    { name: '刑事辩护', icon: '⚖️', base_price: 99.9 },
    { name: '合同纠纷', icon: '📝', base_price: 59.9 },
    { name: '知识产权', icon: '💡', base_price: 79.9 }
  ];

  const insertType = db.prepare('INSERT OR IGNORE INTO question_types (name, icon, base_price) VALUES (?, ?, ?)');
  questionTypes.forEach(type => {
    insertType.run(type.name, type.icon, type.base_price);
  });

  const sampleLawyers = [
    { name: '张明律师', specialty: '婚姻家庭', location: '北京', experience_years: 15, rating: 4.9, quick_consult_price: 59.9, text_consult_price: 129.9, offline_price: 399.9, document_price: 299.9 },
    { name: '李华律师', specialty: '劳动纠纷', location: '上海', experience_years: 10, rating: 4.8, quick_consult_price: 49.9, text_consult_price: 99.9, offline_price: 299.9, document_price: 199.9 },
    { name: '王芳律师', specialty: '交通事故', location: '广州', experience_years: 12, rating: 4.7, quick_consult_price: 69.9, text_consult_price: 149.9, offline_price: 499.9, document_price: 399.9 },
    { name: '陈强律师', specialty: '债权债务', location: '深圳', experience_years: 8, rating: 4.6, quick_consult_price: 59.9, text_consult_price: 119.9, offline_price: 349.9, document_price: 249.9 },
    { name: '刘洋律师', specialty: '房产纠纷', location: '杭州', experience_years: 18, rating: 4.9, quick_consult_price: 89.9, text_consult_price: 179.9, offline_price: 599.9, document_price: 499.9 }
  ];

  const insertLawyer = db.prepare(`
    INSERT OR IGNORE INTO lawyers (name, specialty, location, experience_years, rating, description, quick_consult_price, text_consult_price, offline_price, document_price, is_online)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  sampleLawyers.forEach(lawyer => {
    insertLawyer.run(
      lawyer.name, lawyer.specialty, lawyer.location, lawyer.experience_years,
      lawyer.rating, `${lawyer.specialty}专业律师，从业${lawyer.experience_years}年，经验丰富。`,
      lawyer.quick_consult_price, lawyer.text_consult_price, lawyer.offline_price, lawyer.document_price
    );
  });

  try {
    db.prepare('ALTER TABLE orders ADD COLUMN is_free INTEGER DEFAULT 0').run();
  } catch (e) {}
  
  try {
    db.prepare('ALTER TABLE consultations ADD COLUMN is_free INTEGER DEFAULT 0').run();
  } catch (e) {}

  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)').run('admin', adminPassword);

  console.log('数据库初始化完成');
};

module.exports = { db, initDatabase };
