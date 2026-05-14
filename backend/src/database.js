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
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        nickname TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        role TEXT DEFAULT 'user',
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS sms_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        link TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        images TEXT DEFAULT '',
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        images TEXT DEFAULT '',
        price REAL NOT NULL,
        original_price REAL DEFAULT 0,
        sales INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        style TEXT DEFAULT '',
        specs TEXT DEFAULT '',
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS designers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        real_name TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        experience INTEGER DEFAULT 0,
        works_count INTEGER DEFAULT 0,
        followers INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS designer_works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        designer_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        images TEXT DEFAULT '',
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        status INTEGER DEFAULT 0,
        review_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (designer_id) REFERENCES designers(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'discount',
        amount REAL DEFAULT 0,
        min_amount REAL DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        used_count INTEGER DEFAULT 0,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        coupon_id INTEGER NOT NULL,
        status INTEGER DEFAULT 1,
        used_at DATETIME DEFAULT NULL,
        order_id INTEGER DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (coupon_id) REFERENCES coupons(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        specs TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        pay_amount REAL NOT NULL,
        coupon_id INTEGER DEFAULT NULL,
        status TEXT DEFAULT 'pending',
        pay_time DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (coupon_id) REFERENCES coupons(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        designer_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        images TEXT DEFAULT '',
        area REAL DEFAULT 0,
        style TEXT DEFAULT '',
        budget REAL DEFAULT 0,
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (designer_id) REFERENCES designers(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS designer_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        designer_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (designer_id) REFERENCES designers(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS designer_work_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (work_id) REFERENCES designer_works(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        image TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    insertInitialData();
    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err.message);
  }
}

function insertInitialData() {
  try {
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (categoryCount.count === 0) {
      const categories = [
        { name: '客厅家具', parent_id: 0 },
        { name: '卧室家具', parent_id: 0 },
        { name: '餐厅家具', parent_id: 0 },
        { name: '书房家具', parent_id: 0 },
        { name: '办公家具', parent_id: 0 },
        { name: '沙发', parent_id: 1 },
        { name: '茶几', parent_id: 1 },
        { name: '电视柜', parent_id: 1 },
        { name: '床', parent_id: 2 },
        { name: '衣柜', parent_id: 2 },
        { name: '餐桌', parent_id: 3 },
        { name: '餐椅', parent_id: 3 },
        { name: '书桌', parent_id: 4 },
        { name: '书架', parent_id: 4 },
        { name: '办公桌', parent_id: 5 },
        { name: '办公椅', parent_id: 5 }
      ];
      const insertCat = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)');
      categories.forEach(cat => insertCat.run(cat.name, cat.parent_id));
    }

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productCount.count === 0) {
      const products = [
        { category_id: 6, title: '现代简约布艺沙发', description: '舒适透气，时尚美观', images: '["/images/product1.jpg"]', price: 2999, original_price: 3999, sales: 128, stock: 50, style: '现代简约' },
        { category_id: 6, title: '北欧风格真皮沙发', description: '头层牛皮，品质保证', images: '["/images/product2.jpg"]', price: 5999, original_price: 7999, sales: 86, stock: 30, style: '北欧' },
        { category_id: 9, title: '极简风格双人床', description: '1.8米宽，舒适睡眠', images: '["/images/product3.jpg"]', price: 3599, original_price: 4599, sales: 203, stock: 40, style: '极简' },
        { category_id: 10, title: '实木衣柜', description: '环保材质，大容量', images: '["/images/product4.jpg"]', price: 4299, original_price: 5299, sales: 156, stock: 25, style: '中式' },
        { category_id: 11, title: '大理石餐桌', description: '天然大理石，质感十足', images: '["/images/product5.jpg"]', price: 3899, original_price: 4899, sales: 98, stock: 35, style: '轻奢' },
        { category_id: 13, title: '简约书桌', description: '实木材质，学习办公首选', images: '["/images/product6.jpg"]', price: 1599, original_price: 1999, sales: 312, stock: 60, style: '现代简约' },
        { category_id: 7, title: '玻璃茶几', description: '钢化玻璃，安全耐用', images: '["/images/product7.jpg"]', price: 899, original_price: 1199, sales: 445, stock: 100, style: '现代' },
        { category_id: 8, title: '电视柜组合', description: '大容量收纳，美观实用', images: '["/images/product8.jpg"]', price: 2199, original_price: 2799, sales: 178, stock: 45, style: '现代简约' }
      ];
      const insertProd = db.prepare('INSERT INTO products (category_id, title, description, images, price, original_price, sales, stock, style) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      products.forEach(prod => insertProd.run(prod.category_id, prod.title, prod.description, prod.images, prod.price, prod.original_price, prod.sales, prod.stock, prod.style));
    }

    const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get();
    if (bannerCount.count === 0) {
      const banners = [
        { title: '新品上市', image: '/images/banner1.jpg', link: '/products', sort_order: 1 },
        { title: '限时特惠', image: '/images/banner2.jpg', link: '/activities', sort_order: 2 },
        { title: '设计师推荐', image: '/images/banner3.jpg', link: '/designers', sort_order: 3 }
      ];
      const insertBanner = db.prepare('INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)');
      banners.forEach(banner => insertBanner.run(banner.title, banner.image, banner.link, banner.sort_order));
    }

    const couponCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get();
    if (couponCount.count === 0) {
      const now = new Date();
      const coupons = [
        { name: '新人专享券', type: 'discount', amount: 100, min_amount: 500, total_count: 1000, start_time: now, end_time: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        { name: '满减券', type: 'discount', amount: 200, min_amount: 2000, total_count: 500, start_time: now, end_time: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) },
        { name: 'VIP专属券', type: 'discount', amount: 500, min_amount: 5000, total_count: 200, start_time: now, end_time: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
      ];
      const insertCoupon = db.prepare('INSERT INTO coupons (name, type, amount, min_amount, total_count, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)');
      coupons.forEach(coupon => insertCoupon.run(coupon.name, coupon.type, coupon.amount, coupon.min_amount, coupon.total_count, coupon.start_time.toISOString(), coupon.end_time.toISOString()));
    }

    const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get();
    if (activityCount.count === 0) {
      const now = new Date();
      const activities = [
        { title: '春季家装节', description: '全场家具8折起', image: '/images/activity1.jpg', start_time: now, end_time: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        { title: '设计师专场', description: '知名设计师一对一服务', image: '/images/activity2.jpg', start_time: now, end_time: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) }
      ];
      const insertActivity = db.prepare('INSERT INTO activities (title, description, image, start_time, end_time) VALUES (?, ?, ?, ?, ?)');
      activities.forEach(activity => insertActivity.run(activity.title, activity.description, activity.image, activity.start_time.toISOString(), activity.end_time.toISOString()));
    }
  } catch (err) {
    console.error('插入初始数据失败:', err.message);
  }
}

initDatabase();

module.exports = db;
