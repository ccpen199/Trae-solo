const db = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  db.exec(`PRAGMA foreign_keys = ON`);

  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    avatar TEXT,
    bio TEXT,
    wechat_openid TEXT UNIQUE,
    weibo_openid TEXT UNIQUE,
    qq_openid TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT DEFAULT '#4CAF50',
    reminder_time TEXT,
    target_days INTEGER DEFAULT 21,
    current_days INTEGER DEFAULT 0,
    total_days INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS habit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    check_date DATE NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(habit_id, check_date)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS circles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    cover_image TEXT,
    owner_id INTEGER NOT NULL,
    member_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS circle_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    circle_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(circle_id, user_id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    circle_id INTEGER,
    content TEXT NOT NULL,
    images TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE SET NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_no TEXT UNIQUE NOT NULL,
    payer_id INTEGER,
    payee_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    type TEXT DEFAULT 'transfer',
    note TEXT,
    payment_method TEXT,
    arrived_at DATETIME,
    risk_level TEXT DEFAULT 'normal',
    risk_remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payer_id) REFERENCES users(id),
    FOREIGN KEY (payee_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS merchant_stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    store_description TEXT,
    qr_code TEXT,
    total_received DECIMAL(10,2) DEFAULT 0.00,
    today_received DECIMAL(10,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER UNIQUE NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  )`);

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('demo');
  
  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('123456', salt);
    
    const insertUser = db.prepare('INSERT INTO users (username, nickname, password, bio) VALUES (?, ?, ?, ?)');
    const result = insertUser.run('demo', '演示用户', hashedPassword, '这是一个演示账号，用于测试系统功能');
    const userId = result.lastInsertRowid;
    console.log('创建测试用户成功: demo / 123456');
    
    const habits = [
      { name: '早起', icon: '🌅', color: '#FF9800', reminder_time: '06:30' },
      { name: '阅读30分钟', icon: '📚', color: '#2196F3', reminder_time: '21:00' },
      { name: '运动健身', icon: '🏃', color: '#4CAF50', reminder_time: '18:00' },
      { name: '喝8杯水', icon: '💧', color: '#00BCD4', reminder_time: '09:00' }
    ];
    
    const insertHabit = db.prepare('INSERT INTO habits (user_id, name, icon, color, reminder_time, sort_order, current_days, total_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    habits.forEach((habit, index) => {
      insertHabit.run(userId, habit.name, habit.icon, habit.color, habit.reminder_time, index, Math.floor(Math.random() * 15) + 1, Math.floor(Math.random() * 30) + 10);
    });

    const insertMerchant = db.prepare('INSERT INTO merchant_stores (user_id, store_name, store_description, total_received, today_received) VALUES (?, ?, ?, ?, ?)');
    insertMerchant.run(userId, '演示商户', '用于演示收款功能的商户', 12580.50, 368.00);
  }

  console.log('数据库初始化完成！');
};

initDatabase();