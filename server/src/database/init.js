const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'couple',
      phone TEXT,
      email TEXT,
      avatar TEXT,
      real_name TEXT,
      city TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      address TEXT,
      city TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      business_license TEXT,
      deposit_amount REAL DEFAULT 0,
      deposit_status INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      images TEXT,
      tags TEXT,
      city TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      service_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      images TEXT,
      videos TEXT,
      date TEXT,
      budget REAL,
      city TEXT,
      like_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS marketing_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      activity_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      city TEXT NOT NULL,
      discount REAL,
      gift TEXT,
      cover_image TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS couple_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      wedding_date TEXT,
      budget REAL,
      city TEXT,
      guest_count INTEGER,
      style_preference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wedding_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      due_date TEXT,
      priority INTEGER DEFAULT 2,
      status INTEGER DEFAULT 0,
      days_before_wedding INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (couple_id) REFERENCES couple_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      planned_amount REAL NOT NULL,
      actual_amount REAL DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (couple_id) REFERENCES couple_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      service_id INTEGER,
      order_id INTEGER,
      rating INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      videos TEXT,
      verified INTEGER DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      status INTEGER DEFAULT 0,
      booking_date TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS city_managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      city TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      performance_score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deposit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      remark TEXT,
      order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );
  `);

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, real_name, city) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('admin', hashedPassword, 'admin', '系统管理员', '全国');
  insertUser.run('couple1', hashedPassword, 'couple', '张先生', '上海');
  insertUser.run('merchant1', hashedPassword, 'merchant', '李经理', '上海');
  insertUser.run('manager1', hashedPassword, 'manager', '王站长', '上海');

  const merchantStmt = db.prepare('INSERT OR IGNORE INTO merchants (user_id, company_name, category, description, city, contact_name, contact_phone, deposit_amount, deposit_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  merchantStmt.run(3, '上海甜蜜婚纱摄影', 'photography', '专业婚纱摄影15年，服务超过5000对新人', '上海', '李经理', '13800138001', 50000, 1, 1);

  const serviceStmt = db.prepare('INSERT OR IGNORE INTO services (merchant_id, category, name, description, price, original_price, images, city, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  serviceStmt.run(1, 'photography', '经典婚纱套餐', '包含5套服装、3个场景、精修50张、底片全送', 6999, 8999, JSON.stringify(['/images/sample1.jpg', '/images/sample2.jpg']), '上海', JSON.stringify(['海景', '森系', '复古']));
  serviceStmt.run(1, 'photography', '奢华海景套餐', '包含8套服装、5个场景、精修80张、赠送航拍', 12999, 15999, JSON.stringify(['/images/sample3.jpg', '/images/sample4.jpg']), '上海', JSON.stringify(['海景', '奢华', '航拍']));

  const caseStmt = db.prepare('INSERT OR IGNORE INTO cases (merchant_id, service_id, title, description, cover_image, images, date, budget, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  caseStmt.run(1, 1, '爱在上海外滩', '上海外滩夜景拍摄，浪漫复古风', '/images/case1.jpg', JSON.stringify(['/images/case1_1.jpg', '/images/case1_2.jpg']), '2024-05-20', 6999, '上海');
  caseStmt.run(1, 2, '海岛婚礼日记', '三亚海岛婚纱照，阳光沙滩海浪', '/images/case2.jpg', JSON.stringify(['/images/case2_1.jpg', '/images/case2_2.jpg']), '2024-06-15', 12999, '上海');

  const activityStmt = db.prepare('INSERT OR IGNORE INTO marketing_activities (merchant_id, title, description, activity_type, start_date, end_date, city, discount, gift, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  activityStmt.run(1, '双十一狂欢季', '全场8折，再送价值2000元大礼包', 'discount', '2024-11-01', '2024-11-30', '上海', 0.8, '价值2000元婚庆大礼包', '/images/activity1.jpg');

  const knowledgeStmt = db.prepare('INSERT OR IGNORE INTO knowledge_graph (title, content, category, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)');
  knowledgeStmt.run('婚礼筹备流程', '婚礼筹备完整时间线和注意事项', 'process', 0, 1);
  knowledgeStmt.run('婚礼前12个月', '确定婚期、预订酒店、挑选婚纱摄影', 'process', 1, 1);
  knowledgeStmt.run('婚礼前6个月', '确定婚庆公司、选购婚纱礼服、拍摄婚纱照', 'process', 1, 2);
  knowledgeStmt.run('婚礼前3个月', '确定伴郎伴娘、预订蜜月、发送请柬', 'process', 1, 3);
  knowledgeStmt.run('婚礼前1个月', '试妆试菜、确认流程、购买保险', 'process', 1, 4);
  knowledgeStmt.run('婚礼前1周', '婚前检查、物品准备、仪式彩排', 'process', 1, 5);
  knowledgeStmt.run('婚礼当天', '迎亲、仪式、婚宴、闹洞房', 'process', 1, 6);

  const managerStmt = db.prepare('INSERT OR IGNORE INTO city_managers (user_id, city, level, performance_score) VALUES (?, ?, ?, ?)');
  managerStmt.run(4, '上海', 2, 95.5);

  const reviewStmt = db.prepare('INSERT OR IGNORE INTO reviews (user_id, merchant_id, service_id, rating, content, verified) VALUES (?, ?, ?, ?, ?, ?)');
  reviewStmt.run(2, 1, 1, 5, '非常满意的拍摄体验，摄影师很专业，成片效果超出预期！强烈推荐！', 1);

  const coupleStmt = db.prepare('INSERT OR IGNORE INTO couple_profiles (user_id, wedding_date, budget, city, guest_count, style_preference) VALUES (?, ?, ?, ?, ?, ?)');
  coupleStmt.run(2, '2025-10-01', 200000, '上海', 200, '简约浪漫');

  console.log('Database initialized successfully!');
  console.log('Default accounts:');
  console.log('  Admin: admin / 123456');
  console.log('  Couple: couple1 / 123456');
  console.log('  Merchant: merchant1 / 123456');
  console.log('  Manager: manager1 / 123456');
};

try {
  init();
} catch (err) {
  console.error('Database initialization failed:', err);
  process.exit(1);
} finally {
  db.close();
}
