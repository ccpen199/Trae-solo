const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');

let db;
let SQL;

const initDatabase = async () => {
  try {
    SQL = await initSqlJs();
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    dbWrapper = createWrapper(db);
    
    createTables(dbWrapper);
    insertSeedData(dbWrapper);
    saveDatabase();
    
    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
};

const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

const valuesToObject = (columns, values) => {
  const obj = {};
  columns.forEach((col, index) => {
    obj[col] = values[index];
  });
  return obj;
};

const createWrapper = (database) => {
  return {
    exec: (sql) => {
      return database.exec(sql);
    },
    prepare: (sql) => {
      const stmt = database.prepare(sql);
      const sanitizeParams = (params) => {
        if (!params || params.length === 0) return [];
        return params.map(p => p === undefined ? null : p);
      };
      return {
        get: (...params) => {
          const cleanParams = sanitizeParams(params);
          if (cleanParams.length > 0) {
            stmt.bind(cleanParams);
          }
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.reset();
            return row;
          }
          return undefined;
        },
        all: (...params) => {
          const cleanParams = sanitizeParams(params);
          if (cleanParams.length > 0) {
            stmt.bind(cleanParams);
          }
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.reset();
          return results;
        },
        run: (...params) => {
          const cleanParams = sanitizeParams(params);
          if (cleanParams.length > 0) {
            stmt.run(cleanParams);
          } else {
            stmt.run();
          }
          const insertId = dbWrapper.lastInsertRowid();
          const changes = database.getRowsModified();
          saveDatabase();
          return { 
            lastInsertRowid: insertId, 
            changes 
          };
        }
      };
    },
    pragma: () => {},
    transaction: (fn) => {
      return function() {
        let inTransaction = true;
        database.exec('BEGIN TRANSACTION');
        try {
          const result = fn.apply(this, arguments);
          database.exec('COMMIT');
          saveDatabase();
          return result;
        } catch (e) {
          try {
            database.exec('ROLLBACK');
          } catch (rollbackErr) {
            console.warn('Rollback failed:', rollbackErr.message);
          }
          throw e;
        }
      };
    },
    lastInsertRowid: () => {
      try {
        const stmt = database.prepare('SELECT last_insert_rowid() as id');
        const result = stmt.getAsObject();
        stmt.free();
        return result.id || 0;
      } catch (e) {
        console.error('lastInsertRowid error:', e);
        return 0;
      }
    }
  };
};

let dbWrapper;

const createTables = (db) => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      is_vip INTEGER DEFAULT 0,
      vip_expire_time DATETIME,
      points INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS third_party_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      provider TEXT NOT NULL,
      open_id TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(provider, open_id)
    )`,
    `CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      email TEXT,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expire_time DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subtitle TEXT,
      category_id INTEGER,
      original_price REAL NOT NULL,
      member_price REAL,
      activity_price REAL,
      stock INTEGER DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      description TEXT,
      images TEXT,
      is_on_sale INTEGER DEFAULT 1,
      is_new INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      brand TEXT,
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )`,
    `CREATE TABLE IF NOT EXISTS product_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      spec_name TEXT,
      spec_value TEXT,
      price_adjust REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    `CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      product_id INTEGER,
      spec_id INTEGER,
      quantity INTEGER DEFAULT 1,
      selected INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (spec_id) REFERENCES product_specs(id)
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      pay_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      shipping_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      address TEXT,
      remark TEXT,
      pay_time DATETIME,
      ship_time DATETIME,
      complete_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      spec_id INTEGER,
      product_name TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    `CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      icon TEXT,
      type TEXT DEFAULT 'normal',
      sort_order INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      summary TEXT,
      content TEXT,
      author TEXT,
      category TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS content_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (content_id) REFERENCES contents(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(content_id, product_id)
    )`,
    `CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      discount_type TEXT,
      discount_value REAL,
      threshold REAL,
      start_time DATETIME,
      end_time DATETIME,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS promotion_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promotion_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      FOREIGN KEY (promotion_id) REFERENCES promotions(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(promotion_id, product_id)
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      discount_value REAL,
      min_amount REAL,
      total_count INTEGER DEFAULT 0,
      claimed_count INTEGER DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coupon_id INTEGER NOT NULL,
      status TEXT DEFAULT 'available',
      used_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crowdfunding_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      description TEXT,
      target_amount REAL NOT NULL,
      raised_amount REAL DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'active',
      creator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS crowdfunding_gears (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      limit_count INTEGER,
      claimed_count INTEGER DEFAULT 0,
      estimated_delivery TEXT,
      FOREIGN KEY (project_id) REFERENCES crowdfunding_projects(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crowdfunding_supports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      gear_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES crowdfunding_projects(id),
      FOREIGN KEY (gear_id) REFERENCES crowdfunding_gears(id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT,
      title TEXT,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      check_date DATE NOT NULL,
      points INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, check_date)
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      order_id INTEGER,
      rating INTEGER DEFAULT 5,
      content TEXT,
      images TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      role TEXT DEFAULT 'admin',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_sale ON products(is_on_sale)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id)`
  ];

  tables.forEach(sql => db.exec(sql));
};

const insertSeedData = (db) => {
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = result[0]?.values[0]?.[0] || 0;
  if (userCount > 0) return;

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('123456', 10);

  db.prepare(`
    INSERT INTO admin_users (username, password, nickname, role) 
    VALUES ('admin', ?, '管理员', 'super_admin')
  `).run(hashedPassword);

  db.prepare(`
    INSERT INTO users (phone, email, password, nickname, is_vip, points) 
    VALUES ('13800138000', 'test@163.com', ?, '测试用户', 1, 1000)
  `).run(hashedPassword);

  const categories = [
    { name: '居家生活', parent_id: 0, icon: '🏠' },
    { name: '厨房配件', parent_id: 1, icon: '🍳' },
    { name: '床上用品', parent_id: 1, icon: '🛏️' },
    { name: '服饰鞋包', parent_id: 0, icon: '👔' },
    { name: '数码家电', parent_id: 0, icon: '📱' },
    { name: '美妆个护', parent_id: 0, icon: '💄' },
    { name: '食品生鲜', parent_id: 0, icon: '🍎' },
    { name: '母婴用品', parent_id: 0, icon: '👶' },
    { name: '运动户外', parent_id: 0, icon: '⚽' },
  ];
  categories.forEach((cat, index) => {
    db.prepare('INSERT INTO categories (name, parent_id, icon, sort_order) VALUES (?, ?, ?, ?)').run(cat.name, cat.parent_id, cat.icon, index);
  });

  const channels = [
    { name: '推荐', code: 'recommend', icon: '🏠', type: 'featured' },
    { name: '新品', code: 'new', icon: '✨', type: 'normal' },
    { name: '众筹', code: 'crowdfunding', icon: '🎯', type: 'special' },
    { name: '福利社', code: 'welfare', icon: '🎁', type: 'promotion' },
    { name: '限时购', code: 'flash', icon: '⏰', type: 'promotion' },
  ];
  channels.forEach((ch, index) => {
    db.prepare('INSERT INTO channels (name, code, icon, type, sort_order) VALUES (?, ?, ?, ?, ?)').run(ch.name, ch.code, ch.icon, ch.type, index);
  });

  const products = [
    { name: '日式简约陶瓷碗套装', subtitle: '优质陶瓷，健康环保', category_id: 2, original_price: 99.9, member_price: 79.9, activity_price: 69.9, stock: 100, is_new: 1, is_hot: 1, brand: '严选良品', supplier: '景德镇陶瓷厂' },
    { name: '纯棉四件套床上用品', subtitle: '舒适透气，四季通用', category_id: 3, original_price: 299.0, member_price: 249.0, stock: 50, is_hot: 1, brand: '棉柔生活', supplier: '南通家纺' },
    { name: '无线蓝牙耳机', subtitle: '高保真音质，续航持久', category_id: 5, original_price: 399.0, member_price: 349.0, activity_price: 299.0, stock: 200, is_new: 1, is_hot: 1, brand: '音享', supplier: '深圳电子' },
    { name: '保湿补水精华液', subtitle: '深层滋养，焕发光彩', category_id: 6, original_price: 199.0, member_price: 159.0, stock: 300, brand: '美肌', supplier: '广州化妆品' },
    { name: '进口牛排套餐', subtitle: '澳洲进口，鲜嫩多汁', category_id: 7, original_price: 299.0, member_price: 259.0, activity_price: 229.0, stock: 80, is_new: 1, brand: '鲜食', supplier: '澳洲牧场' },
    { name: '婴儿纸尿裤M码', subtitle: '超薄透气，柔软舒适', category_id: 8, original_price: 129.0, member_price: 109.0, stock: 500, brand: '宝贝亲', supplier: '福建纸尿裤厂' },
    { name: '运动跑鞋', subtitle: '轻量透气，缓震舒适', category_id: 9, original_price: 499.0, member_price: 399.0, activity_price: 349.0, stock: 150, is_hot: 1, brand: '跃动', supplier: '福建鞋厂' },
    { name: '智能保温杯', subtitle: '温度显示，长效保温', category_id: 2, original_price: 159.0, member_price: 129.0, stock: 200, is_new: 1, brand: '智享', supplier: '浙江五金' },
  ];
  products.forEach(p => {
    db.prepare('INSERT INTO products (name, subtitle, category_id, original_price, member_price, activity_price, stock, sales_count, is_on_sale, is_new, is_hot, brand, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)').run(
      p.name, p.subtitle, p.category_id, p.original_price, p.member_price, p.activity_price, p.stock, p.is_new, p.is_hot, p.brand, p.supplier
    );
  });

  const contents = [
    { title: '如何选购高品质陶瓷餐具', summary: '教你辨别陶瓷餐具的好坏，让餐桌更有格调', category: '居家指南', author: '家居达人' },
    { title: '秋季护肤必备清单', summary: '干燥季节，这些护肤品让肌肤保持水润', category: '美妆推荐', author: '美妆博主' },
    { title: '运动跑鞋选购指南', summary: '不同脚型选对鞋，跑步更轻松', category: '运动课堂', author: '健身教练' },
  ];
  contents.forEach(c => {
    db.prepare('INSERT INTO contents (title, summary, category, author, content) VALUES (?, ?, ?, ?, ?)').run(c.title, c.summary, c.category, c.author, c.summary);
  });

  db.prepare('INSERT INTO content_products (content_id, product_id) VALUES (1, 1)').run();
  db.prepare('INSERT INTO content_products (content_id, product_id) VALUES (1, 8)').run();
  db.prepare('INSERT INTO content_products (content_id, product_id) VALUES (2, 4)').run();
  db.prepare('INSERT INTO content_products (content_id, product_id) VALUES (3, 7)').run();

  const promotions = [
    { name: '新品首单立减', type: 'new_product', discount_type: 'fixed', discount_value: 20, start_time: '2026-01-01 00:00:00', end_time: '2026-12-31 23:59:59' },
    { name: '会员专享折扣', type: 'member', discount_type: 'percent', discount_value: 10, start_time: '2026-01-01 00:00:00', end_time: '2026-12-31 23:59:59' },
  ];
  promotions.forEach(p => {
    db.prepare('INSERT INTO promotions (name, type, discount_type, discount_value, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)').run(
      p.name, p.type, p.discount_type, p.discount_value, p.start_time, p.end_time
    );
  });

  const coupons = [
    { name: '新人专享券', type: 'new_user', discount_value: 50, min_amount: 200, total_count: 1000 },
    { name: '满100减10', type: 'normal', discount_value: 10, min_amount: 100, total_count: 5000 },
    { name: '满300减50', type: 'normal', discount_value: 50, min_amount: 300, total_count: 2000 },
  ];
  coupons.forEach(c => {
    db.prepare('INSERT INTO coupons (name, type, discount_value, min_amount, total_count, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      c.name, c.type, c.discount_value, c.min_amount, c.total_count, '2026-01-01 00:00:00', '2026-12-31 23:59:59'
    );
  });

  const projects = [
    { title: '智能空气净化器', description: 'HEPA滤网，有效去除PM2.5', target_amount: 100000, start_time: '2026-05-01', end_time: '2026-06-30', creator: '创新科技' },
  ];
  projects.forEach(p => {
    db.prepare('INSERT INTO crowdfunding_projects (title, description, target_amount, start_time, end_time, creator) VALUES (?, ?, ?, ?, ?, ?)').run(
      p.title, p.description, p.target_amount, p.start_time, p.end_time, p.creator
    );
  });

  const gears = [
    { project_id: 1, name: '早鸟价', amount: 599, description: '包含空气净化器1台', limit_count: 100, estimated_delivery: '2026-07' },
    { project_id: 1, name: '标准价', amount: 799, description: '包含空气净化器1台+滤网1个', limit_count: 500, estimated_delivery: '2026-07' },
    { project_id: 1, name: '支持者价', amount: 999, description: '包含空气净化器1台+滤网3个', limit_count: 200, estimated_delivery: '2026-07' },
  ];
  gears.forEach(g => {
    db.prepare('INSERT INTO crowdfunding_gears (project_id, name, amount, description, limit_count, estimated_delivery) VALUES (?, ?, ?, ?, ?, ?)').run(
      g.project_id, g.name, g.amount, g.description, g.limit_count, g.estimated_delivery
    );
  });

  saveDatabase();
  console.log('种子数据插入完成');
};

const getDb = () => dbWrapper;

module.exports = {
  initDatabase,
  getDb,
  saveDatabase
};
