import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || './data/app.sqlite';
const resolvedPath = path.resolve(__dirname, '../../', dbPath);

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      rating REAL DEFAULT 5.0,
      on_time_rate REAL DEFAULT 0.95,
      bad_review_rate REAL DEFAULT 0.02,
      repurchase_rate REAL DEFAULT 0.3,
      delivery_radius REAL DEFAULT 5.0,
      is_online INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('flower', 'cake', 'gift')),
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      image TEXT NOT NULL,
      description TEXT,
      festival TEXT,
      scene TEXT,
      shelf_life_hours INTEGER NOT NULL,
      delivery_radius REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      inbound_time DATETIME NOT NULL,
      expiry_time DATETIME NOT NULL,
      FOREIGN KEY (shop_id) REFERENCES shops(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      shop_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      recipient_lat REAL NOT NULL,
      recipient_lng REAL NOT NULL,
      delivery_type TEXT NOT NULL CHECK (delivery_type IN ('instant', 'next-day')),
      expected_delivery_time DATETIME NOT NULL,
      actual_delivery_time DATETIME,
      rider_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS logistics_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('sorting', 'rider', 'cold-chain')),
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      temperature REAL,
      timestamp DATETIME NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('timeout', 'damaged', 'rejected')),
      reason TEXT NOT NULL,
      evidence TEXT,
      refund_ratio REAL NOT NULL,
      refund_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      is_online INTEGER DEFAULT 1,
      current_lat REAL,
      current_lng REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wastage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT,
      reported_by INTEGER NOT NULL,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_logistics_order_id ON logistics_nodes(order_id);
  `);

  console.log('Database initialized successfully');
}

export function seedDatabase(): void {
  const database = getDb();

  const shopCount = database.prepare('SELECT COUNT(*) as count FROM shops').get() as { count: number };
  if (shopCount.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const now = new Date();
  const hoursLater = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

  const insertShop = database.prepare(`
    INSERT INTO shops (name, city, district, address, lat, lng, rating, on_time_rate, bad_review_rate, repurchase_rate, delivery_radius, is_online)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const shops = [
    { name: '花韵坊花艺工作室', city: '北京市', district: '朝阳区', address: '建国路88号SOHO现代城A座1层', lat: 39.9087, lng: 116.4074, rating: 4.9, onTimeRate: 0.98, badReviewRate: 0.01, repurchaseRate: 0.45, deliveryRadius: 8 },
    { name: '馨香阁鲜花店', city: '北京市', district: '海淀区', address: '中关村大街1号海龙大厦B1层', lat: 39.9847, lng: 116.3046, rating: 4.8, onTimeRate: 0.96, badReviewRate: 0.02, repurchaseRate: 0.38, deliveryRadius: 6 },
    { name: '悦己花艺生活馆', city: '上海市', district: '浦东新区', address: '陆家嘴环路1000号恒生银行大厦1层', lat: 31.2304, lng: 121.4737, rating: 4.9, onTimeRate: 0.97, badReviewRate: 0.015, repurchaseRate: 0.42, deliveryRadius: 7 },
    { name: '花间集创意花艺', city: '上海市', district: '静安区', address: '南京西路1788号国际中心B1层', lat: 31.2243, lng: 121.4476, rating: 4.7, onTimeRate: 0.94, badReviewRate: 0.03, repurchaseRate: 0.35, deliveryRadius: 5 },
    { name: '花语时光鲜花定制', city: '广州市', district: '天河区', address: '天河路385号太古汇MU层', lat: 23.1291, lng: 113.2644, rating: 4.8, onTimeRate: 0.95, badReviewRate: 0.025, repurchaseRate: 0.4, deliveryRadius: 6 },
    { name: '浪漫满屋花艺馆', city: '深圳市', district: '南山区', address: '科技园南区深南大道9996号松日鼎盛大厦1层', lat: 22.5431, lng: 114.0579, rating: 4.9, onTimeRate: 0.97, badReviewRate: 0.02, repurchaseRate: 0.43, deliveryRadius: 7 },
  ];

  const shopIds: number[] = [];
  for (const shop of shops) {
    const result = insertShop.run(shop.name, shop.city, shop.district, shop.address, shop.lat, shop.lng, shop.rating, shop.onTimeRate, shop.badReviewRate, shop.repurchaseRate, shop.deliveryRadius, 1);
    shopIds.push(Number(result.lastInsertRowid));
  }

  const insertProduct = database.prepare(`
    INSERT INTO products (shop_id, name, category, price, original_price, image, description, festival, scene, shelf_life_hours, delivery_radius, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const festivals = ['情人节', '母亲节', '520', '七夕', '圣诞节', '生日', '纪念日'];
  const scenes = ['生日', '告白', '求婚', '探望', '哀思', '乔迁', '感谢', '道歉'];

  const products = [
    { name: '浪漫红玫瑰花束', category: 'flower' as const, price: 299, originalPrice: 399, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20red%20rose%20bouquet%20elegant%20floral%20arrangement&image_size=square', desc: '精选99朵厄瓜多尔进口红玫瑰，搭配满天星与尤加利叶，象征热烈的爱情', fest: ['情人节', '520', '七夕', '纪念日'], sce: ['告白', '求婚', '纪念日'], shelf: 48, radius: 8, stock: 50 },
    { name: '粉色康乃馨花束', category: 'flower' as const, price: 199, originalPrice: 259, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pink%20carnation%20bouquet%20mothers%20day%20gift&image_size=square', desc: '33朵粉色康乃馨，送给最爱的妈妈，表达感恩与祝福', fest: ['母亲节', '生日'], sce: ['探望', '感谢'], shelf: 72, radius: 6, stock: 80 },
    { name: '向日葵阳光花束', category: 'flower' as const, price: 168, originalPrice: 218, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sunflower%20bouquet%20bright%20cheerful%20yellow%20flowers&image_size=square', desc: '11朵向日葵，阳光明媚，传递正能量与温暖', fest: ['生日', '毕业季'], sce: ['感谢', '探望', '乔迁'], shelf: 72, radius: 6, stock: 60 },
    { name: '白色恋人百合花束', category: 'flower' as const, price: 258, originalPrice: 328, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20lily%20bouquet%20elegant%20pure%20flowers&image_size=square', desc: '精选6朵香水百合，纯洁高雅，适合各种场合', fest: ['情人节', '母亲节', '纪念日'], sce: ['告白', '探望', '哀思'], shelf: 96, radius: 7, stock: 40 },
    { name: '彩虹玫瑰礼盒', category: 'flower' as const, price: 520, originalPrice: 688, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rainbow%20rose%20gift%20box%20luxury%20floral%20arrangement&image_size=square', desc: '19朵进口彩虹玫瑰，高端礼盒包装，独一无二的浪漫', fest: ['情人节', '520', '七夕', '纪念日', '圣诞节'], sce: ['告白', '求婚', '纪念日'], shelf: 48, radius: 5, stock: 20 },
    { name: '永生花音乐盒', category: 'gift' as const, price: 399, originalPrice: 499, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=preserved%20flower%20music%20box%20rose%20in%20glass%20dome&image_size=square', desc: '进口永生花搭配经典音乐盒，保存3-5年不凋谢，珍藏永恒的爱', fest: ['情人节', '520', '七夕', '圣诞节', '纪念日', '生日'], sce: ['告白', '纪念日', '生日'], shelf: 8760, radius: 20, stock: 30 },
    { name: '草莓奶油蛋糕', category: 'cake' as const, price: 188, originalPrice: 228, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=strawberry%20cream%20cake%20birthday%20celebration%20dessert&image_size=square', desc: '8寸新鲜草莓奶油蛋糕，采用新西兰进口奶油，甜而不腻', fest: ['生日', '纪念日'], sce: ['生日', '乔迁', '感谢'], shelf: 24, radius: 5, stock: 25 },
    { name: '巧克力熔岩蛋糕', category: 'cake' as const, price: 268, originalPrice: 328, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chocolate%20lava%20cake%20molten%20center%20dessert&image_size=square', desc: '6寸比利时巧克力熔岩蛋糕，浓郁可可，入口即化', fest: ['情人节', '纪念日', '生日'], sce: ['告白', '纪念日', '生日'], shelf: 24, radius: 5, stock: 15 },
    { name: '男士商务礼盒', category: 'gift' as const, price: 888, originalPrice: 1088, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mens%20business%20gift%20box%20luxury%20pen%20tie%20cufflinks&image_size=square', desc: '高端钢笔+真丝领带+袖扣三件套，商务送礼首选', fest: ['父亲节', '生日', '纪念日'], sce: ['感谢', '乔迁', '生日'], shelf: 8760, radius: 20, stock: 20 },
    { name: '香槟玫瑰礼盒', category: 'flower' as const, price: 368, originalPrice: 458, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=champagne%20rose%20gift%20box%20elegant%20beige%20roses&image_size=square', desc: '33朵香槟玫瑰，高雅礼盒包装，优雅与浪漫的完美结合', fest: ['情人节', '520', '七夕', '纪念日', '生日'], sce: ['告白', '纪念日', '感谢', '乔迁'], shelf: 48, radius: 7, stock: 35 },
    { name: '混搭鲜花花篮', category: 'flower' as const, price: 288, originalPrice: 358, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mixed%20flower%20basket%20colorful%20spring%20arrangement&image_size=square', desc: '玫瑰、百合、郁金香、洋桔梗混搭花篮，缤纷多彩', fest: ['母亲节', '生日', '探望', '乔迁'], sce: ['探望', '乔迁', '感谢', '生日'], shelf: 72, radius: 6, stock: 45 },
    { name: '蓝色妖姬花束', category: 'flower' as const, price: 388, originalPrice: 488, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blue%20enchanted%20rose%20bouquet%20mysterious%20elegant&image_size=square', desc: '19朵蓝色妖姬，神秘而高贵，独一无二的选择', fest: ['情人节', '520', '七夕', '纪念日'], sce: ['告白', '纪念日', '生日'], shelf: 48, radius: 6, stock: 25 },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const shopId = shopIds[i % shopIds.length];
    insertProduct.run(
      shopId,
      p.name,
      p.category,
      p.price,
      p.originalPrice,
      p.image,
      p.desc,
      JSON.stringify(p.fest),
      JSON.stringify(p.sce),
      p.shelf,
      p.radius,
      p.stock
    );
  }

  const insertInventory = database.prepare(`
    INSERT INTO inventory (shop_id, product_id, batch_no, quantity, temperature, humidity, inbound_time, expiry_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= products.length; i++) {
    const shopId = ((i - 1) % shopIds.length) + 1;
    insertInventory.run(
      shopId,
      i,
      `BATCH-${String(i).padStart(4, '0')}-202606`,
      products[i - 1].stock,
      2 + Math.random() * 4,
      60 + Math.random() * 20,
      now.toISOString(),
      hoursLater(products[i - 1].shelf)
    );
  }

  const insertUser = database.prepare(`
    INSERT INTO users (phone, nickname, role) VALUES (?, ?, ?)
  `);

  insertUser.run('13800138000', '小花', 'customer');
  insertUser.run('13800138001', '花韵坊店长', 'shop');
  insertUser.run('13800138002', '调度员小王', 'dispatcher');
  insertUser.run('13800138003', '管理员小李', 'admin');

  const insertRider = database.prepare(`
    INSERT INTO riders (name, phone, is_online, current_lat, current_lng) VALUES (?, ?, ?, ?, ?)
  `);

  const riders = [
    { name: '骑手小张', phone: '13900139001', lat: 39.91, lng: 116.41 },
    { name: '骑手小李', phone: '13900139002', lat: 39.99, lng: 116.31 },
    { name: '骑手小王', phone: '13900139003', lat: 31.23, lng: 121.48 },
    { name: '骑手小刘', phone: '13900139004', lat: 22.54, lng: 114.06 },
  ];

  for (const rider of riders) {
    insertRider.run(rider.name, rider.phone, 1, rider.lat, rider.lng);
  }

  console.log('Database seeded successfully');
}
