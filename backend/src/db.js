const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      pinyin TEXT,
      is_hot INTEGER DEFAULT 0,
      sort INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id TEXT,
      user_id TEXT,
      from_city TEXT,
      to_city TEXT,
      search_date TEXT,
      search_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_ip TEXT UNIQUE,
      default_from_city TEXT,
      last_search_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS train_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      train_no TEXT NOT NULL,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      from_station TEXT,
      to_station TEXT,
      start_time TEXT,
      end_time TEXT,
      travel_date TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      user_id TEXT,
      passenger_name TEXT,
      passenger_id TEXT,
      seat_type TEXT DEFAULT '二等座',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const cities = [
    { code: 'BJ', name: '北京', pinyin: 'beijing', is_hot: 1, sort: 1 },
    { code: 'SH', name: '上海', pinyin: 'shanghai', is_hot: 1, sort: 2 },
    { code: 'GZ', name: '广州', pinyin: 'guangzhou', is_hot: 1, sort: 3 },
    { code: 'SZ', name: '深圳', pinyin: 'shenzhen', is_hot: 1, sort: 4 },
    { code: 'CD', name: '成都', pinyin: 'chengdu', is_hot: 1, sort: 5 },
    { code: 'HZ', name: '杭州', pinyin: 'hangzhou', is_hot: 1, sort: 6 },
    { code: 'XA', name: '西安', pinyin: 'xian', is_hot: 1, sort: 7 },
    { code: 'CQ', name: '重庆', pinyin: 'chongqing', is_hot: 1, sort: 8 },
    { code: 'NJ', name: '南京', pinyin: 'nanjing', is_hot: 1, sort: 9 },
    { code: 'WH', name: '武汉', pinyin: 'wuhan', is_hot: 1, sort: 10 },
    { code: 'SY', name: '三亚', pinyin: 'sanya', is_hot: 0, sort: 11 },
    { code: 'KM', name: '昆明', pinyin: 'kunming', is_hot: 0, sort: 12 },
    { code: 'XM', name: '厦门', pinyin: 'xiamen', is_hot: 0, sort: 13 },
    { code: 'TJ', name: '天津', pinyin: 'tianjin', is_hot: 0, sort: 14 },
    { code: 'DL', name: '大连', pinyin: 'dalian', is_hot: 0, sort: 15 },
    { code: 'QD', name: '青岛', pinyin: 'qingdao', is_hot: 0, sort: 16 },
    { code: 'CS', name: '长沙', pinyin: 'changsha', is_hot: 0, sort: 17 },
    { code: 'HEK', name: '海口', pinyin: 'haikou', is_hot: 0, sort: 18 },
    { code: 'URC', name: '乌鲁木齐', pinyin: 'wulumuqi', is_hot: 0, sort: 19 },
    { code: 'LXA', name: '拉萨', pinyin: 'lasa', is_hot: 0, sort: 20 }
  ];

  const insertCity = db.prepare('INSERT OR IGNORE INTO cities (code, name, pinyin, is_hot, sort) VALUES (?, ?, ?, ?, ?)');
  for (const city of cities) {
    insertCity.run(city.code, city.name, city.pinyin, city.is_hot, city.sort);
  }
}

initDB();

module.exports = db;
