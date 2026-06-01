const db = require('./database');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      total_parking_spots INTEGER DEFAULT 0,
      total_charging_spots INTEGER DEFAULT 0,
      total_guns INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parking_spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      spot_number TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      has_charging INTEGER DEFAULT 0,
      gun_id INTEGER,
      price_per_hour REAL DEFAULT 10.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS charging_guns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      gun_number TEXT NOT NULL,
      spot_id INTEGER,
      status TEXT DEFAULT 'idle',
      power REAL DEFAULT 7.0,
      price_per_kwh REAL DEFAULT 1.5,
      connector_type TEXT DEFAULT 'CCS',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      device_type TEXT NOT NULL,
      device_name TEXT NOT NULL,
      status TEXT DEFAULT 'online',
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      device_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'repair',
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      assignee TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      name TEXT,
      plate_number TEXT,
      balance REAL DEFAULT 0,
      member_level TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parking_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      station_id INTEGER NOT NULL,
      spot_id INTEGER NOT NULL,
      plate_number TEXT,
      enter_time DATETIME,
      exit_time DATETIME,
      duration INTEGER,
      amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
    );

    CREATE TABLE IF NOT EXISTS charging_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      station_id INTEGER NOT NULL,
      gun_id INTEGER NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      duration INTEGER,
      start_soc INTEGER,
      end_soc INTEGER,
      energy REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (gun_id) REFERENCES charging_guns(id)
    );

    CREATE TABLE IF NOT EXISTS combined_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      parking_order_id INTEGER,
      charging_order_id INTEGER,
      total_amount REAL DEFAULT 0,
      total_discount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parking_order_id) REFERENCES parking_orders(id),
      FOREIGN KEY (charging_order_id) REFERENCES charging_orders(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      spot_id INTEGER,
      reserve_time DATETIME NOT NULL,
      expire_time DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER,
      rule_type TEXT NOT NULL,
      name TEXT NOT NULL,
      value REAL,
      conditions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER,
      device_id INTEGER,
      alert_type TEXT NOT NULL,
      message TEXT,
      level TEXT DEFAULT 'warning',
      is_resolved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );
  `);

  console.log('Database tables created successfully');

  const stationCount = db.prepare('SELECT COUNT(*) as count FROM stations').get().count;
  if (stationCount === 0) {
    const insertStation = db.prepare(`
      INSERT INTO stations (name, address, total_parking_spots, total_charging_spots, total_guns, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const stations = [
      { name: '中关村智慧充电站', address: '北京市海淀区中关村大街1号', total_parking: 100, total_charging: 20, total_guns: 20, lat: 39.98, lng: 116.31 },
      { name: '国贸中心停车充电站', address: '北京市朝阳区建国门外大街1号', total_parking: 200, total_charging: 30, total_guns: 30, lat: 39.91, lng: 116.46 }
    ];

    stations.forEach(s => {
      insertStation.run(s.name, s.address, s.total_parking, s.total_charging, s.total_guns, s.lat, s.lng, 'active');
    });

    const insertSpot = db.prepare(`
      INSERT INTO parking_spots (station_id, spot_number, type, status, has_charging, price_per_hour)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertGun = db.prepare(`
      INSERT INTO charging_guns (station_id, gun_number, spot_id, status, power, price_per_kwh, connector_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 1; i <= 100; i++) {
      const isCharging = i <= 20;
      const spotId = insertSpot.run(1, `A${String(i).padStart(3, '0')}`, isCharging ? 'charging' : 'normal', 'available', isCharging ? 1 : 0, isCharging ? 8 : 5).lastInsertRowid;
      if (isCharging) {
        insertGun.run(1, `G${String(i).padStart(3, '0')}`, spotId, 'idle', 7.0, 1.5, 'CCS');
      }
    }

    for (let i = 1; i <= 200; i++) {
      const isCharging = i <= 30;
      const spotId = insertSpot.run(2, `B${String(i).padStart(3, '0')}`, isCharging ? 'charging' : 'normal', 'available', isCharging ? 1 : 0, isCharging ? 10 : 6).lastInsertRowid;
      if (isCharging) {
        insertGun.run(2, `H${String(i).padStart(3, '0')}`, spotId, 'idle', 11.0, 1.8, 'GB/T');
      }
    }

    const insertDevice = db.prepare(`
      INSERT INTO devices (station_id, device_type, device_name, status, last_heartbeat)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const devices1 = [
      { type: 'gate', name: '入口道闸-01' },
      { type: 'gate', name: '出口道闸-01' },
      { type: 'camera', name: '入口摄像头-01' },
      { type: 'camera', name: '出口摄像头-01' },
      { type: 'sensor', name: '车位传感器-A001' },
      { type: 'lock', name: '地锁-A001' }
    ];
    devices1.forEach(d => {
      insertDevice.run(1, d.type, d.name, 'online');
    });

    const devices2 = [
      { type: 'gate', name: '入口道闸-02' },
      { type: 'gate', name: '出口道闸-02' },
      { type: 'camera', name: '入口摄像头-02' },
      { type: 'camera', name: '出口摄像头-02' },
      { type: 'charger', name: '充电桩-B001' },
      { type: 'sensor', name: '车位传感器-B001' },
      { type: 'lock', name: '地锁-B001' }
    ];
    devices2.forEach(d => {
      insertDevice.run(2, d.type, d.name, 'online');
    });

    const insertUser = db.prepare(`
      INSERT INTO users (phone, name, plate_number, balance, member_level)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('13800138000', '张三', '京A12345', 500.0, 'gold');
    insertUser.run('13900139000', '李四', '京B67890', 100.0, 'normal');

    console.log('Sample data inserted');
  }

  const rules = [
    { station_id: null, rule_type: 'parking_discount', name: '充电免停车费', value: 100, conditions: '{"charging_minutes": 30}' },
    { station_id: null, rule_type: 'charging_discount', name: '会员充电优惠', value: 10, conditions: '{"member_level": "gold"}' },
    { station_id: null, rule_type: 'overtime_fee', name: '超时占位费', value: 20, conditions: '{"after_minutes": 30}' }
  ];

  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO pricing_rules (station_id, rule_type, name, value, conditions)
    VALUES (?, ?, ?, ?, ?)
  `);

  rules.forEach(r => {
    const existing = db.prepare('SELECT id FROM pricing_rules WHERE name = ?').get(r.name);
    if (!existing) {
      insertRule.run(r.station_id, r.rule_type, r.name, r.value, r.conditions);
    }
  });

  console.log('Pricing rules initialized');
}

initDatabase();
module.exports = initDatabase;