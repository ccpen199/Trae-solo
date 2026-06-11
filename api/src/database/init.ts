import db from './connection.js';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role VARCHAR(20) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      avatar VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES users(id),
      building VARCHAR(20) NOT NULL,
      unit VARCHAR(20) NOT NULL,
      room_number VARCHAR(20) NOT NULL,
      area DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      house_id INTEGER REFERENCES houses(id),
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      location VARCHAR(200),
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(20) DEFAULT 'pending',
      assignee_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_order_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER REFERENCES work_orders(id),
      operator_id INTEGER REFERENCES users(id),
      status VARCHAR(20) NOT NULL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS work_order_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER UNIQUE REFERENCES work_orders(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitor_passes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER REFERENCES users(id),
      visitor_name VARCHAR(100) NOT NULL,
      visitor_phone VARCHAR(20) NOT NULL,
      visitor_id_card VARCHAR(20),
      qr_code VARCHAR(500) UNIQUE NOT NULL,
      access_areas TEXT,
      valid_from DATETIME NOT NULL,
      valid_to DATETIME NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      location VARCHAR(200) NOT NULL,
      status VARCHAR(20) DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pass_id INTEGER REFERENCES visitor_passes(id),
      device_id INTEGER REFERENCES access_devices(id),
      access_type VARCHAR(20) NOT NULL,
      access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      result VARCHAR(20) NOT NULL,
      person_name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(200) NOT NULL,
      license_no VARCHAR(100),
      description TEXT,
      logo_url VARCHAR(500),
      status VARCHAR(20) DEFAULT 'pending',
      rating DECIMAL(3,2) DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER REFERENCES merchants(id),
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INTEGER DEFAULT 0,
      image_url VARCHAR(500),
      category VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER REFERENCES merchants(id),
      name VARCHAR(200) NOT NULL,
      discount_type VARCHAR(20) NOT NULL,
      discount_value DECIMAL(10,2) NOT NULL,
      min_amount DECIMAL(10,2) DEFAULT 0,
      total_quantity INTEGER DEFAULT 0,
      used_quantity INTEGER DEFAULT 0,
      valid_from DATETIME NOT NULL,
      valid_to DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      merchant_id INTEGER REFERENCES merchants(id),
      coupon_id INTEGER REFERENCES coupons(id),
      total_amount DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      pay_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      member_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      circle_id INTEGER REFERENCES circles(id),
      title VARCHAR(200) NOT NULL,
      content TEXT,
      type VARCHAR(20) DEFAULT 'normal',
      images TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id),
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      location VARCHAR(200),
      max_participants INTEGER,
      participant_count INTEGER DEFAULT 0,
      organizer_id INTEGER REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER REFERENCES activities(id),
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(activity_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(50) NOT NULL,
      level VARCHAR(20) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      location VARCHAR(200),
      image_url VARCHAR(500),
      status VARCHAR(20) DEFAULT 'pending',
      handler_id INTEGER REFERENCES users(id),
      occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      handled_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      level INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      balance DECIMAL(10,2) DEFAULT 0,
      total_spent DECIMAL(10,2) DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_work_orders_user_id ON work_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_visitor_passes_qr_code ON visitor_passes(qr_code);
    CREATE INDEX IF NOT EXISTS idx_visitor_passes_status ON visitor_passes(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
  `);

  console.log('Database initialized successfully');
}

if (process.argv[1]?.includes('init.ts')) {
  initDatabase();
}

export default initDatabase;
