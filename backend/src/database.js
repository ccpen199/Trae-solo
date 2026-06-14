const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      role TEXT DEFAULT 'user',
      real_name TEXT,
      id_card TEXT,
      is_verified INTEGER DEFAULT 0,
      avatar TEXT,
      credit_score INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.prepare('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"').run();
  } catch (e) {
  }
  try {
    db.prepare('ALTER TABLE users ADD COLUMN real_name TEXT').run();
  } catch (e) {
  }
  try {
    db.prepare('ALTER TABLE users ADD COLUMN id_card TEXT').run();
  } catch (e) {
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cert_type TEXT NOT NULL,
      cert_number TEXT,
      cert_name TEXT,
      issuer TEXT,
      issue_date DATE,
      expiry_date DATE,
      verified_status INTEGER DEFAULT 0,
      ocr_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      parent_id INTEGER,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2),
      price_unit TEXT,
      city TEXT,
      district TEXT,
      address TEXT,
      contact_phone TEXT,
      contact_name TEXT,
      status INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expired_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS listing_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS listing_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      deposit_amount DECIMAL(10,2),
      status TEXT DEFAULT 'pending',
      buyer_confirmed INTEGER DEFAULT 0,
      seller_confirmed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deposit_frozen_at DATETIME,
      service_confirmed_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (listing_id) REFERENCES listings(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER,
      reporter_id INTEGER,
      reason TEXT,
      description TEXT,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      handled_at DATETIME,
      handler_id INTEGER,
      FOREIGN KEY (listing_id) REFERENCES listings(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );
  `);

  const categories = [
    { name: '招聘求职', code: 'job', icon: '💼' },
    { name: '房屋租售', code: 'house', icon: '🏠' },
    { name: '二手车', code: 'car', icon: '🚗' },
    { name: '二手物品', code: 'secondhand', icon: '🔄' },
    { name: '家政服务', code: 'housekeeping', icon: '🧹' },
    { name: '维修服务', code: 'repair', icon: '🔧' },
    { name: '搬家运输', code: 'moving', icon: '🚚' },
    { name: '教育培训', code: 'education', icon: '📚' },
    { name: '丽人健身', code: 'beauty', icon: '💄' },
    { name: '宠物服务', code: 'pet', icon: '🐾' },
    { name: '本地美食', code: 'food', icon: '🍜' },
    { name: '其他服务', code: 'other', icon: '📌' }
  ];

  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, code, icon, sort_order) VALUES (?, ?, ?, ?)');
  categories.forEach((cat, idx) => {
    insertCat.run(cat.name, cat.code, cat.icon, idx);
  });

  console.log('数据库初始化完成');
};

module.exports = { db, initDatabase };
