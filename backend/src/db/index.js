const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

async function initDatabase() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      gender INTEGER DEFAULT 0,
      birthday TEXT,
      status INTEGER DEFAULT 1,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      business_hours TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      duration INTEGER DEFAULT 60,
      difficulty INTEGER DEFAULT 2,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_class_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      coach_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER DEFAULT 20,
      booked_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES group_classes(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS group_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      schedule_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (schedule_id) REFERENCES group_class_schedules(id),
      UNIQUE(user_id, schedule_id)
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      title TEXT,
      specialty TEXT,
      description TEXT,
      price REAL NOT NULL,
      rating REAL DEFAULT 5.0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coach_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_booked INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coach_id) REFERENCES coaches(id),
      UNIQUE(coach_id, date, start_time)
    );

    CREATE TABLE IF NOT EXISTS coach_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coach_id INTEGER NOT NULL,
      schedule_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (coach_id) REFERENCES coaches(id),
      FOREIGN KEY (schedule_id) REFERENCES coach_schedules(id)
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type INTEGER NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      value REAL NOT NULL,
      description TEXT,
      benefits TEXT,
      valid_days INTEGER DEFAULT 30,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      balance REAL NOT NULL,
      expire_time TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type INTEGER DEFAULT 1,
      value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      expire_time TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      type INTEGER NOT NULL,
      item_id INTEGER,
      amount REAL NOT NULL,
      pay_amount REAL NOT NULL,
      status INTEGER DEFAULT 0,
      pay_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const storeCount = await db.get('SELECT COUNT(*) as count FROM stores');
  if (storeCount.count === 0) {
    await db.run('INSERT INTO stores (name, address, phone, business_hours) VALUES (?, ?, ?, ?)', 
      'FITLIFE旗舰店', '北京市朝阳区健身路88号', '400-888-8888', '09:00-22:00');
    await db.run('INSERT INTO stores (name, address, phone, business_hours) VALUES (?, ?, ?, ?)', 
      'FITLIFE中关村店', '北京市海淀区中关村大街1号', '400-999-9999', '08:00-23:00');
  }

  const classCount = await db.get('SELECT COUNT(*) as count FROM group_classes');
  if (classCount.count === 0) {
    await db.run('INSERT INTO group_classes (name, description, cover_image, duration, difficulty) VALUES (?, ?, ?, ?, ?)',
      '瑜伽入门', '适合初学者的瑜伽课程，放松身心，提升柔韧性', '', 60, 1);
    await db.run('INSERT INTO group_classes (name, description, cover_image, duration, difficulty) VALUES (?, ?, ?, ?, ?)',
      '动感单车', '高强度有氧训练，燃烧脂肪', '', 45, 3);
    await db.run('INSERT INTO group_classes (name, description, cover_image, duration, difficulty) VALUES (?, ?, ?, ?, ?)',
      '力量训练', '专业器械训练，塑造完美身材', '', 60, 3);
    await db.run('INSERT INTO group_classes (name, description, cover_image, duration, difficulty) VALUES (?, ?, ?, ?, ?)',
      'HIIT燃脂', '高强度间歇训练，快速燃脂', '', 30, 4);
    await db.run('INSERT INTO group_classes (name, description, cover_image, duration, difficulty) VALUES (?, ?, ?, ?, ?)',
      '普拉提', '核心力量训练，改善体态', '', 50, 2);
  }

  const coachCount = await db.get('SELECT COUNT(*) as count FROM coaches');
  if (coachCount.count === 0) {
    await db.run('INSERT INTO coaches (name, avatar, title, specialty, description, price) VALUES (?, ?, ?, ?, ?, ?)',
      '张教练', '', '高级私人教练', '减脂塑形,力量训练', '10年健身教练经验，国家一级运动员，擅长减脂塑形和力量训练', 300);
    await db.run('INSERT INTO coaches (name, avatar, title, specialty, description, price) VALUES (?, ?, ?, ?, ?, ?)',
      '李教练', '', '明星教练', '瑜伽,普拉提', '国际瑜伽联盟认证教练，专注女性塑形和产后恢复', 350);
    await db.run('INSERT INTO coaches (name, avatar, title, specialty, description, price) VALUES (?, ?, ?, ?, ?, ?)',
      '王教练', '', '资深教练', '搏击,体能训练', '前国家队运动员，擅长搏击和功能性训练', 400);
  }

  const scheduleCount = await db.get('SELECT COUNT(*) as count FROM group_class_schedules');
  if (scheduleCount.count === 0) {
    const today = new Date().toISOString().split('T')[0];
    await db.run('INSERT INTO group_class_schedules (class_id, store_id, coach_name, start_time, end_time, capacity, booked_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      1, 1, '王教练', `${today} 10:00:00`, `${today} 11:00:00`, 20, 5);
    await db.run('INSERT INTO group_class_schedules (class_id, store_id, coach_name, start_time, end_time, capacity, booked_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      2, 1, '李教练', `${today} 14:00:00`, `${today} 15:00:00`, 20, 8);
    await db.run('INSERT INTO group_class_schedules (class_id, store_id, coach_name, start_time, end_time, capacity, booked_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      3, 1, '张教练', `${today} 19:00:00`, `${today} 20:00:00`, 20, 12);
    await db.run('INSERT INTO group_class_schedules (class_id, store_id, coach_name, start_time, end_time, capacity, booked_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      4, 2, '赵教练', `${today} 11:00:00`, `${today} 12:00:00`, 20, 3);
    await db.run('INSERT INTO group_class_schedules (class_id, store_id, coach_name, start_time, end_time, capacity, booked_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      5, 2, '刘教练', `${today} 15:00:00`, `${today} 16:00:00`, 20, 7);
  }

  const cardCount = await db.get('SELECT COUNT(*) as count FROM cards');
  if (cardCount.count === 0) {
    await db.run('INSERT INTO cards (name, type, price, original_price, value, description, benefits, valid_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      '月卡', 1, 299, 399, 299, '30天全场通用会员卡', '全场通用,团课不限,私教9折', 30);
    await db.run('INSERT INTO cards (name, type, price, original_price, value, description, benefits, valid_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      '季卡', 1, 799, 1199, 799, '90天全场通用会员卡', '全场通用,团课不限,私教8折,送1节私教课', 90);
    await db.run('INSERT INTO cards (name, type, price, original_price, value, description, benefits, valid_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      '年卡', 1, 2999, 4999, 2999, '365天全场通用会员卡', '全场通用,团课不限,私教7折,送10节私教课,专属储物柜', 365);
    await db.run('INSERT INTO cards (name, type, price, original_price, value, description, benefits, valid_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      '10次卡', 2, 500, 600, 10, '10次团课卡', '团课通用,有效期180天', 180);
    await db.run('INSERT INTO cards (name, type, price, original_price, value, description, benefits, valid_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      '储值卡1000', 3, 1000, 1000, 1200, '储值1000送200', '全场通用,余额永不过期', 9999);
  }
}

module.exports = { db, initDatabase };
