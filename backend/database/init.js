const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const fullDbPath = path.join(__dirname, '../../', dbPath);

let db;

try {
  db = new Database(fullDbPath);
  console.log('成功连接到SQLite数据库');
  initializeDatabase();
} catch (err) {
  console.error('数据库连接失败:', err.message);
}

function initializeDatabase() {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      level INTEGER DEFAULT 1,
      growth_points INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      is_new_user INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 短信验证码表
    CREATE TABLE IF NOT EXISTS sms_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expire_at DATETIME NOT NULL
    );

    -- 汽车品牌表
    CREATE TABLE IF NOT EXISTS car_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      initial TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 汽车车系表
    CREATE TABLE IF NOT EXISTS car_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      price_range TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES car_brands(id)
    );

    -- 汽车排量/年份表
    CREATE TABLE IF NOT EXISTS car_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      displacement TEXT NOT NULL,
      year TEXT NOT NULL,
      engine_model TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES car_series(id)
    );

    -- 具体车型表
    CREATE TABLE IF NOT EXISTS car_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spec_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT,
      transmission TEXT,
      fuel_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spec_id) REFERENCES car_specs(id)
    );

    -- 用户车辆关联表
    CREATE TABLE IF NOT EXISTS user_cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      car_model_id INTEGER NOT NULL,
      license_plate TEXT,
      mileage INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (car_model_id) REFERENCES car_models(id)
    );

    -- 商品分类表
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      parent_id INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 商品表
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      image TEXT,
      images TEXT,
      brand TEXT,
      suitable_for TEXT,
      installation_fee DECIMAL(10,2) DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- 门店表
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      business_hours TEXT,
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      rating DECIMAL(2,1) DEFAULT 5.0,
      rating_count INTEGER DEFAULT 0,
      image TEXT,
      is_factory_store INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 技师表
    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      title TEXT,
      rating DECIMAL(2,1) DEFAULT 5.0,
      rating_count INTEGER DEFAULT 0,
      service_count INTEGER DEFAULT 0,
      specialties TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    -- 订单表
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      paid_amount DECIMAL(10,2),
      discount_amount DECIMAL(10,2) DEFAULT 0,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      payment_method TEXT,
      paid_at DATETIME,
      store_id INTEGER,
      technician_id INTEGER,
      appointment_time DATETIME,
      user_car_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (technician_id) REFERENCES technicians(id),
      FOREIGN KEY (user_car_id) REFERENCES user_cars(id)
    );

    -- 订单商品表
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      installation_fee DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- 文章/帖子表
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT,
      category TEXT DEFAULT 'forum',
      tags TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_recommended INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 评论/回帖表
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT 0,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 收藏表
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, target_type, target_id)
    );

    -- 浏览记录表
    CREATE TABLE IF NOT EXISTS browse_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 签到记录表
    CREATE TABLE IF NOT EXISTS sign_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sign_date DATE NOT NULL,
      points_awarded INTEGER DEFAULT 0,
      consecutive_days INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, sign_date)
    );

    -- 会员等级配置表
    CREATE TABLE IF NOT EXISTS member_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level INTEGER NOT NULL,
      name TEXT NOT NULL,
      min_growth INTEGER NOT NULL,
      max_growth INTEGER NOT NULL,
      icon TEXT,
      discount DECIMAL(3,2) DEFAULT 1.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('数据库表初始化完成');
  seedData();
}

function seedData() {
  const brandCount = db.prepare('SELECT COUNT(*) as count FROM car_brands').get();
  if (brandCount.count === 0) {
    const brands = [
      { name: '大众', initial: 'D', logo: '', sort_order: 1 },
      { name: '丰田', initial: 'F', logo: '', sort_order: 2 },
      { name: '本田', initial: 'B', logo: '', sort_order: 3 },
      { name: '日产', initial: 'R', logo: '', sort_order: 4 },
      { name: '别克', initial: 'B', logo: '', sort_order: 5 },
      { name: '奥迪', initial: 'A', logo: '', sort_order: 6 },
      { name: '宝马', initial: 'B', logo: '', sort_order: 7 },
      { name: '奔驰', initial: 'B', logo: '', sort_order: 8 },
      { name: '现代', initial: 'X', logo: '', sort_order: 9 },
      { name: '起亚', initial: 'Q', logo: '', sort_order: 10 },
      { name: '福特', initial: 'F', logo: '', sort_order: 11 },
      { name: '雪佛兰', initial: 'X', logo: '', sort_order: 12 },
      { name: '长城', initial: 'C', logo: '', sort_order: 13 },
      { name: '吉利', initial: 'J', logo: '', sort_order: 14 },
      { name: '长安', initial: 'C', logo: '', sort_order: 15 }
    ];

    const insertBrand = db.prepare('INSERT INTO car_brands (name, initial, logo, sort_order) VALUES (?, ?, ?, ?)');
    brands.forEach(b => insertBrand.run(b.name, b.initial, b.logo, b.sort_order));

    const brandRows = db.prepare('SELECT id, name FROM car_brands').all();
    const seriesMap = {
      '大众': [
        { name: '朗逸', type: '紧凑型车', price_range: '9.99-15.89万' },
        { name: '速腾', type: '紧凑型车', price_range: '11.49-16.99万' },
        { name: '迈腾', type: '中型车', price_range: '18.69-25.39万' },
        { name: '帕萨特', type: '中型车', price_range: '17.99-25.09万' },
        { name: '途观L', type: '中型SUV', price_range: '19.87-26.08万' },
        { name: '途昂', type: '中大型SUV', price_range: '29.50-40.50万' }
      ],
      '丰田': [
        { name: '卡罗拉', type: '紧凑型车', price_range: '10.98-15.98万' },
        { name: '凯美瑞', type: '中型车', price_range: '17.98-26.98万' },
        { name: '雷凌', type: '紧凑型车', price_range: '10.78-15.28万' },
        { name: 'RAV4荣放', type: '紧凑型SUV', price_range: '17.68-26.38万' },
        { name: '汉兰达', type: '中型SUV', price_range: '26.88-34.88万' }
      ],
      '本田': [
        { name: '思域', type: '紧凑型车', price_range: '12.99-18.79万' },
        { name: '雅阁', type: '中型车', price_range: '16.98-25.88万' },
        { name: 'CR-V', type: '紧凑型SUV', price_range: '18.59-26.39万' },
        { name: '飞度', type: '小型车', price_range: '8.18-10.88万' },
        { name: '缤智', type: '小型SUV', price_range: '12.78-17.68万' }
      ]
    };

    const insertSeries = db.prepare('INSERT INTO car_series (brand_id, name, type, price_range) VALUES (?, ?, ?, ?)');
    brandRows.forEach(brand => {
      if (seriesMap[brand.name]) {
        seriesMap[brand.name].forEach(s => {
          insertSeries.run(brand.id, s.name, s.type, s.price_range);
        });
      }
    });

    const seriesRows = db.prepare('SELECT id, name FROM car_series').all();
    const insertSpec = db.prepare('INSERT INTO car_specs (series_id, displacement, year, engine_model) VALUES (?, ?, ?, ?)');
    
    seriesRows.forEach(series => {
      const specs = [
        { displacement: '1.4T', year: '2024款', engine_model: 'EA211' },
        { displacement: '1.5L', year: '2024款', engine_model: 'EA211' },
        { displacement: '2.0T', year: '2024款', engine_model: 'EA888' },
        { displacement: '1.4T', year: '2023款', engine_model: 'EA211' },
        { displacement: '1.5L', year: '2023款', engine_model: 'EA211' }
      ];
      
      specs.forEach(s => {
        insertSpec.run(series.id, s.displacement, s.year, s.engine_model);
      });
    });

    const specRows = db.prepare('SELECT id, displacement, year FROM car_specs').all();
    const insertModel = db.prepare('INSERT INTO car_models (spec_id, name, full_name, transmission, fuel_type) VALUES (?, ?, ?, ?, ?)');
    
    specRows.forEach(spec => {
      const models = [
        { name: '舒适版', transmission: '双离合', fuel_type: '汽油' },
        { name: '豪华版', transmission: 'AT', fuel_type: '汽油' },
        { name: '旗舰版', transmission: 'CVT', fuel_type: '汽油' }
      ];
      
      models.forEach(m => {
        const fullName = `${spec.year} ${spec.displacement} ${m.name}`;
        insertModel.run(spec.id, m.name, fullName, m.transmission, m.fuel_type);
      });
    });
    
    console.log('汽车数据初始化完成');
  }

  const levelCount = db.prepare('SELECT COUNT(*) as count FROM member_levels').get();
  if (levelCount.count === 0) {
    const levels = [
      { level: 1, name: '青铜会员', min_growth: 0, max_growth: 999, discount: 1.00 },
      { level: 2, name: '白银会员', min_growth: 1000, max_growth: 2999, discount: 0.98 },
      { level: 3, name: '黄金会员', min_growth: 3000, max_growth: 4999, discount: 0.95 },
      { level: 4, name: '铂金会员', min_growth: 5000, max_growth: 9999, discount: 0.92 },
      { level: 5, name: '钻石会员', min_growth: 10000, max_growth: 999999, discount: 0.88 }
    ];

    const insertLevel = db.prepare('INSERT INTO member_levels (level, name, min_growth, max_growth, discount) VALUES (?, ?, ?, ?, ?)');
    levels.forEach(l => insertLevel.run(l.level, l.name, l.min_growth, l.max_growth, l.discount));
    console.log('会员等级数据初始化完成');
  }

  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get();
  if (storeCount.count === 0) {
    const stores = [
      { name: '途虎养车工厂店(北京朝阳店)', address: '北京市朝阳区建国路88号SOHO现代城', phone: '400-111-8866', business_hours: '8:00-22:00', rating: 4.8, rating_count: 2568, is_factory_store: 1 },
      { name: '途虎养车工厂店(北京海淀店)', address: '北京市海淀区中关村大街1号', phone: '400-111-8867', business_hours: '8:00-22:00', rating: 4.9, rating_count: 3125, is_factory_store: 1 },
      { name: '途虎养车工厂店(上海浦东店)', address: '上海市浦东新区陆家嘴环路1000号', phone: '400-111-8868', business_hours: '8:00-22:00', rating: 4.7, rating_count: 1896, is_factory_store: 1 },
      { name: '途虎养车工厂店(上海静安店)', address: '上海市静安区南京西路1266号', phone: '400-111-8869', business_hours: '8:00-22:00', rating: 4.9, rating_count: 2785, is_factory_store: 1 },
      { name: '途虎养车工厂店(广州天河店)', address: '广州市天河区天河路385号', phone: '400-111-8870', business_hours: '8:00-22:00', rating: 4.8, rating_count: 2245, is_factory_store: 1 }
    ];

    const insertStore = db.prepare('INSERT INTO stores (name, address, phone, business_hours, rating, rating_count, is_factory_store, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)');
    stores.forEach(s => insertStore.run(s.name, s.address, s.phone, s.business_hours, s.rating, s.rating_count, s.is_factory_store));

    const storeRows = db.prepare('SELECT id FROM stores').all();
    if (storeRows.length > 0) {
      const technicians = [
        { name: '张师傅', title: '高级技师', rating: 4.9, rating_count: 568, service_count: 3256, specialties: '机油更换,轮胎更换,刹车系统' },
        { name: '李师傅', title: '资深技师', rating: 4.8, rating_count: 425, service_count: 2896, specialties: '发动机保养,空调系统,电路检测' },
        { name: '王师傅', title: '技师', rating: 4.7, rating_count: 356, service_count: 2156, specialties: '轮胎动平衡,四轮定位,小保养' }
      ];

      const insertTech = db.prepare('INSERT INTO technicians (store_id, name, title, rating, rating_count, service_count, specialties, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)');
      storeRows.forEach(store => {
        technicians.forEach(t => {
          insertTech.run(store.id, t.name, t.title, t.rating, t.rating_count, t.service_count, t.specialties);
        });
      });
      console.log('门店和技师数据初始化完成');
    }
  }

  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count === 0) {
    const categories = [
      { name: '机油', icon: '', sort_order: 1 },
      { name: '轮胎', icon: '', sort_order: 2 },
      { name: '刹车片', icon: '', sort_order: 3 },
      { name: '空调滤芯', icon: '', sort_order: 4 },
      { name: '空气滤芯', icon: '', sort_order: 5 },
      { name: '火花塞', icon: '', sort_order: 6 },
      { name: '蓄电池', icon: '', sort_order: 7 },
      { name: '雨刷', icon: '', sort_order: 8 }
    ];

    const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
    categories.forEach(c => insertCat.run(c.name, c.icon, c.sort_order));

    const products = [
      { 
        category: '机油',
        name: '美孚1号 全合成机油 0W-40 SN级 4L',
        description: '美孚1号 0W-40 是先进的全合成发动机油，能为引擎提供卓越的保护。',
        price: 399.00,
        original_price: 499.00,
        brand: '美孚',
        installation_fee: 50.00,
        sales: 5689
      },
      { 
        category: '机油',
        name: '壳牌 超凡喜力 全合成机油 5W-40 SN级 4L',
        description: '壳牌超凡喜力采用独特的动力清洁分散技术，有效防止油泥和积碳生成。',
        price: 368.00,
        original_price: 428.00,
        brand: '壳牌',
        installation_fee: 50.00,
        sales: 4256
      },
      { 
        category: '轮胎',
        name: '米其林轮胎 PRIMACY 4 215/55R17 94V',
        description: '米其林浩悦4代，静音舒适，湿地抓地力出色。',
        price: 899.00,
        original_price: 1099.00,
        brand: '米其林',
        installation_fee: 30.00,
        sales: 3568
      },
      { 
        category: '轮胎',
        name: '德国马牌轮胎 UC6 225/50R17 94W',
        description: '德国马牌UC6，均衡性能，操控与舒适兼具。',
        price: 799.00,
        original_price: 999.00,
        brand: '马牌',
        installation_fee: 30.00,
        sales: 2896
      },
      { 
        category: '刹车片',
        name: '博世 刹车片前片 0986AB1185 适用于大众速腾/迈腾',
        description: '博世刹车片，低噪音，少粉尘，制动性能卓越。',
        price: 298.00,
        original_price: 398.00,
        brand: '博世',
        installation_fee: 80.00,
        sales: 1856
      },
      { 
        category: '空调滤芯',
        name: '曼牌滤清器 空调滤芯 CUK26009 适用大众奥迪',
        description: '曼牌活性炭空调滤芯，有效过滤PM2.5，去除异味。',
        price: 99.00,
        original_price: 129.00,
        brand: '曼牌',
        installation_fee: 20.00,
        sales: 4568
      }
    ];

    const insertProd = db.prepare(`INSERT INTO products (name, category_id, description, price, original_price, brand, installation_fee, sales, stock, status) 
      VALUES (?, (SELECT id FROM categories WHERE name = ?), ?, ?, ?, ?, ?, ?, 100, 1)`);
    
    products.forEach(p => {
      insertProd.run(p.name, p.category, p.description, p.price, p.original_price, p.brand, p.installation_fee, p.sales);
    });
    console.log('商品数据初始化完成');
  }

  const artCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
  if (artCount.count === 0) {
    const articles = [
      {
        title: '汽车保养小常识：机油多久更换一次？',
        content: '很多车主都知道机油需要定期更换，但具体多久更换一次呢？其实，机油的更换周期取决于多个因素。',
        category: 'knowledge',
        tags: '保养,机油,汽车知识',
        is_recommended: 1,
        view_count: 12568,
        like_count: 568
      },
      {
        title: '冬天来了，汽车轮胎胎压应该调到多少？',
        content: '随着气温下降，很多车主开始关注轮胎胎压的问题。那么冬天胎压应该调多少呢？',
        category: 'knowledge',
        tags: '轮胎,胎压,冬季用车',
        is_recommended: 1,
        view_count: 8956,
        like_count: 425
      },
      {
        title: '求助：我的大众朗逸烧机油怎么办？',
        content: '大家好，我的车是2018款大众朗逸1.4T，现在跑了5万多公里，最近发现机油消耗有点快。',
        category: 'forum',
        tags: '朗逸,烧机油,求助',
        is_recommended: 0,
        view_count: 3256,
        like_count: 56
      }
    ];

    const insertArt = db.prepare('INSERT INTO articles (user_id, title, content, category, tags, is_recommended, view_count, like_count, status) VALUES (1, ?, ?, ?, ?, ?, ?, ?, 1)');
    
    articles.forEach(a => {
      insertArt.run(a.title, a.content, a.category, a.tags, a.is_recommended, a.view_count, a.like_count);
    });
    console.log('文章数据初始化完成');
  }
}

module.exports = db;
