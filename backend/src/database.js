const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const fullDbPath = path.resolve(__dirname, '..', dbPath);

const dataDir = path.dirname(fullDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(fullDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      is_verified INTEGER DEFAULT 0,
      real_name TEXT,
      id_card TEXT,
      has_deposit INTEGER DEFAULT 0,
      deposit_amount REAL DEFAULT 0,
      credit_score INTEGER DEFAULT 600,
      credit_authorized INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bike_code TEXT UNIQUE NOT NULL,
      plate_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'available',
      battery REAL DEFAULT 100,
      latitude REAL,
      longitude REAL,
      max_range REAL DEFAULT 50,
      last_checked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parking_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius REAL DEFAULT 50,
      address TEXT,
      type TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      bike_id INTEGER NOT NULL,
      start_latitude REAL,
      start_longitude REAL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_latitude REAL,
      end_longitude REAL,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      distance REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      final_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'riding',
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bike_id) REFERENCES bikes(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'pay',
      status TEXT DEFAULT 'completed',
      transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fault_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bike_id INTEGER NOT NULL,
      bike_code TEXT NOT NULL,
      fault_type TEXT NOT NULL,
      description TEXT,
      photos TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bike_id) REFERENCES bikes(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      bike_code TEXT,
      description TEXT,
      photos TEXT,
      location_lat REAL,
      location_lng REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_duration INTEGER DEFAULT 30,
      base_price REAL DEFAULT 2.0,
      additional_duration INTEGER DEFAULT 30,
      additional_price REAL DEFAULT 1.0,
      max_daily_price REAL DEFAULT 30.0,
      free_protection_minutes INTEGER DEFAULT 2,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const bikeCount = db.prepare('SELECT COUNT(*) as count FROM bikes').get();
  if (bikeCount.count === 0) {
    const bikes = [
      { bike_code: 'JT001', plate_number: '京A00001', battery: 85, lat: 39.9042, lng: 116.4074 },
      { bike_code: 'JT002', plate_number: '京A00002', battery: 92, lat: 39.9052, lng: 116.4084 },
      { bike_code: 'JT003', plate_number: '京A00003', battery: 15, lat: 39.9032, lng: 116.4064 },
      { bike_code: 'JT004', plate_number: '京A00004', battery: 45, lat: 39.9062, lng: 116.4094 },
      { bike_code: 'JT005', plate_number: '京A00005', battery: 78, lat: 39.9022, lng: 116.4054 },
      { bike_code: 'JT006', plate_number: '京A00006', battery: 5, lat: 39.9072, lng: 116.4104 },
      { bike_code: 'JT007', plate_number: '京A00007', battery: 65, lat: 39.9047, lng: 116.4069 },
      { bike_code: 'JT008', plate_number: '京A00008', battery: 88, lat: 39.9057, lng: 116.4079 },
    ];

    const insertBike = db.prepare(`
      INSERT INTO bikes (bike_code, plate_number, battery, latitude, longitude, max_range, last_checked_at)
      VALUES (?, ?, ?, ?, ?, 50, datetime('now'))
    `);

    bikes.forEach(bike => {
      let status = 'available';
      if (bike.battery < 10) status = 'low_battery';
      if (bike.bike_code === 'JT003') status = 'maintenance';
      if (bike.bike_code === 'JT006') status = 'low_battery';
      
      insertBike.run(bike.bike_code, bike.plate_number, bike.battery, bike.lat, bike.lng);
      
      if (status !== 'available') {
        db.prepare('UPDATE bikes SET status = ? WHERE bike_code = ?').run(status, bike.bike_code);
      }
    });
  }

  const zoneCount = db.prepare('SELECT COUNT(*) as count FROM parking_zones').get();
  if (zoneCount.count === 0) {
    const zones = [
      { name: '国贸地铁A口', lat: 39.9087, lng: 116.4605, address: '朝阳区国贸地铁站A出口' },
      { name: '王府井大街南', lat: 39.9139, lng: 116.4100, address: '东城区王府井大街南段' },
      { name: '东直门枢纽站', lat: 39.9410, lng: 116.4346, address: '东城区东直门交通枢纽' },
      { name: '西单商场', lat: 39.9087, lng: 116.3683, address: '西城区西单北大街' },
      { name: '三里屯太古里', lat: 39.9327, lng: 116.4537, address: '朝阳区三里屯路' },
    ];

    const insertZone = db.prepare(`
      INSERT INTO parking_zones (name, latitude, longitude, radius, address)
      VALUES (?, ?, ?, 50, ?)
    `);

    zones.forEach(zone => {
      insertZone.run(zone.name, zone.lat, zone.lng, zone.address);
    });
  }

  const pricingCount = db.prepare('SELECT COUNT(*) as count FROM pricing_rules').get();
  if (pricingCount.count === 0) {
    db.prepare(`
      INSERT INTO pricing_rules (name, base_duration, base_price, additional_duration, additional_price, max_daily_price, free_protection_minutes)
      VALUES ('标准计费', 30, 2.0, 30, 1.0, 30.0, 2)
    `).run();
  }
};

initDatabase();

module.exports = db;
