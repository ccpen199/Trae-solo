const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT UNIQUE,
    nickname TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    is_member INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    city TEXT DEFAULT '未识别',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    sort INTEGER DEFAULT 0,
    parent_id INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    member_price REAL,
    stock INTEGER DEFAULT 100,
    sales INTEGER DEFAULT 0,
    category_id INTEGER,
    image TEXT,
    images TEXT,
    unit TEXT DEFAULT '份',
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_member_only INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS flash_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    flash_price REAL NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    stock INTEGER DEFAULT 0,
    sold INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    cart_key TEXT,
    selected INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT,
    city TEXT,
    district TEXT,
    detail TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    latitude REAL,
    longitude REAL,
    city TEXT,
    status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    pay_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    delivery_type TEXT DEFAULT 'delivery',
    store_id INTEGER,
    address_id INTEGER,
    address_info TEXT,
    payment_method TEXT,
    paid_at DATETIME,
    delivered_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT DEFAULT '份'
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover TEXT,
    video_url TEXT,
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS video_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS video_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS video_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS after_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    order_item_id INTEGER,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT
  );
`);

const initData = () => {
  const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categories.count === 0) {
    const categoryData = [
      { name: '新鲜蔬菜', icon: '🥬', sort: 1 },
      { name: '时令水果', icon: '🍎', sort: 2 },
      { name: '肉禽蛋奶', icon: '🥩', sort: 3 },
      { name: '海鲜水产', icon: '🦐', sort: 4 },
      { name: '粮油调味', icon: '🍚', sort: 5 },
      { name: '冷冻食品', icon: '🧊', sort: 6 },
      { name: '熟食卤味', icon: '🍗', sort: 7 },
      { name: '鲜花绿植', icon: '🌸', sort: 8 },
    ];
    
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)');
    categoryData.forEach(cat => insertCategory.run(cat.name, cat.icon, cat.sort));
  }

  const stores = db.prepare('SELECT COUNT(*) as count FROM stores').get();
  if (stores.count === 0) {
    const storeData = [
      { name: '一品鲜北京国贸店', address: '北京市朝阳区建国门外大街1号', phone: '010-12345678', city: '北京', latitude: 39.91, longitude: 116.40 },
      { name: '一品鲜上海陆家嘴店', address: '上海市浦东新区陆家嘴环路', phone: '021-87654321', city: '上海', latitude: 31.23, longitude: 121.50 },
      { name: '一品鲜广州天河店', address: '广州市天河区天河路385号', phone: '020-11112222', city: '广州', latitude: 23.13, longitude: 113.33 },
    ];
    
    const insertStore = db.prepare('INSERT INTO stores (name, address, phone, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)');
    storeData.forEach(store => insertStore.run(store.name, store.address, store.phone, store.city, store.latitude, store.longitude));
  }
};

initData();

module.exports = db;
