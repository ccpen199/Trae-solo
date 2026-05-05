const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT,
    nickname TEXT,
    avatar TEXT,
    is_vip INTEGER DEFAULT 0,
    vip_expire_at DATETIME,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 验证码表
db.exec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )
`);

// 商品分类表
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 商品表
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    vip_price REAL,
    original_price REAL,
    image TEXT,
    category_id INTEGER,
    stock INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_seckill INTEGER DEFAULT 0,
    seckill_price REAL,
    seckill_start_time DATETIME,
    seckill_end_time DATETIME,
    unit TEXT DEFAULT '份',
    spec TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )
`);

// 购物车表
db.exec(`
  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    selected INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(user_id, product_id)
  )
`);

// 收货地址表
db.exec(`
  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT,
    city TEXT NOT NULL,
    district TEXT,
    address TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// 订单表
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    address_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    pay_amount REAL NOT NULL,
    status INTEGER DEFAULT 0,
    pay_time DATETIME,
    delivery_time DATETIME,
    complete_time DATETIME,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
  )
`);

// 订单商品表
db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

// Banner表
db.exec(`
  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    image TEXT NOT NULL,
    link_url TEXT,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 活动标签表
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#FF4D4F',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 搜索历史表
db.exec(`
  CREATE TABLE IF NOT EXISTS search_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    keyword TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// 热门搜索表
db.exec(`
  CREATE TABLE IF NOT EXISTS hot_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    search_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 城市表
db.exec(`
  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    province TEXT,
    latitude REAL,
    longitude REAL,
    is_hot INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 检查是否已有数据，避免重复初始化
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

if (categoryCount === 0) {
  // 插入分类数据
  const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
  
  const categories = [
    ['时令水果', '🍎', 1],
    ['新鲜蔬菜', '🥬', 2],
    ['肉禽蛋品', '🥩', 3],
    ['海鲜水产', '🦐', 4],
    ['乳品烘焙', '🥛', 5],
    ['休闲零食', '🍪', 6],
    ['酒水饮料', '🍺', 7],
    ['粮油调味', '🍚', 8],
    ['日用百货', '🧴', 9],
    ['母婴用品', '👶', 10]
  ];
  
  categories.forEach(([name, icon, sort_order]) => {
    insertCategory.run(name, icon, sort_order);
  });

  // 插入商品数据
  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, vip_price, original_price, image, category_id, stock, sales, is_hot, unit, spec)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['山东红富士苹果', '新鲜采摘，脆甜多汁', 12.9, 9.9, 15.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20fuji%20apple%20fresh%20fruit%20close%20up&image_size=square', 1, 100, 256, 1, '份', '约500g'],
    ['丹东草莓', '九九草莓，香甜可口', 29.9, 24.9, 35.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20strawberries%20red%20juicy%20close%20up&image_size=square', 1, 50, 189, 1, '盒', '约300g'],
    ['进口车厘子', '智利进口，果肉饱满', 68.0, 58.0, 88.0, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cherries%20imported%20red%20fresh%20close%20up&image_size=square', 1, 30, 123, 1, '盒', '约250g'],
    ['有机生菜', '有机种植，新鲜脆嫩', 6.9, 5.9, 8.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20organic%20lettuce%20green%20vegetable&image_size=square', 2, 80, 345, 0, '份', '约300g'],
    ['西红柿', '自然成熟，酸甜可口', 4.9, 3.9, 6.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20red%20tomatoes%20vegetable%20close%20up&image_size=square', 2, 120, 567, 1, '份', '约500g'],
    ['胡萝卜', '新鲜采摘，营养丰富', 3.9, 2.9, 5.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20carrots%20orange%20vegetable%20close%20up&image_size=square', 2, 100, 234, 0, '份', '约500g'],
    ['新鲜五花肉', '农家散养，肥瘦相间', 28.9, 25.9, 35.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20pork%20belly%20meat%20raw%20close%20up&image_size=square', 3, 60, 456, 1, '份', '约500g'],
    ['土鸡蛋', '农家散养，营养丰富', 15.9, 12.9, 19.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20brown%20eggs%20organic%20farm&image_size=square', 3, 200, 876, 1, '盒', '10枚'],
    ['鸡胸肉', '低脂高蛋白，健身首选', 19.9, 16.9, 25.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20chicken%20breast%20raw%20meat&image_size=square', 3, 80, 345, 0, '份', '约400g'],
    ['鲜活小龙虾', '清水养殖，肉质鲜嫩', 39.9, 35.9, 49.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20live%20crayfish%20seafood%20close%20up&image_size=square', 4, 0, 567, 1, '斤', '约500g'],
    ['进口三文鱼', '挪威进口，新鲜刺身', 88.0, 78.0, 108.0, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20salmon%20sashimi%20fish%20close%20up&image_size=square', 4, 20, 123, 1, '份', '约200g'],
    ['大闸蟹', '阳澄湖大闸蟹，膏满黄肥', 128.0, 118.0, 158.0, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20chinese%20mitten%20crab%20seafood&image_size=square', 4, 0, 89, 1, '只', '约150g'],
    ['纯牛奶', '营养丰富，新鲜直达', 6.9, 5.9, 8.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20milk%20carton%20dairy%20product&image_size=square', 5, 150, 1234, 1, '盒', '250ml'],
    ['原味酸奶', '益生菌发酵，酸甜可口', 8.9, 7.9, 11.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20yogurt%20dairy%20product%20white&image_size=square', 5, 100, 567, 0, '盒', '200g'],
    ['吐司面包', '松软可口，早餐必备', 12.9, 10.9, 15.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20toast%20bread%20slices%20bakery&image_size=square', 5, 80, 345, 0, '袋', '400g'],
    ['薯片', '香脆可口，休闲零食', 9.9, 8.9, 12.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=potato%20chips%20crispy%20snack%20yellow&image_size=square', 6, 120, 789, 0, '袋', '100g'],
    ['坚果礼盒', '多种坚果，营养丰富', 59.9, 49.9, 79.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=assorted%20nuts%20gift%20box%20snack&image_size=square', 6, 50, 234, 1, '盒', '500g'],
    ['巧克力', '丝滑口感，甜蜜美味', 29.9, 25.9, 39.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20chocolate%20bars%20sweet%20dessert&image_size=square', 6, 60, 456, 0, '盒', '100g'],
    ['青岛啤酒', '经典口感，清爽解渴', 5.9, 4.9, 7.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beer%20bottle%20green%20alcohol%20drink&image_size=square', 7, 200, 1567, 1, '瓶', '500ml'],
    ['鲜榨橙汁', '新鲜榨取，维C丰富', 12.9, 10.9, 15.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20orange%20juice%20glass%20drink&image_size=square', 7, 80, 345, 0, '瓶', '300ml'],
    ['矿泉水', '天然矿泉水，纯净健康', 2.9, 2.5, 3.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mineral%20water%20bottle%20clear%20drink&image_size=square', 7, 300, 2345, 0, '瓶', '500ml'],
    ['东北大米', '东北优质大米，香软可口', 39.9, 35.9, 49.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20rice%20grains%20food%20close%20up&image_size=square', 8, 100, 678, 1, '袋', '5kg'],
    ['金龙鱼调和油', '营养均衡，健康食用油', 69.9, 65.9, 89.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20oil%20bottle%20yellow%20kitchen&image_size=square', 8, 80, 345, 0, '桶', '5L'],
    ['生抽酱油', '酿造酱油，提鲜增味', 15.9, 13.9, 19.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soy%20sauce%20bottle%20brown%20kitchen&image_size=square', 8, 120, 567, 0, '瓶', '500ml'],
    ['洗洁精', '去油去污，温和护手', 9.9, 8.9, 12.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dish%20soap%20bottle%20green%20cleaning&image_size=square', 9, 150, 789, 0, '瓶', '1L'],
    ['卫生纸', '柔软舒适，家庭装', 29.9, 25.9, 35.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=toilet%20paper%20rolls%20white%20soft&image_size=square', 9, 200, 1234, 1, '提', '10卷'],
    ['洗衣液', '深层洁净，护色护衣', 35.9, 32.9, 45.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laundry%20detergent%20bottle%20blue%20cleaning&image_size=square', 9, 100, 456, 0, '瓶', '2L'],
    ['婴儿奶粉', '营养配方，健康成长', 268.0, 238.0, 298.0, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20milk%20powder%20can%20infant&image_size=square', 10, 30, 123, 1, '罐', '900g'],
    ['尿不湿', '超薄透气，干爽舒适', 89.0, 79.0, 109.0, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20diaper%20package%20infant%20care&image_size=square', 10, 50, 234, 0, '包', '50片'],
    ['婴儿湿巾', '温和清洁，无酒精', 19.9, 16.9, 25.9, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20wet%20wipes%20package%20infant&image_size=square', 10, 80, 345, 0, '包', '80片']
  ];

  products.forEach(([name, description, price, vipPrice, originalPrice, image, categoryId, stock, sales, isHot, unit, spec]) => {
    insertProduct.run(name, description, price, vipPrice, originalPrice, image, categoryId, stock, sales, isHot, unit, spec);
  });

  // 插入Banner数据
  const insertBanner = db.prepare('INSERT INTO banners (title, image, link_url, sort_order) VALUES (?, ?, ?, ?)');
  
  const banners = [
    ['新人专享', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grocery%20delivery%20app%20banner%20new%20user%20promotion%20fresh%20vegetables%20fruits%20orange%20green%20colors&image_size=landscape_16_9', '/activity/new', 1],
    ['每日秒杀', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flash%20sale%20banner%20red%20hot%20discount%20fresh%20food%20timer%20countdown&image_size=landscape_16_9', '/activity/seckill', 2],
    ['会员专享', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vip%20member%20exclusive%20banner%20golden%20premium%20fresh%20food%20delivery&image_size=landscape_16_9', '/member', 3],
    ['满减活动', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sale%20promotion%20banner%20discount%20coupon%20fresh%20grocery%20shopping&image_size=landscape_16_9', '/activity/promo', 4],
    ['时令水果', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=seasonal%20fresh%20fruits%20banner%20colorful%20apples%20strawberries%20healthy&image_size=landscape_16_9', '/category/1', 5],
    ['新鲜蔬菜', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fresh%20vegetables%20banner%20green%20healthy%20organic%20farm%20produce&image_size=landscape_16_9', '/category/2', 6]
  ];
  
  banners.forEach(([title, image, linkUrl, sortOrder]) => {
    insertBanner.run(title, image, linkUrl, sortOrder);
  });

  // 插入活动标签
  const insertTag = db.prepare('INSERT INTO activity_tags (name, color, sort_order) VALUES (?, ?, ?)');
  
  const tags = [
    ['限时特惠', '#FF4D4F', 1],
    ['新人专享', '#1890FF', 2],
    ['买一送一', '#FA8C16', 3],
    ['会员专享', '#FAAD14', 4],
    ['热销爆款', '#F5222D', 5]
  ];
  
  tags.forEach(([name, color, sortOrder]) => {
    insertTag.run(name, color, sortOrder);
  });

  // 插入热门搜索
  const insertHotSearch = db.prepare('INSERT INTO hot_searches (keyword, search_count, sort_order) VALUES (?, ?, ?)');
  
  const hotSearches = [
    ['草莓', 1256, 1],
    ['牛奶', 987, 2],
    ['西瓜', 876, 3],
    ['小龙虾', 765, 4],
    ['苹果', 654, 5],
    ['鸡蛋', 543, 6],
    ['猪肉', 432, 7],
    ['青菜', 321, 8]
  ];
  
  hotSearches.forEach(([keyword, searchCount, sortOrder]) => {
    insertHotSearch.run(keyword, searchCount, sortOrder);
  });

  // 插入城市数据
  const insertCity = db.prepare('INSERT INTO cities (name, province, latitude, longitude, is_hot) VALUES (?, ?, ?, ?, ?)');
  
  const cities = [
    ['北京', '北京市', 39.9042, 116.4074, 1],
    ['上海', '上海市', 31.2304, 121.4737, 1],
    ['广州', '广东省', 23.1291, 113.2644, 1],
    ['深圳', '广东省', 22.5431, 114.0579, 1],
    ['杭州', '浙江省', 30.2741, 120.1551, 1],
    ['南京', '江苏省', 32.0603, 118.7969, 0],
    ['成都', '四川省', 30.5728, 104.0668, 1],
    ['武汉', '湖北省', 30.5928, 114.3055, 0],
    ['西安', '陕西省', 34.3416, 108.9398, 0],
    ['重庆', '重庆市', 29.4316, 106.9123, 1]
  ];
  
  cities.forEach(([name, province, latitude, longitude, isHot]) => {
    insertCity.run(name, province, latitude, longitude, isHot);
  });
}

console.log('数据库初始化完成');

module.exports = db;
