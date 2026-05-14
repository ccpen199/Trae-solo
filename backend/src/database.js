const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS landmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      is_nearby INTEGER DEFAULT 0,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS car_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL,
      price_per_km REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      pickup_city TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      dropoff_address TEXT NOT NULL,
      scheduled_time TEXT,
      car_type_id INTEGER,
      passenger_name TEXT,
      passenger_phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_type_id) REFERENCES car_types(id)
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      discount_amount REAL,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      is_home INTEGER DEFAULT 0,
      is_work INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 1
    );
  `);

  const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get().count;
  if (cityCount === 0) {
    const cities = [
      { name: '北京', code: 'BJ' },
      { name: '上海', code: 'SH' },
      { name: '广州', code: 'GZ' },
      { name: '深圳', code: 'SZ' },
      { name: '杭州', code: 'HZ' }
    ];

    const insertCity = db.prepare('INSERT INTO cities (name, code) VALUES (?, ?)');
    const insertLandmark = db.prepare('INSERT INTO landmarks (city_id, name, address, is_nearby) VALUES (?, ?, ?, ?)');

    const landmarksData = {
      '北京': ['天安门广场', '北京西站', '北京首都国际机场', '王府井步行街', '故宫博物院', '北京大学', '北京南站', '奥林匹克公园'],
      '上海': ['上海虹桥站', '上海浦东国际机场', '外滩', '南京路步行街', '迪士尼乐园', '上海站', '复旦大学', '上海体育馆'],
      '广州': ['广州南站', '广州白云国际机场', '广州塔', '天河体育中心', '广州站', '北京路步行街', '中山大学', '长隆旅游度假区'],
      '深圳': ['深圳北站', '深圳宝安国际机场', '福田CBD', '世界之窗', '深圳站', '华强北', '深圳大学', '东部华侨城'],
      '杭州': ['杭州东站', '杭州萧山国际机场', '西湖', '武林广场', '杭州站', '河坊街', '浙江大学', '西溪湿地']
    };

    const tx = db.transaction((cities, landmarksData) => {
      for (const city of cities) {
        const result = insertCity.run(city.name, city.code);
        const cityId = result.lastInsertRowid;
        
        const landmarks = landmarksData[city.name] || [];
        for (let i = 0; i < landmarks.length; i++) {
          insertLandmark.run(cityId, landmarks[i], `${city.name}市${landmarks[i]}`, i < 3 ? 1 : 0);
        }
      }
    });
    
    tx(cities, landmarksData);
  }

  const carTypeCount = db.prepare('SELECT COUNT(*) as count FROM car_types').get().count;
  if (carTypeCount === 0) {
    const carTypes = [
      { name: '快车', description: '经济实惠，性价比高', base_price: 12, price_per_km: 2.5 },
      { name: '专车', description: '舒适宽敞，品质服务', base_price: 25, price_per_km: 4.5 },
      { name: '豪华车', description: '高端车型，尊享体验', base_price: 50, price_per_km: 8.0 },
      { name: '助老专车', description: '专为老年人设计，贴心服务', base_price: 18, price_per_km: 3.0 }
    ];

    const insertCarType = db.prepare('INSERT INTO car_types (name, description, base_price, price_per_km) VALUES (?, ?, ?, ?)');
    for (const carType of carTypes) {
      insertCarType.run(carType.name, carType.description, carType.base_price, carType.price_per_km);
    }
  }

  const promotionCount = db.prepare('SELECT COUNT(*) as count FROM promotions').get().count;
  if (promotionCount === 0) {
    const promotions = [
      { title: '新用户首单立减', description: '新用户注册首单立减20元', discount_amount: 20 },
      { title: '助老优惠', description: '助老模式下单享8折优惠', discount_amount: null },
      { title: '周末出行满减', description: '周末出行满50减10元', discount_amount: 10 }
    ];

    const insertPromo = db.prepare('INSERT INTO promotions (title, description, discount_amount) VALUES (?, ?, ?)');
    for (const promo of promotions) {
      insertPromo.run(promo.title, promo.description, promo.discount_amount);
    }
  }

  const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  if (messageCount === 0) {
    const messages = [
      { title: '欢迎使用阳光出行', content: '感谢您选择阳光出行，我们将为您提供安全、便捷的出行服务。' },
      { title: '助老模式上线', content: '助老模式现已正式上线，大字体、简操作，让出行更轻松。' }
    ];

    const insertMsg = db.prepare('INSERT INTO messages (title, content) VALUES (?, ?)');
    for (const msg of messages) {
      insertMsg.run(msg.title, msg.content);
    }
  }

  const userLocCount = db.prepare('SELECT COUNT(*) as count FROM user_locations').get().count;
  if (userLocCount === 0) {
    const locations = [
      { name: '我的家', address: '阳光小区1号楼', is_home: 1, is_work: 0 },
      { name: '公司', address: '创新大厦A座', is_home: 0, is_work: 1 }
    ];

    const insertLoc = db.prepare('INSERT INTO user_locations (name, address, is_home, is_work) VALUES (?, ?, ?, ?)');
    for (const loc of locations) {
      insertLoc.run(loc.name, loc.address, loc.is_home, loc.is_work);
    }
  }
}

module.exports = {
  db,
  initDatabase
};
