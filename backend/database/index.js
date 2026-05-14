const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  const tables = [];

  tables.push(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taobao_account TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      notification_permission INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS flash_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      product_thumb TEXT,
      original_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      taobao_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      flash_sale_id INTEGER,
      type TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      keyword TEXT,
      ringtone TEXT DEFAULT 'default',
      vibration INTEGER DEFAULT 1,
      advance_time INTEGER DEFAULT 5,
      repeat_type TEXT DEFAULT 'once',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id)
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS reminder_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_id INTEGER NOT NULL,
      trigger_time DATETIME NOT NULL,
      status TEXT DEFAULT 'pending',
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id)
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS logistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_no TEXT NOT NULL,
      product_name TEXT NOT NULL,
      courier_company TEXT,
      tracking_no TEXT,
      status TEXT DEFAULT 'pending',
      current_location TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      receiver_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS logistics_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logistics_id INTEGER NOT NULL,
      location TEXT,
      description TEXT,
      tracking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (logistics_id) REFERENCES logistics(id)
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS social_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      account_name TEXT NOT NULL,
      platform_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, platform)
    )
  `);

  tables.push(`
    CREATE TABLE IF NOT EXISTS share_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      flash_sale_id INTEGER,
      platform TEXT NOT NULL,
      account_name TEXT,
      share_content TEXT,
      share_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  tables.push(`
    CREATE INDEX IF NOT EXISTS idx_flash_sales_time ON flash_sales(start_time, end_time)
  `);

  tables.push(`
    CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id)
  `);

  tables.push(`
    CREATE INDEX IF NOT EXISTS idx_logistics_user ON logistics(user_id)
  `);

  try {
    const transaction = db.transaction((queryList) => {
      queryList.forEach(query => {
        if (query && query.trim()) {
          db.exec(query);
        }
      });
    });
    transaction(tables);
    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err.message);
  }
};

const seedData = () => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('123456', 10);
      
      const insertUser = db.prepare(`
        INSERT INTO users (taobao_account, password, nickname, avatar, notification_permission)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertUser.run('test@taobao', hashedPassword, '测试用户', null, 1);
      insertUser.run('demo@taobao', hashedPassword, '演示账号', null, 0);
    }

    const saleCount = db.prepare('SELECT COUNT(*) as count FROM flash_sales').get();
    if (saleCount.count === 0) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000);

      const insertSale = db.prepare(`
        INSERT INTO flash_sales (product_name, product_thumb, original_price, sale_price, stock, status, start_time, end_time, taobao_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const salesData = [
        ['iPhone 15 Pro Max 256G', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20smartphone%20product%20shot&image_size=square', 9999, 7999, 100, 'ongoing', yesterday.toISOString(), oneHourLater.toISOString(), 'https://item.taobao.com/item.htm?id=1'],
        ['华为 Mate 60 Pro', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Huawei%20Mate%20smartphone%20product%20shot&image_size=square', 6999, 5499, 200, 'ongoing', yesterday.toISOString(), oneHourLater.toISOString(), 'https://item.taobao.com/item.htm?id=2'],
        ['小米 14 Ultra', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Xiaomi%20smartphone%20leica%20camera%20product&image_size=square', 5999, 4299, 150, 'ongoing', yesterdayEnd.toISOString(), oneHourLater.toISOString(), 'https://item.taobao.com/item.htm?id=3'],
        ['Apple Watch Series 9', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Apple%20Watch%20smartwatch%20product&image_size=square', 2999, 2199, 300, 'upcoming', oneHourLater.toISOString(), threeHoursLater.toISOString(), 'https://item.taobao.com/item.htm?id=4'],
        ['AirPods Pro 2', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Apple%20AirPods%20wireless%20earbuds&image_size=square', 1899, 1399, 500, 'upcoming', twoHoursLater.toISOString(), threeHoursLater.toISOString(), 'https://item.taobao.com/item.htm?id=5'],
        ['MacBook Air M3', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Air%20laptop%20silver&image_size=square', 8999, 7499, 50, 'upcoming', threeHoursLater.toISOString(), '2026-05-12T23:59:59.000Z', 'https://item.taobao.com/item.htm?id=6']
      ];

      salesData.forEach(sale => {
        insertSale.run(...sale);
      });
    }

    const logisticsCount = db.prepare('SELECT COUNT(*) as count FROM logistics').get();
    if (logisticsCount.count === 0) {
      const insertLogistics = db.prepare(`
        INSERT INTO logistics (user_id, order_no, product_name, courier_company, tracking_no, status, current_location, receiver_name, receiver_phone, receiver_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const logisticsData = [
        [1, 'TB20260510001', 'iPhone 15 Pro Max', '顺丰速运', 'SF1234567890123', 'transit', '上海市浦东新区', '张三', '13800138001', '上海市浦东新区张江高科技园区'],
        [1, 'TB20260509002', '华为 Mate 60 Pro', '中通快递', 'ZT9876543210', 'delivered', '北京市朝阳区', '李四', '13800138002', '北京市朝阳区望京SOHO'],
        [2, 'TB20260508003', '小米 14 Ultra', '圆通速递', 'YT1122334455', 'pending', '深圳市南山区', '王五', '13800138003', '深圳市南山区科技园']
      ];

      logisticsData.forEach(logistics => {
        insertLogistics.run(...logistics);
      });

      const insertTracking = db.prepare(`
        INSERT INTO logistics_tracking (logistics_id, location, description, tracking_time)
        VALUES (?, ?, ?, ?)
      `);

      const trackingData = [
        [1, '上海市', '快件已到达【上海浦东转运中心', new Date(Date.now() - 3600000).toISOString()],
        [1, '杭州市', '快件已从【杭州转运中心】发出', new Date(Date.now() - 7200000).toISOString()],
        [1, '杭州市', '快件已到达【杭州转运中心', new Date(Date.now() - 10800000).toISOString()],
        [2, '北京市', '快件已签收，签收人：本人签收', new Date(Date.now() - 86400000).toISOString()],
        [2, '北京市朝阳区', '快件正在派送中', new Date(Date.now() - 90000000).toISOString()]
      ];

      trackingData.forEach(tracking => {
        insertTracking.run(...tracking);
      });
    }
  } catch (err) {
    console.error('数据初始化失败:', err.message);
  }
};

module.exports = {
  db,
  initDatabase,
  seedData
};
