const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      user_type TEXT DEFAULT 'c' CHECK(user_type IN ('c', 'b', 'admin')),
      is_verified INTEGER DEFAULT 0,
      real_name TEXT,
      id_card TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      business_license TEXT,
      license_image TEXT,
      level INTEGER DEFAULT 1,
      rating REAL DEFAULT 5.0,
      total_deals INTEGER DEFAULT 0,
      response_rate REAL DEFAULT 100.0,
      avg_response_time INTEGER DEFAULT 300,
      is_approved INTEGER DEFAULT 0,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      parent_id INTEGER DEFAULT 0,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      merchant_id INTEGER,
      category_id INTEGER NOT NULL,
      category_code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price_min REAL,
      price_max REAL,
      price_unit TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      city TEXT,
      district TEXT,
      images TEXT,
      videos TEXT,
      cert_files TEXT,
      area REAL,
      rooms INTEGER,
      bathrooms INTEGER,
      floor TEXT,
      car_brand TEXT,
      car_model TEXT,
      car_year INTEGER,
      car_mileage REAL,
      car_transmission TEXT,
      job_title TEXT,
      job_salary_min INTEGER,
      job_salary_max INTEGER,
      job_experience TEXT,
      job_education TEXT,
      service_type TEXT,
      service_hours TEXT,
      is_urgent INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'sold', 'deleted', 'rejected')),
      valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
      valid_to DATETIME,
      view_count INTEGER DEFAULT 0,
      contact_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS listing_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      merchant_id INTEGER,
      contact_info TEXT,
      message TEXT,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'converted', 'lost')),
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER,
      reporter_id INTEGER,
      report_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'rejected')),
      handler_id INTEGER,
      handled_at DATETIME,
      handle_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'processing', 'waiting', 'closed')),
      assignee_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fraud_detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      detection_type TEXT NOT NULL,
      score REAL NOT NULL,
      details TEXT,
      is_flagged INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS browse_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      view_duration INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, listing_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      listing_id INTEGER,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
    CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(city, district);
    CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_listing ON leads(listing_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  `);

  const categories = [
    { name: '招聘', code: 'job', icon: '💼' },
    { name: '租房', code: 'rent', icon: '🏠' },
    { name: '二手房', code: 'house', icon: '🏢' },
    { name: '二手车', code: 'car', icon: '🚗' },
    { name: '本地服务', code: 'service', icon: '🛠️' }
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, code, icon, sort_order) VALUES (?, ?, ?, ?)');
  categories.forEach((cat, idx) => {
    insertCategory.run(cat.name, cat.code, cat.icon, idx);
  });

  const subCategories = [
    { parent: 'job', name: '全职', code: 'job_fulltime' },
    { parent: 'job', name: '兼职', code: 'job_parttime' },
    { parent: 'job', name: '实习', code: 'job_intern' },
    { parent: 'rent', name: '整租', code: 'rent_whole' },
    { parent: 'rent', name: '合租', code: 'rent_shared' },
    { parent: 'rent', name: '公寓', code: 'rent_apartment' },
    { parent: 'house', name: '商品房', code: 'house_commodity' },
    { parent: 'house', name: '别墅', code: 'house_villa' },
    { parent: 'car', name: '轿车', code: 'car_sedan' },
    { parent: 'car', name: 'SUV', code: 'car_suv' },
    { parent: 'service', name: '代驾', code: 'service_driver' },
    { parent: 'service', name: '保洁', code: 'service_cleaning' },
    { parent: 'service', name: '搬家', code: 'service_moving' },
    { parent: 'service', name: '维修', code: 'service_repair' }
  ];

  const getParentId = db.prepare('SELECT id FROM categories WHERE code = ?');
  const insertSub = db.prepare('INSERT OR IGNORE INTO categories (name, code, parent_id, sort_order) VALUES (?, ?, ?, ?)');
  
  subCategories.forEach((sub, idx) => {
    const parent = getParentId.get(sub.parent);
    if (parent) {
      insertSub.run(sub.name, sub.code, parent.id, idx);
    }
  });

  const adminExists = db.prepare('SELECT id FROM users WHERE phone = ?').get('13800138000');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123456', 10);
    db.prepare('INSERT INTO users (phone, password, nickname, user_type, is_verified) VALUES (?, ?, ?, ?, ?)')
      .run('13800138000', hashedPassword, '管理员', 'admin', 1);
  }
};

initTables();

module.exports = db;
