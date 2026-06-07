const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    phone TEXT,
    avatar TEXT,
    real_name TEXT,
    id_card TEXT,
    is_verified INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0,
    rating_count INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    service_radius INTEGER DEFAULT 10,
    portfolio_count INTEGER DEFAULT 0,
    location TEXT,
    latitude REAL,
    longitude REAL,
    balance REAL DEFAULT 0,
    frozen_balance REAL DEFAULT 0,
    credit_score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS skill_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS provider_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_tag_id INTEGER NOT NULL,
    proficiency_level INTEGER DEFAULT 1,
    years_experience INTEGER DEFAULT 0,
    hourly_rate REAL DEFAULT 0,
    is_certified INTEGER DEFAULT 0,
    cert_file TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_tag_id) REFERENCES skill_tags(id),
    UNIQUE(user_id, skill_tag_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    images TEXT,
    videos TEXT,
    skill_tag_id INTEGER,
    client_name TEXT,
    completion_date DATE,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS service_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    skill_tags TEXT,
    budget_type TEXT DEFAULT 'fixed',
    budget_min REAL,
    budget_max REAL,
    budget_fixed REAL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    service_date DATETIME,
    service_duration INTEGER,
    delivery_deadline DATETIME,
    deliverables TEXT,
    status TEXT DEFAULT 'open',
    matched_provider_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (matched_provider_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    match_score REAL NOT NULL,
    skill_match REAL,
    distance_match REAL,
    rating_match REAL,
    response_match REAL,
    status TEXT DEFAULT 'pending',
    provider_accepted INTEGER DEFAULT 0,
    client_accepted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requirement_id) REFERENCES service_requirements(id),
    FOREIGN KEY (provider_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    total_amount REAL NOT NULL,
    deposit_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending_confirm',
    service_address TEXT,
    service_date DATETIME,
    checkin_time DATETIME,
    checkout_time DATETIME,
    delivery_files TEXT,
    delivery_note TEXT,
    client_accepted INTEGER DEFAULT 0,
    provider_delivered INTEGER DEFAULT 0,
    dispute_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requirement_id) REFERENCES service_requirements(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT,
    images TEXT,
    is_anonymous INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    complainant_id INTEGER NOT NULL,
    respondent_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    status TEXT DEFAULT 'pending',
    handler_id INTEGER,
    result TEXT,
    frozen_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (complainant_id) REFERENCES users(id),
    FOREIGN KEY (respondent_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  )`);

  const categories = ['视频剪辑', '家居收纳', '陪诊服务', '家电维修', '家政保洁', '搬家服务', '宠物照料', '家教辅导', 'IT技术', '设计创意'];
  const skillsByCategory = {
    '视频剪辑': ['Pr剪辑', 'AE特效', '达芬奇调色', '字幕制作', '短视频剪辑', '电影级调色'],
    '家居收纳': ['衣柜收纳', '厨房整理', '空间规划', '儿童房收纳', '搬家打包', '极简整理'],
    '陪诊服务': ['医院挂号', '全程陪诊', '取药送药', '报告解读', '术后陪护', '老人陪诊'],
    '家电维修': ['空调维修', '洗衣机维修', '冰箱维修', '电视维修', '水电维修', '油烟机清洗'],
    '家政保洁': ['日常保洁', '深度清洁', '开荒保洁', '玻璃清洗', '地板打蜡', '沙发清洗'],
    '搬家服务': ['居民搬家', '公司搬迁', '长途搬家', '家具拆装', '钢琴搬运', '设备搬迁'],
    '宠物照料': ['宠物寄养', '遛狗服务', '猫咪喂养', '宠物美容', '宠物训练', '宠物医疗陪护'],
    '家教辅导': ['小学辅导', '初中辅导', '高中辅导', '英语外教', '乐器教学', '编程启蒙'],
    'IT技术': ['网站开发', '小程序开发', 'APP开发', '系统运维', '网络安全', '数据恢复'],
    '设计创意': ['平面设计', 'UI设计', 'Logo设计', '插画绘制', '3D建模', '品牌设计']
  };

  let skillOrder = 1;
  const skillStmt = db.prepare('INSERT OR IGNORE INTO skill_tags (name, category, sort_order) VALUES (?, ?, ?)');
  
  categories.forEach((category, catIndex) => {
    const skills = skillsByCategory[category] || [];
    skills.forEach(skill => {
      skillStmt.run(skill, category, skillOrder++);
    });
  });
  skillStmt.finalize();

  console.log('数据库初始化完成');
});

module.exports = db;
