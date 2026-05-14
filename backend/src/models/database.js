const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    openid TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coupon_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    min_amount REAL DEFAULT 0,
    max_amount REAL,
    total_count INTEGER DEFAULT 0,
    remain_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    use_threshold REAL DEFAULT 0,
    valid_days INTEGER DEFAULT 30,
    start_time DATETIME,
    end_time DATETIME,
    source TEXT NOT NULL,
    shop_id TEXT,
    is_auto_select INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    type_id TEXT NOT NULL,
    user_id TEXT,
    code TEXT UNIQUE,
    amount REAL NOT NULL,
    min_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'unused',
    order_id TEXT,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    share_id TEXT,
    FOREIGN KEY (type_id) REFERENCES coupon_types(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type_id TEXT NOT NULL,
    share_url TEXT NOT NULL,
    share_mode TEXT DEFAULT 'chat',
    total_count INTEGER DEFAULT 0,
    receive_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (type_id) REFERENCES coupon_types(id)
  );

  -- 添加 remain_count 列（兼容已有数据库）
  PRAGMA table_info(shares);

  CREATE TABLE IF NOT EXISTS share_records (
    id TEXT PRIMARY KEY,
    share_id TEXT NOT NULL,
    receiver_id TEXT,
    receiver_openid TEXT,
    coupon_id TEXT,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (share_id) REFERENCES shares(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES shops(id)
  );

  CREATE TABLE IF NOT EXISTS coupon_logs (
    id TEXT PRIMARY KEY,
    coupon_id TEXT,
    action TEXT NOT NULL,
    user_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS statistics (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    share_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    receive_count INTEGER DEFAULT 0,
    new_user_count INTEGER DEFAULT 0,
    return_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    activate_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 为现有数据库添加 UNIQUE 约束（如果不存在）
  PRAGMA table_info(statistics);

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    coupon_type_id TEXT,
    start_time DATETIME,
    end_time DATETIME,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_type_id) REFERENCES coupon_types(id)
  );

  CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);
  CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
  CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_id);
  CREATE INDEX IF NOT EXISTS idx_share_records_share ON share_records(share_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
`);

const seedData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    db.prepare(`INSERT INTO users (id, username, password, phone) VALUES (?, ?, ?, ?)`).run(
      uuidv4(), 'admin', hashedPassword, '13800138000'
    );
    db.prepare(`INSERT INTO users (id, username, password, phone) VALUES (?, ?, ?, ?)`).run(
      uuidv4(), 'testuser', bcrypt.hashSync('test123', 10), '13900139000'
    );

    const shopId1 = uuidv4();
    const shopId2 = uuidv4();
    db.prepare(`INSERT INTO shops (id, name, description, address) VALUES (?, ?, ?, ?)`).run(
      shopId1, '北京烤鸭店', '正宗北京烤鸭，百年老店', '北京市朝阳区建国路88号'
    );
    db.prepare(`INSERT INTO shops (id, name, description, address) VALUES (?, ?, ?, ?)`).run(
      shopId2, '川菜馆', '麻辣鲜香，川味正宗', '上海市浦东新区世纪大道100号'
    );

    const type1 = uuidv4();
    const type2 = uuidv4();
    const type3 = uuidv4();

    db.prepare(`INSERT INTO coupon_types (id, name, type, amount, min_amount, max_amount, total_count, remain_count, source, shop_id, is_auto_select) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      type1, '新人专享红包', 'random', 20, 50, null, 1000, 800, 'new_user', null, 1
    );
    db.prepare(`INSERT INTO coupon_types (id, name, type, amount, min_amount, max_amount, total_count, remain_count, source, shop_id, is_auto_select) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      type2, '进店领券', 'fixed', 10, 30, null, 500, 300, 'shop', shopId1, 0
    );
    db.prepare(`INSERT INTO coupon_types (id, name, type, amount, min_amount, max_amount, total_count, remain_count, source, shop_id, is_auto_select) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      type3, '分享大红包', 'random', 15, 100, null, 200, 150, 'share', shopId2, 1
    );

    console.log('Database seeded successfully');
  }
};

seedData();

module.exports = db;
