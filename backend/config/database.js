const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.sqlite');

const initDB = () => {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      balance REAL DEFAULT 0,
      yijie_coins INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      payment_password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT,
      link_type TEXT,
      link_value TEXT,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      main_image TEXT,
      images TEXT,
      description TEXT,
      details TEXT,
      is_hot INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_recommend INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      selected INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      pay_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      type TEXT DEFAULT 'product',
      pay_type TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT,
      product_image TEXT,
      price REAL,
      quantity INTEGER,
      amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gas_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      longitude REAL,
      latitude REAL,
      distance TEXT,
      rating REAL,
      opening_hours TEXT,
      services TEXT,
      images TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fuel_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      station_id INTEGER,
      station_name TEXT,
      fuel_type TEXT,
      fuel_price REAL,
      fuel_liters REAL,
      total_amount REAL NOT NULL,
      pay_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_type TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      description TEXT,
      related_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plate_number TEXT UNIQUE,
      vehicle_type TEXT,
      fuel_type TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'discount',
      discount_amount REAL,
      min_amount REAL,
      valid_from DATE,
      valid_to DATE,
      total_count INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coupon_id INTEGER NOT NULL,
      status TEXT DEFAULT 'unused',
      used_at DATETIME,
      order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      cover_image TEXT,
      author TEXT,
      view_count INTEGER DEFAULT 0,
      category TEXT DEFAULT 'news',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER NOT NULL,
      reward_coins INTEGER DEFAULT 100,
      reward_given INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const insertIfNotExists = (table, data, condition) => {
    const existing = db.prepare(`SELECT id FROM ${table} WHERE ${condition}`).get();
    if (!existing) {
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(',');
      const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
      stmt.run(...Object.values(data));
    }
  };

  insertIfNotExists('categories', { name: '热门推荐', icon: '🔥', sort: 1 }, "name = '热门推荐'");
  insertIfNotExists('categories', { name: '饮料酒水', icon: '🥤', sort: 2 }, "name = '饮料酒水'");
  insertIfNotExists('categories', { name: '休闲零食', icon: '🍿', sort: 3 }, "name = '休闲零食'");
  insertIfNotExists('categories', { name: '日用百货', icon: '🧴', sort: 4 }, "name = '日用百货'");
  insertIfNotExists('categories', { name: '汽车用品', icon: '🚗', sort: 5 }, "name = '汽车用品'");

  insertIfNotExists('banners', { 
    title: '易捷加油 - 满200减20', 
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20promotional%20banner%20for%20gas%20station%20fuel%20discount%20offer&image_size=landscape_16_9',
    link_type: 'coupon',
    link_value: '1',
    sort: 1
  }, "title = '易捷加油 - 满200减20'");
  
  insertIfNotExists('banners', { 
    title: '新人专享 - 注册即送50元券', 
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=welcome%20new%20user%20coupon%20promotion%20banner%20blue%20theme&image_size=landscape_16_9',
    link_type: 'coupon',
    link_value: '2',
    sort: 2
  }, "title = '新人专享 - 注册即送50元券'");

  insertIfNotExists('banners', { 
    title: '便利店特惠 - 满100减15', 
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=convenience%20store%20product%20discount%20promotional%20banner%20green&image_size=landscape_16_9',
    link_type: 'category',
    link_value: '1',
    sort: 3
  }, "title = '便利店特惠 - 满100减15'");

  insertIfNotExists('products', {
    name: '农夫山泉矿泉水 550ml',
    category_id: 2,
    price: 2.50,
    original_price: 3.00,
    stock: 100,
    sales: 2580,
    main_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mineral%20water%20bottle%20product%20photo%20white%20background&image_size=square_hd',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mineral%20water%20bottle%20product%20photo%20white%20background&image_size=square_hd"]',
    description: '天然矿泉水，源自长白山，纯净甘甜',
    is_hot: 1,
    is_recommend: 1
  }, "name = '农夫山泉矿泉水 550ml'");

  insertIfNotExists('products', {
    name: '可口可乐 330ml 罐装',
    category_id: 2,
    price: 3.00,
    original_price: 3.50,
    stock: 200,
    sales: 1890,
    main_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coca%20cola%20can%20330ml%20product%20photo%20white%20background&image_size=square_hd',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coca%20cola%20can%20330ml%20product%20photo%20white%20background&image_size=square_hd"]',
    description: '经典可口可乐，畅爽怡神',
    is_hot: 1,
    is_recommend: 1
  }, "name = '可口可乐 330ml 罐装'");

  insertIfNotExists('products', {
    name: '乐事薯片 原味 75g',
    category_id: 3,
    price: 8.90,
    original_price: 10.90,
    stock: 150,
    sales: 3210,
    main_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lays%20potato%20chips%20original%20flavor%20product%20photo%20white%20background&image_size=square_hd',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lays%20potato%20chips%20original%20flavor%20product%20photo%20white%20background&image_size=square_hd"]',
    description: '香脆可口，休闲必备',
    is_hot: 1,
    is_new: 1
  }, "name = '乐事薯片 原味 75g'");

  insertIfNotExists('products', {
    name: '康师傅红烧牛肉面',
    category_id: 3,
    price: 4.50,
    original_price: 5.00,
    stock: 300,
    sales: 5680,
    main_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=instant%20noodles%20bowl%20beef%20flavor%20product%20photo%20white%20background&image_size=square_hd',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=instant%20noodles%20bowl%20beef%20flavor%20product%20photo%20white%20background&image_size=square_hd"]',
    description: '经典红烧牛肉面，方便美味',
    is_hot: 1,
    is_recommend: 1
  }, "name = '康师傅红烧牛肉面'");

  insertIfNotExists('products', {
    name: '蓝月亮洗衣液 500ml',
    category_id: 4,
    price: 12.80,
    original_price: 15.80,
    stock: 80,
    sales: 1250,
    main_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laundry%20detergent%20bottle%20blue%20moon%20brand%20product%20photo%20white%20background&image_size=square_hd',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laundry%20detergent%20bottle%20blue%20moon%20brand%20product%20photo%20white%20background&image_size=square_hd"]',
    description: '深层洁净，护色增艳',
    is_recommend: 1
  }, "name = '蓝月亮洗衣液 500ml'");

  insertIfNotExists('products', {
    name: '汽车玻璃水 -25℃',
    category_id: 5,
    price: 15.00,
    original_price: 20.00,
    stock: 60,
    sales: 890,
    main_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=car%20windshield%20washer%20fluid%20blue%20bottle%20product%20photo%20white%20background&image_size=square_hd',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=car%20windshield%20washer%20fluid%20blue%20bottle%20product%20photo%20white%20background&image_size=square_hd"]',
    description: '四季通用，高效清洁',
    is_recommend: 1
  }, "name = '汽车玻璃水 -25℃'");

  insertIfNotExists('gas_stations', {
    name: '易捷加油 - 朝阳路站',
    address: '北京市朝阳区朝阳路100号',
    longitude: 116.4852,
    latitude: 39.9210,
    distance: '0.5km',
    rating: 4.8,
    opening_hours: '24小时',
    services: '["便利店","洗车","休息区","充电桩"]',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20gas%20station%20with%20convenience%20store%20exterior%20photo&image_size=landscape_4_3"]'
  }, "name = '易捷加油 - 朝阳路站'");

  insertIfNotExists('gas_stations', {
    name: '易捷加油 - 建国门站',
    address: '北京市东城区建国门内大街88号',
    longitude: 116.4320,
    latitude: 39.9085,
    distance: '1.2km',
    rating: 4.9,
    opening_hours: '24小时',
    services: '["便利店","洗车","餐饮","休息区"]',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gas%20station%20with%20food%20court%20and%20store%20photo&image_size=landscape_4_3"]'
  }, "name = '易捷加油 - 建国门站'");

  insertIfNotExists('gas_stations', {
    name: '易捷加油 - 中关村站',
    address: '北京市海淀区中关村大街55号',
    longitude: 116.3050,
    latitude: 39.9820,
    distance: '2.8km',
    rating: 4.7,
    opening_hours: '06:00-24:00',
    services: '["便利店","洗车","休息区"]',
    images: '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clean%20modern%20gas%20station%20exterior%20daytime%20photo&image_size=landscape_4_3"]'
  }, "name = '易捷加油 - 中关村站'");

  insertIfNotExists('coupons', {
    name: '加油满200减20券',
    type: 'fuel',
    discount_amount: 20.00,
    min_amount: 200.00,
    valid_from: '2024-01-01',
    valid_to: '2024-12-31',
    total_count: 10000,
    used_count: 1250
  }, "name = '加油满200减20券'");

  insertIfNotExists('coupons', {
    name: '新人注册礼包券',
    type: 'general',
    discount_amount: 50.00,
    min_amount: 100.00,
    valid_from: '2024-01-01',
    valid_to: '2024-12-31',
    total_count: 5000,
    used_count: 890
  }, "name = '新人注册礼包券'");

  insertIfNotExists('articles', {
    title: '油价调整最新消息：92号汽油价格下调0.12元/升',
    summary: '今日起，国内成品油价格再次调整，92号汽油每升下调0.12元...',
    content: '<p>今日起，国内成品油价格再次调整。根据国家发改委通知，92号汽油每升下调0.12元，95号汽油每升下调0.13元，0号柴油每升下调0.12元。</p><p>此次调价后，车主加满一箱50升的92号汽油，可节省约6元。建议车主合理安排加油时间。</p>',
    cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oil%20price%20adjustment%20news%20banner%20gas%20station%20background&image_size=landscape_4_3',
    author: '易捷头条',
    view_count: 12580,
    category: 'oil_price'
  }, "title = '油价调整最新消息：92号汽油价格下调0.12元/升'");

  insertIfNotExists('articles', {
    title: '冬季汽车保养指南：这5点一定要注意',
    summary: '冬季来临，汽车保养也需要注意一些特殊事项。本文为您详解冬季用车保养要点...',
    content: '<p>冬季气温低，汽车保养需要特别注意以下几点：</p><p><strong>1. 机油更换：</strong>冬季应使用低温流动性更好的机油，建议5W-30或0W-40规格。</p><p><strong>2. 防冻液检查：</strong>确保防冻液冰点低于当地最低气温，一般两年更换一次。</p><p><strong>3. 蓄电池保养：</strong>低温会降低蓄电池容量，注意检查电压和电解液液位。</p><p><strong>4. 轮胎胎压：</strong>冬季胎压可适当调高0.1-0.2bar，提升抓地力。</p><p><strong>5. 暖风系统：</strong>入冬前检查暖风系统是否正常工作。</p>',
    cover_image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=car%20maintenance%20winter%20guide%20illustration%20automotive&image_size=landscape_4_3',
    author: '汽车养护专栏',
    view_count: 8960,
    category: 'maintenance'
  }, "title = '冬季汽车保养指南：这5点一定要注意'");

  return db;
};

module.exports = initDB;
