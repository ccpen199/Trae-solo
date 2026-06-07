const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      real_name TEXT,
      id_card TEXT,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      preferences TEXT,
      price_sensitivity REAL DEFAULT 0.5,
      social_impact REAL DEFAULT 0.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      description TEXT,
      poster TEXT,
      venue TEXT,
      address TEXT,
      city TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      organizer TEXT,
      status TEXT DEFAULT 'upcoming',
      is_hot INTEGER DEFAULT 0,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS seat_maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      total_seats INTEGER DEFAULT 0,
      available_seats INTEGER DEFAULT 0,
      layout_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat_map_id INTEGER NOT NULL,
      row TEXT NOT NULL,
      seat_number TEXT NOT NULL,
      area TEXT,
      price_tier TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      lock_expires_at DATETIME,
      locked_by INTEGER,
      order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seat_map_id) REFERENCES seat_maps(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS price_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      base_price DECIMAL(10,2) NOT NULL,
      discount_value DECIMAL(5,2),
      discount_type TEXT,
      start_time DATETIME,
      end_time DATETIME,
      min_quantity INTEGER DEFAULT 1,
      max_quantity INTEGER,
      target_group TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      pay_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      paid_at DATETIME,
      refund_status TEXT DEFAULT 'none',
      refund_amount DECIMAL(10,2) DEFAULT 0,
      refunded_at DATETIME,
      contact_name TEXT,
      contact_phone TEXT,
      id_card TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      seat_id INTEGER NOT NULL,
      seat_info TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2) NOT NULL,
      strategy_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (seat_id) REFERENCES seats(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS etickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_no TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      order_item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      seat_info TEXT NOT NULL,
      qr_code TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      status TEXT DEFAULT 'unused',
      checked_at DATETIME,
      checked_gate TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      event_id INTEGER,
      start_time DATETIME,
      end_time DATETIME,
      rules TEXT,
      prizes TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'pgc',
      author TEXT,
      cover_image TEXT,
      tags TEXT,
      event_id INTEGER,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      like_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_behavior (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      behavior_type TEXT NOT NULL,
      target_id INTEGER,
      target_type TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      commission_rate DECIMAL(5,2) DEFAULT 10,
      settlement_cycle INTEGER DEFAULT 7,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      agent_id INTEGER,
      event_id INTEGER,
      order_count INTEGER DEFAULT 0,
      total_amount DECIMAL(10,2) DEFAULT 0,
      commission_amount DECIMAL(10,2) DEFAULT 0,
      settlement_amount DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'pending',
      settled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  });
}

module.exports = { db, initDatabase };
