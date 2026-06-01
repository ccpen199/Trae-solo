import db from './index';
import bcrypt from 'bcryptjs';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      balance REAL DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'owner',
      vehicle_info TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      longitude REAL NOT NULL,
      latitude REAL NOT NULL,
      operator_id INTEGER,
      price_per_kwh REAL NOT NULL DEFAULT 1.5,
      parking_fee REAL DEFAULT 0,
      business_hours TEXT DEFAULT '00:00-24:00',
      status TEXT DEFAULT 'open',
      total_guns INTEGER DEFAULT 0,
      available_guns INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chargers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      model TEXT,
      power REAL DEFAULT 120,
      status TEXT DEFAULT 'offline',
      firmware_version TEXT,
      last_heartbeat TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS guns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      charger_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      gun_no TEXT NOT NULL,
      connector_type TEXT DEFAULT 'GB/T',
      max_power REAL DEFAULT 120,
      status TEXT DEFAULT 'idle',
      current_order_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (charger_id) REFERENCES chargers(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      gun_id INTEGER NOT NULL,
      vehicle_plate TEXT,
      reserve_time TEXT NOT NULL,
      expire_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (gun_id) REFERENCES guns(id)
    );

    CREATE TABLE IF NOT EXISTS charging_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      gun_id INTEGER NOT NULL,
      start_time TEXT,
      end_time TEXT,
      start_soc REAL,
      end_soc REAL,
      total_kwh REAL DEFAULT 0,
      peak_kwh REAL DEFAULT 0,
      valley_kwh REAL DEFAULT 0,
      avg_power REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      electricity_fee REAL DEFAULT 0,
      service_fee REAL DEFAULT 0,
      parking_fee REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      charging_status TEXT DEFAULT 'pending',
      stop_reason TEXT,
      power_curve TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (gun_id) REFERENCES guns(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL DEFAULT 0,
      balance_after REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'balance',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES charging_orders(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      station_id INTEGER NOT NULL,
      charger_id INTEGER,
      gun_id INTEGER,
      type TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      title TEXT NOT NULL,
      description TEXT,
      reporter TEXT,
      assignee TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (charger_id) REFERENCES chargers(id),
      FOREIGN KEY (gun_id) REFERENCES guns(id)
    );

    CREATE TABLE IF NOT EXISTS alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      charger_id INTEGER,
      gun_id INTEGER,
      type TEXT NOT NULL,
      level TEXT DEFAULT 'warning',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (charger_id) REFERENCES chargers(id),
      FOREIGN KEY (gun_id) REFERENCES guns(id)
    );

    CREATE TABLE IF NOT EXISTS firmware (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      model TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER DEFAULT 0,
      md5 TEXT,
      release_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      inspector TEXT NOT NULL,
      inspection_date TEXT NOT NULL,
      items TEXT,
      result TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date TEXT NOT NULL,
      station_id INTEGER NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_kwh REAL DEFAULT 0,
      peak_kwh REAL DEFAULT 0,
      valley_kwh REAL DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      avg_charging_duration REAL DEFAULT 0,
      utilization_rate REAL DEFAULT 0,
      unique_users INTEGER DEFAULT 0,
      repeat_users INTEGER DEFAULT 0,
      queue_loss_count INTEGER DEFAULT 0,
      queue_loss_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date, station_id)
    );

    CREATE INDEX IF NOT EXISTS idx_stations_location ON stations(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON charging_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_station ON charging_orders(station_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON charging_orders(charging_status);
    CREATE INDEX IF NOT EXISTS idx_guns_station ON guns(station_id);
    CREATE INDEX IF NOT EXISTS idx_guns_status ON guns(status);
    CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_gun ON reservations(gun_id);
    CREATE INDEX IF NOT EXISTS idx_alarms_status ON alarms(status);
    CREATE INDEX IF NOT EXISTS idx_workorders_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_stats_date ON daily_stats(stat_date);
  `);

  const hasUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (hasUsers.count === 0) {
    seedData();
  }
}

function seedData() {
  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (phone, password, nickname, role, balance, vehicle_info)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run('13800000001', hashPassword('admin123'), '系统管理员', 'admin', 0, null).lastInsertRowid as number;
  const opId = insertUser.run('13800000002', hashPassword('op123456'), '运营专员', 'operator', 0, null).lastInsertRowid as number;
  insertUser.run('13800000003', hashPassword('user1234'), '张三', 'owner', 500.00, '京A12345 特斯拉Model 3');
  insertUser.run('13800000004', hashPassword('user1234'), '李四', 'owner', 1200.50, '沪B67890 比亚迪汉');
  insertUser.run('13800000005', hashPassword('user1234'), '王五', 'owner', 50.00, '粤C11111 小鹏P7');

  const stations = [
    { name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', lng: 116.47, lat: 40.00, price: 1.68, parking: 5, operator: opId },
    { name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', lng: 116.46, lat: 39.91, price: 1.85, parking: 8, operator: opId },
    { name: '中关村产业园站', address: '北京市海淀区中关村大街1号', lng: 116.31, lat: 39.98, price: 1.52, parking: 0, operator: opId },
    { name: '三里屯太古里站', address: '北京市朝阳区三里屯路19号', lng: 116.45, lat: 39.93, price: 1.95, parking: 10, operator: opId },
    { name: '西直门凯德站', address: '北京市西城区西直门外大街1号', lng: 116.35, lat: 39.94, price: 1.58, parking: 6, operator: opId },
  ];

  const insertStation = db.prepare(`
    INSERT INTO stations (name, address, longitude, latitude, operator_id, price_per_kwh, parking_fee, total_guns, available_guns)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCharger = db.prepare(`
    INSERT INTO chargers (station_id, serial_number, model, power, status, firmware_version, last_heartbeat)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertGun = db.prepare(`
    INSERT INTO guns (charger_id, station_id, gun_no, connector_type, max_power, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const gunStatuses = ['idle', 'idle', 'charging', 'idle', 'fault', 'idle', 'occupied', 'idle'];
  const connectorTypes = ['GB/T', 'CCS', 'GB/T', 'Type2'];

  stations.forEach((station, sIdx) => {
    const stationId = insertStation.run(
      station.name, station.address, station.lng, station.lat, station.operator, 
      station.price, station.parking, 8, 5
    ).lastInsertRowid as number;

    for (let c = 1; c <= 2; c++) {
      const chargerId = insertCharger.run(
        stationId,
        `CHG-${String(sIdx + 1).padStart(3, '0')}-${c}`,
        c === 1 ? 'DC-120kW' : 'DC-180kW',
        c === 1 ? 120 : 180,
        c === 1 ? 'online' : 'online',
        'v2.3.1'
      ).lastInsertRowid as number;

      for (let g = 1; g <= 4; g++) {
        const gunIdx = (sIdx * 8 + (c - 1) * 4 + (g - 1)) % gunStatuses.length;
        insertGun.run(
          chargerId,
          stationId,
          `${stationId}-${c}-${g}`,
          connectorTypes[(g - 1) % connectorTypes.length],
          c === 1 ? 120 : 180,
          gunStatuses[gunIdx]
        );
      }
    }
  });

  const insertFirmware = db.prepare(`
    INSERT INTO firmware (version, model, file_size, release_notes)
    VALUES (?, ?, ?, ?)
  `);
  insertFirmware.run('v2.3.1', 'DC-120kW', 15234567, '修复充电稳定性问题，优化功率曲线');
  insertFirmware.run('v2.4.0', 'DC-180kW', 16789012, '新增液冷控制，提升最大输出功率');
  insertFirmware.run('v2.2.5', 'DC-120kW', 14567890, '修复OCPP通信兼容性问题');

  console.log('Database initialized with seed data.');
}

export default db;
