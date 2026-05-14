require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    nickname TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'bar_owner', 'operator', 'admin')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'blocked')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    description TEXT,
    cover_image TEXT,
    price REAL,
    product_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_bars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    product_id INTEGER,
    creator_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('draft', 'pending', 'active', 'rejected', 'closed')),
    view_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bar_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bar_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('member', 'moderator', 'owner')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bar_id, user_id),
    FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS content_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bar_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    content_type TEXT DEFAULT 'forum' CHECK(content_type IN ('news', 'forum', 'blog', 'qa')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bar_id INTEGER NOT NULL,
    column_id INTEGER,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'forum' CHECK(content_type IN ('news', 'forum', 'blog', 'qa')),
    source TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('draft', 'pending', 'published', 'rejected', 'removed')),
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_recommended INTEGER DEFAULT 0,
    is_top INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES content_columns(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'published' CHECK(status IN ('published', 'removed')),
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL CHECK(target_type IN ('bar', 'post', 'comment')),
    target_id INTEGER NOT NULL,
    submitter_id INTEGER NOT NULL,
    reviewer_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    review_type TEXT NOT NULL CHECK(review_type IN ('creation', 'update', 'report')),
    reason TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (submitter_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('bar', 'post', 'comment', 'user')),
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reason_category TEXT CHECK(reason_category IN ('ad', 'porn', 'political', 'violence', 'fraud', 'other')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'ignored')),
    handler_id INTEGER,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    handled_at DATETIME,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blacklist_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL,
    category TEXT CHECK(category IN ('ad', 'porn', 'political', 'violence', 'sensitive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bar_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bar_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    relation_type TEXT DEFAULT 'recommend' CHECK(relation_type IN ('main', 'related', 'recommend')),
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bar_id, product_id),
    FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    bar_id INTEGER,
    new_bars INTEGER DEFAULT 0,
    new_posts INTEGER DEFAULT 0,
    new_comments INTEGER DEFAULT 0,
    new_members INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_reports INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date, bar_id)
  );

  CREATE INDEX IF NOT EXISTS idx_product_bars_status ON product_bars(status);
  CREATE INDEX IF NOT EXISTS idx_product_bars_owner ON product_bars(owner_id);
  CREATE INDEX IF NOT EXISTS idx_posts_bar ON posts(bar_id);
  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
`);

const bcrypt = require('bcryptjs');

const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password, email, nickname, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin', hashedPassword, 'admin@productbar.com', '系统管理员', 'admin', 'active');

  db.prepare(`
    INSERT INTO users (username, password, email, nickname, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('operator', hashedPassword, 'operator@productbar.com', '运营审核员', 'operator', 'active');

  db.prepare(`
    INSERT INTO users (username, password, email, nickname, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('seller', hashedPassword, 'seller@productbar.com', '测试卖家', 'bar_owner', 'active');

  db.prepare(`
    INSERT INTO users (username, password, email, nickname, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('buyer', hashedPassword, 'buyer@productbar.com', '测试买家', 'user', 'active');

  console.log('初始用户已创建:');
  console.log('管理员: admin / admin123');
  console.log('运营员: operator / admin123');
  console.log('卖家: seller / admin123');
  console.log('买家: buyer / admin123');
}

const sampleProducts = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (sampleProducts.count === 0) {
  const productStmt = db.prepare(`
    INSERT INTO products (name, category, brand, description, cover_image, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  productStmt.run(
    'iPhone 15 Pro Max',
    '手机数码',
    'Apple',
    '苹果最新旗舰手机，搭载A17 Pro芯片',
    'https://img.alicdn.com/imgextra/i3/O1CN01mX0a8a1xXkZ3Z3Z3Z_!!6000000006432-2-tps-500-500.png',
    9999.00
  );
  productStmt.run(
    '戴森V15吸尘器',
    '家用电器',
    'Dyson',
    '激光检测灰尘的智能吸尘器',
    'https://img.alicdn.com/imgextra/i3/O1CN01mX0a8a1xXkZ3Z3Z3Z_!!6000000006432-2-tps-500-500.png',
    4999.00
  );
  productStmt.run(
    '索尼WH-1000XM5',
    '手机数码',
    'Sony',
    '顶级主动降噪耳机',
    'https://img.alicdn.com/imgextra/i3/O1CN01mX0a8a1xXkZ3Z3Z3Z_!!6000000006432-2-tps-500-500.png',
    2999.00
  );
  console.log('示例商品已创建');
}

const blacklistExists = db.prepare('SELECT COUNT(*) as count FROM blacklist_words').get();
if (blacklistExists.count === 0) {
  const blStmt = db.prepare('INSERT INTO blacklist_words (word, category) VALUES (?, ?)');
  blStmt.run('赌博', 'ad');
  blStmt.run('色情', 'porn');
  blStmt.run('办证', 'ad');
  blStmt.run('代开发票', 'ad');
  console.log('初始黑名单词已创建');
}

console.log('数据库初始化完成！');
db.close();
