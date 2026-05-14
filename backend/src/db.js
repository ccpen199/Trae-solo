const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

function initDatabase() {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT,
    nickname TEXT DEFAULT '用户',
    avatar TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT,
    city TEXT,
    district TEXT,
    detail TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    delivery_time INTEGER DEFAULT 30,
    delivery_fee INTEGER DEFAULT 5,
    min_order INTEGER DEFAULT 20,
    sales INTEGER DEFAULT 0,
    address TEXT,
    latitude REAL,
    longitude REAL,
    tags TEXT,
    banner TEXT,
    is_open INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    original_price REAL,
    image TEXT DEFAULT '',
    description TEXT,
    sales INTEGER DEFAULT 0,
    category_id INTEGER,
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 999,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_id INTEGER NOT NULL,
    address_id INTEGER NOT NULL,
    items TEXT NOT NULL,
    total_price REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    pay_status TEXT DEFAULT 'unpaid',
    pay_method TEXT,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image TEXT NOT NULL,
    link TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    link TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS captchas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
  )`);

  insertMockData();
}

function insertMockData() {
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const categories = [
      { name: '全部', icon: '🍽️' },
      { name: '快餐便当', icon: '🍱' },
      { name: '汉堡薯条', icon: '🍔' },
      { name: '炸鸡烧烤', icon: '🍗' },
      { name: '披萨意面', icon: '🍕' },
      { name: '日韩料理', icon: '🍣' },
      { name: '川湘菜', icon: '🌶️' },
      { name: '江浙菜', icon: '🦐' },
      { name: '粤菜', icon: '🦀' },
      { name: '甜品饮品', icon: '🧁' },
      { name: '水果生鲜', icon: '🍉' },
      { name: '早餐', icon: '🌅' },
      { name: '夜宵', icon: '🌙' },
      { name: '火锅', icon: '🍲' },
      { name: '海鲜', icon: '🐟' }
    ];
    const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    categories.forEach((cat, index) => {
      insertCat.run(cat.name, cat.icon, index);
    });
  }

  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get();
  if (merchantCount.count === 0) {
    const merchants = [
      { name: '麦当劳', logo: 'https://picsum.photos/seed/mcdonalds/100/100', rating: 4.8, delivery_time: 25, delivery_fee: 5, min_order: 20, sales: 12580, address: '北京市朝阳区望京SOHO', latitude: 39.9942, longitude: 116.4778, tags: '汉堡,薯条,炸鸡' },
      { name: '肯德基', logo: 'https://picsum.photos/seed/kfc/100/100', rating: 4.7, delivery_time: 28, delivery_fee: 6, min_order: 18, sales: 10320, address: '北京市朝阳区三里屯', latitude: 39.9371, longitude: 116.4461, tags: '炸鸡,汉堡,早餐' },
      { name: '真功夫', logo: 'https://picsum.photos/seed/zgf/100/100', rating: 4.5, delivery_time: 30, delivery_fee: 4, min_order: 25, sales: 8760, address: '北京市海淀区中关村', latitude: 39.9887, longitude: 116.3058, tags: '快餐,米饭,套餐' },
      { name: '吉野家', logo: 'https://picsum.photos/seed/yoshinoya/100/100', rating: 4.6, delivery_time: 25, delivery_fee: 5, min_order: 22, sales: 9450, address: '北京市西城区西单', latitude: 39.9142, longitude: 116.3813, tags: '日式,牛肉饭,定食' },
      { name: '必胜客', logo: 'https://picsum.photos/seed/pizzahut/100/100', rating: 4.7, delivery_time: 35, delivery_fee: 8, min_order: 30, sales: 7680, address: '北京市东城区王府井', latitude: 39.9144, longitude: 116.4078, tags: '披萨,意面,西餐' },
      { name: '海底捞', logo: 'https://picsum.photos/seed/haidilao/100/100', rating: 4.9, delivery_time: 40, delivery_fee: 10, min_order: 50, sales: 15230, address: '北京市朝阳区国贸', latitude: 39.9042, longitude: 116.4778, tags: '火锅,川味,服务好' },
      { name: '星巴克', logo: 'https://picsum.photos/seed/starbucks/100/100', rating: 4.8, delivery_time: 20, delivery_fee: 6, min_order: 15, sales: 11890, address: '北京市朝阳区望京', latitude: 39.9928, longitude: 116.4765, tags: '咖啡,饮品,甜点' },
      { name: '喜茶', logo: 'https://picsum.photos/seed/heytea/100/100', rating: 4.6, delivery_time: 22, delivery_fee: 5, min_order: 18, sales: 13450, address: '北京市海淀区五道口', latitude: 39.9968, longitude: 116.3358, tags: '奶茶,饮品,水果茶' }
    ];
    const insertMerchant = db.prepare('INSERT INTO merchants (name, logo, rating, delivery_time, delivery_fee, min_order, sales, address, latitude, longitude, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    merchants.forEach((merchant) => {
      insertMerchant.run(merchant.name, merchant.logo, merchant.rating, merchant.delivery_time, merchant.delivery_fee, merchant.min_order, merchant.sales, merchant.address, merchant.latitude, merchant.longitude, merchant.tags);
    });
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const products = [
      { merchant_id: 1, name: '巨无霸汉堡套餐', price: 35.9, original_price: 42, image: 'https://picsum.photos/seed/bigmac/200/200', description: '经典巨无霸汉堡+薯条+可乐', sales: 3250, is_hot: 1 },
      { merchant_id: 1, name: '麦辣鸡腿堡', price: 22.5, original_price: 28, image: 'https://picsum.photos/seed/spicychicken/200/200', description: '香辣鸡腿肉汉堡', sales: 2890, is_hot: 1 },
      { merchant_id: 1, name: '薯条(中)', price: 12, original_price: 15, image: 'https://picsum.photos/seed/fries/200/200', description: '金黄酥脆薯条', sales: 4560 },
      { merchant_id: 1, name: '可乐(中杯)', price: 9, original_price: 12, image: 'https://picsum.photos/seed/cola/200/200', description: '冰爽可乐', sales: 5120 },
      { merchant_id: 2, name: '原味鸡(5块)', price: 39.9, original_price: 49, image: 'https://picsum.photos/seed/friedchicken/200/200', description: '经典原味炸鸡5块', sales: 3890, is_hot: 1 },
      { merchant_id: 2, name: '香辣鸡腿堡', price: 21, original_price: 26, image: 'https://picsum.photos/seed/kfcburger/200/200', description: '香辣鸡腿汉堡', sales: 2670 },
      { merchant_id: 3, name: '香汁排骨饭', price: 28, original_price: 35, image: 'https://picsum.photos/seed/porkrice/200/200', description: '秘制香汁排骨饭', sales: 1890, is_hot: 1 },
      { merchant_id: 3, name: '鱼香肉丝饭', price: 22, original_price: 28, image: 'https://picsum.photos/seed/shreddedpork/200/200', description: '经典鱼香肉丝饭', sales: 1560 },
      { merchant_id: 4, name: '牛肉饭', price: 32, original_price: 38, image: 'https://picsum.photos/seed/beefbowl/200/200', description: '日式牛肉饭', sales: 2340, is_hot: 1 },
      { merchant_id: 4, name: '咖喱猪排饭', price: 28, original_price: 34, image: 'https://picsum.photos/seed/currykatsu/200/200', description: '日式咖喱猪排饭', sales: 1890 },
      { merchant_id: 5, name: '超级至尊披萨(9寸)', price: 79, original_price: 99, image: 'https://picsum.photos/seed/pizza/200/200', description: '多种配料超级至尊披萨', sales: 1560, is_hot: 1 },
      { merchant_id: 5, name: '意大利肉酱面', price: 35, original_price: 42, image: 'https://picsum.photos/seed/spaghetti/200/200', description: '经典意大利肉酱面', sales: 1230 },
      { merchant_id: 6, name: '番茄锅底', price: 38, original_price: 48, image: 'https://picsum.photos/seed/tomatopot/200/200', description: '浓郁番茄锅底', sales: 2890 },
      { merchant_id: 6, name: '肥牛卷(小份)', price: 42, original_price: 52, image: 'https://picsum.photos/seed/beefrolls/200/200', description: '优质肥牛卷', sales: 3450, is_hot: 1 },
      { merchant_id: 7, name: '拿铁咖啡', price: 28, original_price: 35, image: 'https://picsum.photos/seed/latte/200/200', description: '香浓拿铁咖啡', sales: 4560, is_hot: 1 },
      { merchant_id: 7, name: '焦糖玛奇朵', price: 32, original_price: 38, image: 'https://picsum.photos/seed/caramel/200/200', description: '甜蜜焦糖玛奇朵', sales: 2890 },
      { merchant_id: 8, name: '芝士奶盖茶', price: 22, original_price: 28, image: 'https://picsum.photos/seed/milktea/200/200', description: '浓郁芝士奶盖茶', sales: 5670, is_hot: 1 },
      { merchant_id: 8, name: '水果茶(大杯)', price: 20, original_price: 25, image: 'https://picsum.photos/seed/fruittea/200/200', description: '新鲜水果茶', sales: 4320 }
    ];
    const insertProduct = db.prepare('INSERT INTO products (merchant_id, name, price, original_price, image, description, sales, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    products.forEach((product) => {
      insertProduct.run(product.merchant_id, product.name, product.price, product.original_price, product.image, product.description, product.sales, product.is_hot);
    });
  }

  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get();
  if (bannerCount.count === 0) {
    const banners = [
      { image: 'https://picsum.photos/seed/banner1/800/400', link: '/promotion/1', sort_order: 1 },
      { image: 'https://picsum.photos/seed/banner2/800/400', link: '/promotion/2', sort_order: 2 },
      { image: 'https://picsum.photos/seed/banner3/800/400', link: '/promotion/3', sort_order: 3 },
      { image: 'https://picsum.photos/seed/banner4/800/400', link: '/promotion/4', sort_order: 4 },
      { image: 'https://picsum.photos/seed/banner5/800/400', link: '/promotion/5', sort_order: 5 },
      { image: 'https://picsum.photos/seed/banner6/800/400', link: '/promotion/6', sort_order: 6 },
      { image: 'https://picsum.photos/seed/banner7/800/400', link: '/promotion/7', sort_order: 7 }
    ];
    const insertBanner = db.prepare('INSERT INTO banners (image, link, sort_order) VALUES (?, ?, ?)');
    banners.forEach((banner) => {
      insertBanner.run(banner.image, banner.link, banner.sort_order);
    });
  }

  const topicCount = db.prepare('SELECT COUNT(*) as count FROM topics').get();
  if (topicCount.count === 0) {
    const topics = [
      { title: '夏日清凉', image: 'https://picsum.photos/seed/topic1/200/260', description: '夏日特饮第二杯半价', link: '/topic/1', sort_order: 1 },
      { title: '早餐特惠', image: 'https://picsum.photos/seed/topic2/200/260', description: '早餐满15减5', link: '/topic/2', sort_order: 2 },
      { title: '夜宵狂欢', image: 'https://picsum.photos/seed/topic3/200/260', description: '夜宵全场8折', link: '/topic/3', sort_order: 3 },
      { title: '品牌特惠', image: 'https://picsum.photos/seed/topic4/200/260', description: '知名品牌限时优惠', link: '/topic/4', sort_order: 4 },
      { title: '新客专享', image: 'https://picsum.photos/seed/topic5/200/260', description: '新用户首单立减10元', link: '/topic/5', sort_order: 5 }
    ];
    const insertTopic = db.prepare('INSERT INTO topics (title, image, description, link, sort_order) VALUES (?, ?, ?, ?, ?)');
    topics.forEach((topic) => {
      insertTopic.run(topic.title, topic.image, topic.description, topic.link, topic.sort_order);
    });
  }
}

initDatabase();

module.exports = db;
