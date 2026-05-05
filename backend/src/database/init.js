const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT,
      avatar TEXT,
      current_level_id INTEGER DEFAULT 1,
      total_points INTEGER DEFAULT 0,
      available_points INTEGER DEFAULT 0,
      total_growth INTEGER DEFAULT 0,
      current_growth INTEGER DEFAULT 0,
      level_upgrade_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_level_id) REFERENCES user_levels(id)
    );

    CREATE TABLE IF NOT EXISTS business_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      growth_coefficient REAL NOT NULL DEFAULT 1.0,
      point_coefficient REAL NOT NULL DEFAULT 1.0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      min_growth INTEGER NOT NULL DEFAULT 0,
      max_growth INTEGER,
      description TEXT,
      icon TEXT,
      color TEXT DEFAULT '#CCCCCC',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS privileges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      privilege_type TEXT NOT NULL,
      discount_value REAL,
      discount_unit TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS level_privileges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_id INTEGER NOT NULL,
      privilege_id INTEGER NOT NULL,
      usage_limit INTEGER,
      is_visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (level_id) REFERENCES user_levels(id),
      FOREIGN KEY (privilege_id) REFERENCES privileges(id),
      UNIQUE(level_id, privilege_id)
    );

    CREATE TABLE IF NOT EXISTS business_line_discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_line_id INTEGER NOT NULL,
      level_id INTEGER NOT NULL,
      discount_percent REAL NOT NULL DEFAULT 0,
      max_discount_amount INTEGER,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_line_id) REFERENCES business_lines(id),
      FOREIGN KEY (level_id) REFERENCES user_levels(id),
      UNIQUE(business_line_id, level_id)
    );

    CREATE TABLE IF NOT EXISTS business_point_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_line_id INTEGER NOT NULL,
      account_code TEXT NOT NULL UNIQUE,
      balance INTEGER NOT NULL DEFAULT 0,
      total_allocated INTEGER NOT NULL DEFAULT 0,
      total_used INTEGER NOT NULL DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_line_id) REFERENCES business_lines(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      business_line_id INTEGER NOT NULL,
      original_amount INTEGER NOT NULL,
      level_discount_amount INTEGER DEFAULT 0,
      other_discount_amount INTEGER DEFAULT 0,
      pay_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (business_line_id) REFERENCES business_lines(id)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trans_no TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      business_line_id INTEGER NOT NULL,
      account_id INTEGER,
      points INTEGER NOT NULL,
      points_before INTEGER NOT NULL,
      points_after INTEGER NOT NULL,
      trans_type TEXT NOT NULL,
      trans_desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (business_line_id) REFERENCES business_lines(id),
      FOREIGN KEY (account_id) REFERENCES business_point_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS growth_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      business_line_id INTEGER NOT NULL,
      growth_amount INTEGER NOT NULL,
      growth_before INTEGER NOT NULL,
      growth_after INTEGER NOT NULL,
      business_coefficient REAL NOT NULL,
      expire_date DATETIME,
      source_type TEXT NOT NULL,
      source_desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (business_line_id) REFERENCES business_lines(id)
    );

    CREATE TABLE IF NOT EXISTS privilege_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      privilege_id INTEGER NOT NULL,
      order_id INTEGER,
      usage_count INTEGER DEFAULT 1,
      discount_amount INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (privilege_id) REFERENCES privileges(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS growth_expire_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      growth_record_id INTEGER NOT NULL,
      expire_amount INTEGER NOT NULL,
      expire_date DATETIME NOT NULL,
      is_expired INTEGER DEFAULT 0,
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (growth_record_id) REFERENCES growth_records(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
    CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_growth_records_user_id ON growth_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  const checkLevels = db.prepare('SELECT COUNT(*) as count FROM user_levels');
  const levelCount = checkLevels.get().count;
  
  if (levelCount === 0) {
    const insertLevel = db.prepare(`
      INSERT INTO user_levels (name, code, min_growth, max_growth, description, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertLevel.run('小骆驼', 'LITTLE_CAMEL', 0, 999, '新手入门，开启成长之旅', '🐪', '#95A5A6');
    insertLevel.run('铜骆驼', 'COPPER_CAMEL', 1000, 4999, '活跃用户，享受基础特权', '🐫', '#CD7F32');
    insertLevel.run('银骆驼', 'SILVER_CAMEL', 5000, 19999, '优质用户，尊享更多权益', '🦙', '#C0C0C0');
    insertLevel.run('金骆驼', 'GOLDEN_CAMEL', 20000, null, '顶级用户，专属尊贵服务', '🐏', '#FFD700');
  }

  const checkBusiness = db.prepare('SELECT COUNT(*) as count FROM business_lines');
  const businessCount = checkBusiness.get().count;

  if (businessCount === 0) {
    const insertBusiness = db.prepare(`
      INSERT INTO business_lines (code, name, description, growth_coefficient, point_coefficient)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertBusiness.run('HOTEL', '酒店', '酒店预订业务', 2.0, 1.5);
    insertBusiness.run('FLIGHT', '机票', '机票预订业务', 1.5, 1.2);
    insertBusiness.run('TICKET', '门票', '景点门票业务', 1.0, 1.0);
    insertBusiness.run('TRAIN', '火车票', '火车票预订业务', 1.0, 1.0);
    insertBusiness.run('CAR', '用车', '用车服务业务', 1.2, 1.1);
    insertBusiness.run('VACATION', '度假', '度假产品业务', 2.5, 1.8);
    insertBusiness.run('GROUP_BUY', '团购', '团购优惠业务', 0.8, 0.8);
    insertBusiness.run('INSURANCE', '保险', '旅行保险业务', 1.8, 1.5);
  }

  const checkPrivileges = db.prepare('SELECT COUNT(*) as count FROM privileges');
  const privilegeCount = checkPrivileges.get().count;

  if (privilegeCount === 0) {
    const insertPrivilege = db.prepare(`
      INSERT INTO privileges (name, code, description, privilege_type, discount_value, discount_unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertPrivilege.run('积分加倍', 'POINT_DOUBLE', '消费积分翻倍', 'POINT_MULTIPLY', 2.0, 'times');
    insertPrivilege.run('生日礼包', 'BIRTHDAY_GIFT', '生日当月赠送1000积分', 'POINT_GIFT', 1000.0, 'points');
    insertPrivilege.run('免费取消', 'FREE_CANCEL', '订单可免费取消', 'SERVICE', 0.0, null);
    insertPrivilege.run('优先客服', 'PRIORITY_SERVICE', '专属客服优先接入', 'SERVICE', 0.0, null);
    insertPrivilege.run('会员价', 'MEMBER_PRICE', '享受会员专属价格', 'DISCOUNT', 0.95, 'percent');
    insertPrivilege.run('延迟退房', 'LATE_CHECKOUT', '酒店延迟至14:00退房', 'SERVICE', 0.0, null);
    insertPrivilege.run('快速安检', 'FAST_SECURITY', '机场快速安检通道', 'SERVICE', 0.0, null);
    insertPrivilege.run('贵宾休息室', 'VIP_LOUNGE', '机场贵宾休息室', 'SERVICE', 0.0, null);
  }

  const checkLevelPrivileges = db.prepare('SELECT COUNT(*) as count FROM level_privileges');
  const levelPrivCount = checkLevelPrivileges.get().count;

  if (levelPrivCount === 0) {
    const insertLevelPrivilege = db.prepare(`
      INSERT INTO level_privileges (level_id, privilege_id, usage_limit)
      VALUES (?, ?, ?)
    `);

    insertLevelPrivilege.run(1, 5, null);
    insertLevelPrivilege.run(2, 1, null);
    insertLevelPrivilege.run(2, 3, null);
    insertLevelPrivilege.run(2, 5, null);
    insertLevelPrivilege.run(3, 1, null);
    insertLevelPrivilege.run(3, 2, null);
    insertLevelPrivilege.run(3, 3, null);
    insertLevelPrivilege.run(3, 4, null);
    insertLevelPrivilege.run(3, 5, null);
    insertLevelPrivilege.run(3, 6, null);
    insertLevelPrivilege.run(4, 1, null);
    insertLevelPrivilege.run(4, 2, null);
    insertLevelPrivilege.run(4, 3, null);
    insertLevelPrivilege.run(4, 4, null);
    insertLevelPrivilege.run(4, 5, null);
    insertLevelPrivilege.run(4, 6, null);
    insertLevelPrivilege.run(4, 7, null);
    insertLevelPrivilege.run(4, 8, null);
  }

  const checkDiscounts = db.prepare('SELECT COUNT(*) as count FROM business_line_discounts');
  const discountCount = checkDiscounts.get().count;

  if (discountCount === 0) {
    const insertDiscount = db.prepare(`
      INSERT INTO business_line_discounts (business_line_id, level_id, discount_percent, max_discount_amount)
      VALUES (?, ?, ?, ?)
    `);

    for (let bl = 1; bl <= 8; bl++) {
      insertDiscount.run(bl, 2, 0.98, 5000);
      insertDiscount.run(bl, 3, 0.95, 10000);
      insertDiscount.run(bl, 4, 0.92, 20000);
    }
  }

  const checkAccounts = db.prepare('SELECT COUNT(*) as count FROM business_point_accounts');
  const accountCount = checkAccounts.get().count;

  if (accountCount === 0) {
    const insertAccount = db.prepare(`
      INSERT INTO business_point_accounts (business_line_id, account_code, balance, total_allocated)
      VALUES (?, ?, ?, ?)
    `);

    const businessLines = db.prepare('SELECT id, code FROM business_lines').all();
    businessLines.forEach(bl => {
      insertAccount.run(bl.id, `ACC_${bl.code}`, 10000000, 10000000);
    });
  }

  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = checkUsers.get().count;

  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, nickname, current_level_id, total_points, available_points, total_growth, current_growth)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('demo_user', '演示用户', 1, 0, 0, 0, 0);
  }
};

const closeDatabase = () => {
  db.close();
};

module.exports = {
  db,
  initDatabase,
  closeDatabase
};
