const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db;

function init() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const configuredPath = process.env.DATABASE_URL || process.env.DATABASE_PATH || './data/app.sqlite';
  const dbPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(projectRoot, configuredPath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  createTables();
  migrateSchema();
  seedData();
  console.log(`SQLite database ready: ${dbPath}`);
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'personal',
      phone TEXT,
      address TEXT,
      real_name TEXT,
      company_name TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      image TEXT,
      is_limited INTEGER DEFAULT 0,
      serial_number TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      sender TEXT,
      receiver TEXT,
      receiver_address TEXT,
      receiver_phone TEXT,
      status TEXT DEFAULT 'pending',
      current_location TEXT,
      weight REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS package_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_phone TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      status TEXT DEFAULT 'active',
      auto_renew INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS address_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      old_address TEXT NOT NULL,
      new_address TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      related_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS digital_stamps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stamp_code TEXT UNIQUE NOT NULL,
      design TEXT,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS nft_collectibles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      token_id TEXT UNIQUE,
      image TEXT,
      status TEXT DEFAULT 'minted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      reviewer_id INTEGER,
      status TEXT DEFAULT 'pending',
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS post_outlets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT,
      phone TEXT,
      business_hours TEXT,
      delivery_area TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      image TEXT,
      link TEXT,
      status TEXT DEFAULT 'active',
      clicks INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
}

function migrateSchema() {
  const hasTable = (tableName) => {
    return Boolean(db.prepare(`
      SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?
    `).get(tableName));
  };

  const hasColumn = (tableName, columnName) => {
    if (!hasTable(tableName)) return false;
    return db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName);
  };

  const ensureColumn = (tableName, columnName, definition) => {
    if (!hasColumn(tableName, columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
  };

  ensureColumn('packages', 'sender', 'TEXT');
  ensureColumn('packages', 'receiver', 'TEXT');
  ensureColumn('packages', 'receiver_address', 'TEXT');
  ensureColumn('packages', 'receiver_phone', 'TEXT');
  ensureColumn('packages', 'current_location', 'TEXT');
  ensureColumn('packages', 'weight', 'REAL');
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, type, real_name, company_name, phone, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run('admin', 'admin@chinapost.gov.cn', bcrypt.hashSync('admin123', 10), 'enterprise', '系统管理员', '中国邮政集团有限公司', '010-11185', '北京市西城区金融街甲3号', 'active');
    stmt.run('user1', 'user1@example.com', bcrypt.hashSync('123456', 10), 'personal', '张三', null, '13800138001', '北京市西城区金融街1号', 'active');
    stmt.run('enterprise1', 'ent1@company.com', bcrypt.hashSync('123456', 10), 'enterprise', '李经理', '华夏科技有限公司', '13900139001', '上海市浦东新区陆家嘴100号', 'active');
    stmt.run('user2', 'user2@example.com', bcrypt.hashSync('123456', 10), 'personal', '王五', null, '13700137001', '广州市天河区珠江新城', 'active');
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const products = [
      { name: '2024龙年生肖邮票', category: 'stamp', description: '龙年生肖纪念邮票一套，含小版张、大版张、小型张', price: 128, stock: 800, is_limited: 1 },
      { name: '2023兔年生肖邮票', category: 'stamp', description: '兔年生肖纪念邮票精装套票', price: 98, stock: 1200, is_limited: 1 },
      { name: '长城主题特种邮票', category: 'stamp', description: '万里长城主题特种邮票，全景展示长城壮美', price: 68, stock: 2000, is_limited: 0 },
      { name: '航天成就纪念邮票', category: 'stamp', description: '中国航天事业成就纪念邮票全套', price: 158, stock: 500, is_limited: 1 },
      { name: '名画珍品邮票系列', category: 'stamp', description: '故宫珍藏名画系列邮票，含清明上河图等', price: 288, stock: 300, is_limited: 1 },
      { name: '花卉主题邮票册', category: 'stamp', description: '四季花卉主题邮票珍藏册', price: 78, stock: 3000, is_limited: 0 },
      { name: '人民日报年度订阅', category: 'newspaper', description: '人民日报全年订阅，每日投递到户', price: 360, stock: 9999, is_limited: 0 },
      { name: '光明日报年度订阅', category: 'newspaper', description: '光明日报全年订阅，知识分子的日报', price: 300, stock: 9999, is_limited: 0 },
      { name: '经济日报年度订阅', category: 'newspaper', description: '经济日报全年订阅，财经资讯首选', price: 280, stock: 9999, is_limited: 0 },
      { name: '参考消息年度订阅', category: 'newspaper', description: '参考消息全年订阅，环球资讯总汇', price: 320, stock: 9999, is_limited: 0 },
      { name: '中国邮政明信片套装', category: 'postcard', description: '经典风景明信片10张套装', price: 25, stock: 5000, is_limited: 0 },
      { name: '故宫主题明信片', category: 'postcard', description: '故宫博物院联名明信片，8张/套', price: 38, stock: 2000, is_limited: 0 },
      { name: '节日祝福贺卡套装', category: 'postcard', description: '春节/中秋/圣诞节日贺卡6张/套', price: 18, stock: 8000, is_limited: 0 },
      { name: '限量版纪念封', category: 'postcard', description: '重大事件限量纪念封，带编号和邮戳', price: 58, stock: 500, is_limited: 1 },
      { name: '定制文创邮册', category: 'culture', description: '个性化定制邮票收藏册，含专属页面设计', price: 298, stock: 400, is_limited: 1 },
      { name: '邮政文化丝巾', category: 'culture', description: '中国邮政联名文化丝巾，真丝材质', price: 199, stock: 600, is_limited: 1 },
      { name: '邮票主题书签套装', category: 'culture', description: '经典邮票图案书签5枚套装，黄铜材质', price: 48, stock: 3000, is_limited: 0 },
      { name: '邮政绿帆布包', category: 'culture', description: '中国邮政经典绿色帆布手提袋', price: 68, stock: 2000, is_limited: 0 },
      { name: '集邮爱好者杂志', category: 'magazine', description: '《集邮》杂志全年订阅，月刊', price: 180, stock: 9999, is_limited: 0 },
      { name: '中国集邮杂志', category: 'magazine', description: '《中国集邮》杂志全年订阅，月刊', price: 156, stock: 9999, is_limited: 0 },
      { name: '国家地理杂志年度订阅', category: 'magazine', description: '国家地理杂志中文版全年12期', price: 240, stock: 9999, is_limited: 0 },
      { name: '读者杂志年度订阅', category: 'magazine', description: '读者杂志全年24期订阅', price: 120, stock: 9999, is_limited: 0 },
    ];
    
    const stmt = db.prepare(`
      INSERT INTO products (name, category, description, price, stock, is_limited, status)
      VALUES (?, ?, ?, ?, ?, ?, 'approved')
    `);
    
    products.forEach(p => stmt.run(p.name, p.category, p.description, p.price, p.stock, p.is_limited));
  }

  const outletCount = db.prepare('SELECT COUNT(*) as count FROM post_outlets').get().count;
  if (outletCount === 0) {
    const outlets = [
      { name: '金融街邮政支局', address: '北京市西城区金融街3号', city: '北京', phone: '010-66012345', business_hours: '09:00-18:00', delivery_area: '西城区全境' },
      { name: '中关村邮政支局', address: '北京市海淀区中关村大街27号', city: '北京', phone: '010-62567890', business_hours: '08:30-19:00', delivery_area: '海淀区全境' },
      { name: '陆家嘴邮政支局', address: '上海市浦东新区陆家嘴环路1088号', city: '上海', phone: '021-58765432', business_hours: '09:00-18:00', delivery_area: '浦东新区全境' },
      { name: '天河城邮政支局', address: '广州市天河区天河路208号', city: '广州', phone: '020-87654321', business_hours: '09:00-18:30', delivery_area: '天河区全境' },
      { name: '春熙路邮政支局', address: '成都市锦江区春熙路18号', city: '成都', phone: '028-87654321', business_hours: '09:00-18:00', delivery_area: '锦江区全境' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO post_outlets (name, address, city, phone, business_hours, delivery_area)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    outlets.forEach(o => stmt.run(o.name, o.address, o.city, o.phone, o.business_hours, o.delivery_area));
  }

  const adCount = db.prepare('SELECT COUNT(*) as count FROM ad_spots').get().count;
  if (adCount === 0) {
    const ads = [
      { name: '首页轮播广告1', location: 'home_carousel', image: '', link: '/products' },
      { name: '侧边栏广告位', location: 'sidebar', image: '', link: '/subscriptions' },
      { name: '底部横幅广告', location: 'footer_banner', image: '', link: '/products?category=culture' }
    ];
    
    const stmt = db.prepare('INSERT INTO ad_spots (name, location, image, link) VALUES (?, ?, ?, ?)');
    ads.forEach(a => stmt.run(a.name, a.location, a.image, a.link));
  }

  const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
  if (ticketCount === 0) {
    const tickets = [
      {
        user_id: 2, type: 'refund', related_id: 7, priority: 'normal', status: 'processing',
        title: '人民日报订阅退订申请',
        description: '由于本人搬家到新地址，原地址不再需要人民日报投递，申请退订剩余6个月的订阅费用。订阅单号：SUB202401001，已缴纳全年费用360元。'
      },
      {
        user_id: 2, type: 'resend', related_id: 10, priority: 'high', status: 'open',
        title: '参考消息3月15日期刊未收到',
        description: '本人订阅的参考消息杂志，3月15日那一期至今未收到，投递地址正确，信箱也检查过了没有。请核实后补寄。'
      },
      {
        user_id: 4, type: 'damage', related_id: 1, priority: 'high', status: 'closed',
        title: '龙年生肖邮票册收到时外包装破损',
        description: '3月10日收到的2024龙年生肖邮票册，外包装有明显挤压破损痕迹，打开后里面的邮票册边角也有磨损。希望能够更换全新的商品或者赔偿损失。商品金额：¥128'
      },
      {
        user_id: 4, type: 'other', related_id: null, priority: 'low', status: 'closed',
        title: '咨询邮票真伪鉴别方法',
        description: '想咨询一下如何鉴别邮票的真伪，最近在网上买了几套老邮票，担心是假的。请问你们有官方的鉴别渠道吗？'
      },
      {
        user_id: 2, type: 'refund', related_id: 8, priority: 'normal', status: 'open',
        title: '光明日报续订后想改投递地址',
        description: '上周刚续订了光明日报全年，但是这个月底要搬去朝阳区的新住址，想申请修改投递地址。新地址：北京市朝阳区建国路88号'
      },
      {
        user_id: 4, type: 'resend', related_id: 11, priority: 'normal', status: 'processing',
        title: '集邮爱好者杂志4月号缺页',
        description: '收到的《集邮爱好者》4月号第15-18页缺失，影响阅读。希望能补寄一本完整的。'
      }
    ];

    const ticketStmt = db.prepare(`
      INSERT INTO tickets (user_id, type, related_id, title, description, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const msgStmt = db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_id, content)
      VALUES (?, ?, ?)
    `);

    tickets.forEach(t => {
      const result = ticketStmt.run(t.user_id, t.type, t.related_id, t.title, t.description, t.status, t.priority);
      const ticketId = result.lastInsertRowid;
      msgStmt.run(ticketId, t.user_id, t.description);

      if (t.status === 'processing') {
        msgStmt.run(ticketId, 1, `您好，您的${t.title}工单已收到，我们正在核实相关信息，预计2个工作日内给予答复。感谢您的耐心等待。`);
      } else if (t.status === 'closed') {
        msgStmt.run(ticketId, 1, `您好，您的${t.title}工单已处理完毕。退款/补寄将在3个工作日内完成。如有其他问题，欢迎继续联系我们。`);
      }
    });
  }
}

function getDb() {
  return db;
}

module.exports = { init, getDb };
