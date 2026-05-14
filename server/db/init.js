const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function initDatabase() {
  const dbPath = path.join(__dirname, '..', '..', 'data', 'app.sqlite');
  const dataDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      email TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      parent_id INTEGER DEFAULT 0,
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      cover_image TEXT,
      images TEXT,
      category_id INTEGER,
      shop_id INTEGER DEFAULT 1,
      shop_name TEXT DEFAULT '官方旗舰店',
      status INTEGER DEFAULT 1,
      is_recommend INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS product_skus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      specs TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS product_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sku_id INTEGER,
      quantity INTEGER DEFAULT 1,
      selected INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      pay_amount REAL NOT NULL,
      status INTEGER DEFAULT 0,
      address TEXT,
      phone TEXT,
      receiver TEXT,
      remark TEXT,
      pay_time DATETIME,
      ship_time DATETIME,
      complete_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sku_id INTEGER,
      product_title TEXT,
      product_image TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      cover_image TEXT,
      images TEXT,
      video_url TEXT,
      type TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      product_ids TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS content_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES contents(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_id INTEGER,
      type TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      order_id INTEGER,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      shop_id INTEGER DEFAULT 1,
      last_message TEXT,
      last_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      unread_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, shop_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      keyword TEXT NOT NULL,
      search_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_search_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      link TEXT,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  tables.forEach(sql => db.exec(sql));
  
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password, nickname) VALUES (?, ?, ?)')
      .run('admin', hash, '管理员');
  }
  
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)');
    const categories = [
      ['手机数码', '📱', 1],
      ['服装鞋包', '👗', 2],
      ['美妆个护', '💄', 3],
      ['家居生活', '🏠', 4],
      ['食品生鲜', '🍎', 5],
      ['母婴用品', '👶', 6],
      ['运动户外', '⚽', 7],
      ['图书文具', '📚', 8]
    ];
    categories.forEach(([name, icon, sort]) => insertCategory.run(name, icon, sort));
  }
  
  const channelCount = db.prepare('SELECT COUNT(*) as count FROM channels').get();
  if (channelCount.count === 0) {
    const insertChannel = db.prepare('INSERT INTO channels (name, icon, link, sort) VALUES (?, ?, ?, ?)');
    const channels = [
      ['充值中心', '💰', '/recharge', 1],
      ['天猫超市', '🛒', '/supermarket', 2],
      ['淘宝直播', '📺', '/live', 3],
      ['聚划算', '🔥', '/juhuasuan', 4],
      ['百亿补贴', '💎', '/subsidy', 5],
      ['有好货', '🎁', '/good-stuff', 6],
      ['天天特卖', '⚡', '/sale', 7],
      ['阿里健康', '🏥', '/health', 8]
    ];
    channels.forEach(([name, icon, link, sort]) => insertChannel.run(name, icon, link, sort));
  }
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);
    const insertUser = db.prepare('INSERT INTO users (username, password, nickname, avatar) VALUES (?, ?, ?, ?)');
    insertUser.run('user1', hash, '用户小明', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1');
    insertUser.run('user2', hash, '用户小红', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2');
  }
  
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (title, description, price, original_price, stock, cover_image, category_id, is_recommend)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const products = [
      ['iPhone 15 Pro Max 256GB 原色钛金属', 'Apple A17 Pro芯片，钛金属设计，专业级摄影系统', 9999, 10999, 100, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 1, 1],
      ['华为 Mate 60 Pro 512GB 雅丹黑', '麒麟9000S芯片，卫星通话，超可靠玄武架构', 6999, 7999, 80, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 1, 1],
      ['夏季新款女士连衣裙 法式优雅', '优质面料，舒适透气，多色可选', 199, 399, 200, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 2, 1],
      ['男士休闲运动鞋 透气网面', '轻便舒适，缓震效果好，百搭款', 299, 499, 150, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 2, 1],
      ['兰蔻小黑瓶精华肌底液 50ml', '修护肌底，焕活肌肤，提升吸收力', 1080, 1280, 50, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400', 3, 1],
      ['雅诗兰黛小棕瓶眼霜 15ml', '淡化细纹，紧致眼周，改善黑眼圈', 590, 690, 60, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', 3, 1],
      ['北欧简约实木餐桌 1.4米', '天然实木，环保油漆，稳固耐用', 1299, 1999, 30, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400', 4, 1],
      ['智能扫地机器人 激光导航', '智能规划，深度清洁，APP控制', 1999, 2499, 40, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 4, 1],
      ['进口车厘子 2J级 2斤装', '智利进口，新鲜直达，果肉饱满', 99, 159, 100, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400', 5, 1],
      ['新疆阿克苏冰糖心苹果 5斤', '脆甜多汁，糖心十足，产地直发', 39.9, 59.9, 200, 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400', 5, 1],
      ['花王纸尿裤 新生儿NB码 90片', '轻薄透气，柔软舒适，瞬吸干爽', 129, 169, 80, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 6, 1],
      ['婴儿推车 轻便折叠 高景观', '一键折叠，双向推行，避震设计', 899, 1299, 25, 'https://images.unsplash.com/photo-1586280268958-9483002d016a?w=400', 6, 1],
      ['Nike 耐克 Air Max 运动跑鞋', '气垫缓震，网面透气，潮流配色', 799, 999, 60, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', 7, 1],
      ['迪卡侬 户外帐篷 3-4人', '防水防晒，快速搭建，便携收纳', 399, 599, 35, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400', 7, 1],
      ['三体全集 刘慈欣科幻小说', '雨果奖获奖作品，中国科幻里程碑', 99, 149, 300, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', 8, 1],
      ['晨光中性笔 黑色 12支装', '书写流畅，字迹清晰，经久耐用', 19.9, 29.9, 500, 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400', 8, 1]
    ];
    
    products.forEach(([title, description, price, originalPrice, stock, coverImage, categoryId, isRecommend]) => {
      insertProduct.run(title, description, price, originalPrice, stock, coverImage, categoryId, isRecommend);
    });
  }
  
  const contentCount = db.prepare('SELECT COUNT(*) as count FROM contents').get();
  if (contentCount.count === 0) {
    const insertContent = db.prepare(`
      INSERT INTO contents (user_id, title, content, cover_image, type, product_ids)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const contents = [
      [1, '夏日穿搭分享 | 这几件也太好看了吧！', '姐妹们！今天给大家分享几套超级好看的夏日穿搭，每一件都让我爱不释手～ 无论是约会、上班还是逛街都超合适！', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', 'article', '3,4'],
      [1, '护肤干货 | 敏感肌必看的修复指南', '作为一个资深敏感肌，今天来跟大家分享一下我的护肤心得。这些产品真的救了我的烂脸！', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'article', '5,6'],
      [2, '开箱vlog | 新入手的数码好物', '哈喽大家好！今天来开箱我期待已久的新手机，一起来看看吧～', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400', 'video', '1,2'],
      [2, '家居改造 | 500元打造ins风小窝', '租房党看过来！只用500块钱，就能让你的出租屋焕然一新～', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', 'article', '7,8'],
      [1, '美食探店 | 这家店的车厘子也太绝了', '今天发现一家宝藏水果店，他们家的车厘子真的绝绝子！又大又甜还很新鲜～', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400', 'article', '9,10']
    ];
    
    contents.forEach(([userId, title, content, coverImage, type, productIds]) => {
      insertContent.run(userId, title, content, coverImage, type, productIds);
    });
  }
  
  return db;
}

module.exports = initDatabase;
