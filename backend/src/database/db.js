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

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  password TEXT,
  nickname TEXT,
  avatar TEXT,
  third_party_type TEXT,
  third_party_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expire_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pinyin TEXT,
  initial TEXT,
  latitude REAL,
  longitude REAL,
  is_hot INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  address TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS car_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  base_price REAL DEFAULT 0,
  per_km_price REAL DEFAULT 0,
  per_minute_price REAL DEFAULT 0,
  description TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  car_model TEXT,
  car_number TEXT,
  car_color TEXT,
  rating REAL DEFAULT 4.8,
  order_count INTEGER DEFAULT 0,
  latitude REAL,
  longitude REAL,
  status TEXT DEFAULT 'idle'
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  driver_id TEXT,
  car_type_id TEXT NOT NULL,
  start_name TEXT NOT NULL,
  start_address TEXT,
  start_lat REAL NOT NULL,
  start_lng REAL NOT NULL,
  end_name TEXT NOT NULL,
  end_address TEXT,
  end_lat REAL NOT NULL,
  end_lng REAL NOT NULL,
  distance_km REAL,
  duration_min INTEGER,
  estimated_price REAL,
  actual_price REAL,
  service_type TEXT DEFAULT 'express',
  book_time DATETIME,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  from_user_id TEXT,
  to_user_id TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'normal',
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  balance REAL DEFAULT 0,
  coupon_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  rating REAL NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const initData = () => {
  const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get().count;
  if (cityCount === 0) {
    const cities = [
      { id: '1', name: '北京', pinyin: 'beijing', initial: 'B', latitude: 39.9042, longitude: 116.4074, is_hot: 1 },
      { id: '2', name: '上海', pinyin: 'shanghai', initial: 'S', latitude: 31.2304, longitude: 121.4737, is_hot: 1 },
      { id: '3', name: '广州', pinyin: 'guangzhou', initial: 'G', latitude: 23.1291, longitude: 113.2644, is_hot: 1 },
      { id: '4', name: '深圳', pinyin: 'shenzhen', initial: 'S', latitude: 22.5431, longitude: 114.0579, is_hot: 1 },
      { id: '5', name: '杭州', pinyin: 'hangzhou', initial: 'H', latitude: 30.2741, longitude: 120.1551, is_hot: 1 },
      { id: '6', name: '成都', pinyin: 'chengdu', initial: 'C', latitude: 30.5728, longitude: 104.0668, is_hot: 1 },
      { id: '7', name: '南京', pinyin: 'nanjing', initial: 'N', latitude: 32.0603, longitude: 118.7969, is_hot: 0 },
      { id: '8', name: '武汉', pinyin: 'wuhan', initial: 'W', latitude: 30.5928, longitude: 114.3055, is_hot: 0 },
    ];
    const stmt = db.prepare('INSERT INTO cities (id, name, pinyin, initial, latitude, longitude, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?)');
    cities.forEach(city => stmt.run(city.id, city.name, city.pinyin, city.initial, city.latitude, city.longitude, city.is_hot));
  }

  const carTypeCount = db.prepare('SELECT COUNT(*) as count FROM car_types').get().count;
  if (carTypeCount === 0) {
    const carTypes = [
      { id: '1', name: 'express', display_name: '快车', base_price: 13, per_km_price: 2.2, per_minute_price: 0.5, description: '经济实惠，随叫随到', icon: '🚗' },
      { id: '2', name: 'premium', display_name: '专车', base_price: 25, per_km_price: 3.5, per_minute_price: 0.8, description: '舒适车型，优质服务', icon: '🚙' },
      { id: '3', name: 'luxury', display_name: '豪华车', base_price: 50, per_km_price: 5.5, per_minute_price: 1.2, description: '高端座驾，尊享出行', icon: '🚘' },
      { id: '4', name: 'taxi', display_name: '出租车', base_price: 14, per_km_price: 2.4, per_minute_price: 0.6, description: '正规出租车', icon: '🚕' },
      { id: '5', name: 'hitchhike', display_name: '顺风车', base_price: 8, per_km_price: 1.2, per_minute_price: 0, description: '拼车出行，绿色环保', icon: '🚌' },
    ];
    const stmt = db.prepare('INSERT INTO car_types (id, name, display_name, base_price, per_km_price, per_minute_price, description, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    carTypes.forEach(ct => stmt.run(ct.id, ct.name, ct.display_name, ct.base_price, ct.per_km_price, ct.per_minute_price, ct.description, ct.icon));
  }

  const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
  if (driverCount === 0) {
    const drivers = [
      { id: '1', name: '王师傅', phone: '13800138001', avatar: '👨', car_model: '大众帕萨特', car_number: '京A12345', car_color: '黑色', rating: 4.9, order_count: 1234, latitude: 39.9082, longitude: 116.4104, status: 'idle' },
      { id: '2', name: '李师傅', phone: '13800138002', avatar: '👨', car_model: '丰田凯美瑞', car_number: '京B23456', car_color: '白色', rating: 4.8, order_count: 987, latitude: 39.9012, longitude: 116.4054, status: 'idle' },
      { id: '3', name: '张师傅', phone: '13800138003', avatar: '👩', car_model: '宝马5系', car_number: '京C34567', car_color: '黑色', rating: 5.0, order_count: 567, latitude: 39.9062, longitude: 116.4124, status: 'idle' },
    ];
    const stmt = db.prepare('INSERT INTO drivers (id, name, phone, avatar, car_model, car_number, car_color, rating, order_count, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    drivers.forEach(d => stmt.run(d.id, d.name, d.phone, d.avatar, d.car_model, d.car_number, d.car_color, d.rating, d.order_count, d.latitude, d.longitude, d.status));
  }

  const announcementCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count;
  if (announcementCount === 0) {
    const announcements = [
      { id: '1', title: '欢迎使用滴滴出行', content: '新用户专享首单立减10元，快来体验吧！', type: 'coupon', priority: 1, is_active: 1 },
      { id: '2', title: '安全出行提示', content: '请系好安全带，出行更安全。', type: 'safety', priority: 2, is_active: 1 },
      { id: '3', title: '周末出行优惠', content: '周末用车享受8折优惠，活动时间：周六周日。', type: 'activity', priority: 3, is_active: 1 },
    ];
    const stmt = db.prepare('INSERT INTO announcements (id, title, content, type, priority, is_active) VALUES (?, ?, ?, ?, ?, ?)');
    announcements.forEach(a => stmt.run(a.id, a.title, a.content, a.type, a.priority, a.is_active));
  }
};

initData();

module.exports = db;