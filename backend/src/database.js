const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
let db;

const init = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(new Uint8Array(data));
  } else {
    db = new SQL.Database();
    await createTables();
  }

  return db;
};

const createTables = async () => {
  db.run(`CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pinyin TEXT,
    pinyin_first TEXT,
    type TEXT NOT NULL,
    country TEXT,
    region TEXT,
    has_airport INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS airports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    city_id INTEGER,
    FOREIGN KEY (city_id) REFERENCES cities(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    from_code TEXT,
    to_code TEXT,
    date TEXT NOT NULL,
    price INTEGER NOT NULL,
    airline TEXT,
    type TEXT NOT NULL,
    discount REAL DEFAULT 1.0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    passenger_name TEXT,
    flight_info TEXT,
    create_time TEXT
  )`);

  await populateMockData();
};

const populateMockData = () => {
  return new Promise((resolve) => {
    const countResult = db.exec('SELECT COUNT(*) as count FROM cities');
    if (countResult.length > 0 && countResult[0].values[0][0] > 0) {
      resolve();
      return;
    }

    const cities = [
      { name: '北京', pinyin: 'beijing', pinyin_first: 'bj', type: 'domestic', country: '中国', region: '华北', has_airport: 1 },
      { name: '上海', pinyin: 'shanghai', pinyin_first: 'sh', type: 'domestic', country: '中国', region: '华东', has_airport: 1 },
      { name: '广州', pinyin: 'guangzhou', pinyin_first: 'gz', type: 'domestic', country: '中国', region: '华南', has_airport: 1 },
      { name: '深圳', pinyin: 'shenzhen', pinyin_first: 'sz', type: 'domestic', country: '中国', region: '华南', has_airport: 1 },
      { name: '成都', pinyin: 'chengdu', pinyin_first: 'cd', type: 'domestic', country: '中国', region: '西南', has_airport: 1 },
      { name: '杭州', pinyin: 'hangzhou', pinyin_first: 'hz', type: 'domestic', country: '中国', region: '华东', has_airport: 1 },
      { name: '西安', pinyin: 'xian', pinyin_first: 'xa', type: 'domestic', country: '中国', region: '西北', has_airport: 1 },
      { name: '重庆', pinyin: 'chongqing', pinyin_first: 'cq', type: 'domestic', country: '中国', region: '西南', has_airport: 1 },
      { name: '香港', pinyin: 'xianggang', pinyin_first: 'xg', type: 'international', country: '中国', region: '港澳台', has_airport: 1 },
      { name: '澳门', pinyin: 'aomen', pinyin_first: 'am', type: 'international', country: '中国', region: '港澳台', has_airport: 1 },
      { name: '台北', pinyin: 'taibei', pinyin_first: 'tb', type: 'international', country: '中国', region: '港澳台', has_airport: 1 },
      { name: '东京', pinyin: 'dongjing', pinyin_first: 'dj', type: 'international', country: '日本', region: '东亚', has_airport: 1 },
      { name: '首尔', pinyin: 'shouer', pinyin_first: 'se', type: 'international', country: '韩国', region: '东亚', has_airport: 1 },
      { name: '曼谷', pinyin: 'mangu', pinyin_first: 'mg', type: 'international', country: '泰国', region: '东南亚', has_airport: 1 },
      { name: '新加坡', pinyin: 'xinjiapo', pinyin_first: 'xj', type: 'international', country: '新加坡', region: '东南亚', has_airport: 1 },
      { name: '纽约', pinyin: 'niuyue', pinyin_first: 'ny', type: 'international', country: '美国', region: '北美', has_airport: 1 },
      { name: '伦敦', pinyin: 'lundun', pinyin_first: 'ld', type: 'international', country: '英国', region: '欧洲', has_airport: 1 },
      { name: '巴黎', pinyin: 'bali', pinyin_first: 'bl', type: 'international', country: '法国', region: '欧洲', has_airport: 1 },
      { name: '悉尼', pinyin: 'xini', pinyin_first: 'xn', type: 'international', country: '澳大利亚', region: '大洋洲', has_airport: 1 },
      { name: '迪拜', pinyin: 'dibai', pinyin_first: 'db', type: 'international', country: '阿联酋', region: '中东', has_airport: 1 }
    ];

    const stmt = db.prepare('INSERT INTO cities (name, pinyin, pinyin_first, type, country, region, has_airport) VALUES (?, ?, ?, ?, ?, ?, ?)');
    cities.forEach(city => {
      stmt.run([city.name, city.pinyin, city.pinyin_first, city.type, city.country, city.region, city.has_airport]);
    });
    stmt.free();

    populateMockFlights(resolve);
  });
};

const populateMockFlights = (callback) => {
  const today = new Date();
  const domesticRoutes = [
    ['北京', '上海', 'PEK', 'PVG'],
    ['北京', '广州', 'PEK', 'CAN'],
    ['北京', '深圳', 'PEK', 'SZX'],
    ['上海', '广州', 'PVG', 'CAN'],
    ['上海', '成都', 'PVG', 'CTU'],
    ['广州', '成都', 'CAN', 'CTU'],
    ['深圳', '杭州', 'SZX', 'HGH'],
    ['成都', '杭州', 'CTU', 'HGH'],
    ['北京', '杭州', 'PEK', 'HGH'],
    ['上海', '西安', 'PVG', 'XIY']
  ];
  const internationalRoutes = [
    ['北京', '东京', 'PEK', 'NRT'],
    ['北京', '首尔', 'PEK', 'ICN'],
    ['上海', '东京', 'PVG', 'NRT'],
    ['上海', '曼谷', 'PVG', 'BKK'],
    ['广州', '新加坡', 'CAN', 'SIN'],
    ['北京', '香港', 'PEK', 'HKG'],
    ['上海', '香港', 'PVG', 'HKG'],
    ['北京', '台北', 'PEK', 'TPE'],
    ['上海', '纽约', 'PVG', 'JFK'],
    ['北京', '伦敦', 'PEK', 'LHR']
  ];

  const stmt = db.prepare('INSERT INTO flights (from_city, to_city, from_code, to_code, date, price, airline, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    domesticRoutes.forEach(([from, to, fromCode, toCode]) => {
      stmt.run([from, to, fromCode, toCode, dateStr, 500 + Math.floor(Math.random() * 1500), ['国航', '东航', '南航', '海航'][Math.floor(Math.random() * 4)], 'domestic']);
    });

    internationalRoutes.forEach(([from, to, fromCode, toCode]) => {
      stmt.run([from, to, fromCode, toCode, dateStr, 2000 + Math.floor(Math.random() * 5000), ['国航', '东航', '南航', '国泰', '全日空', '大韩'][Math.floor(Math.random() * 6)], 'international']);
    });
  }

  stmt.free();
  
  const data = db.export();
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  fs.writeFileSync(dbPath, Buffer.from(data));
  
  callback();
};

const query = (sql, params = []) => {
  const results = db.exec(sql);
  if (results.length === 0) return [];
  
  const columns = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
};

const get = (sql, params = []) => {
  const results = db.exec(sql);
  if (results.length === 0 || results[0].values.length === 0) return null;
  
  const columns = results[0].columns;
  const row = results[0].values[0];
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj;
};

const run = (sql, params = []) => {
  db.run(sql, params);
};

module.exports = { init, query, get, run, db: () => db };