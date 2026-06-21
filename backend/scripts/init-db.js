const db = require('../src/config/database');

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    total_piles INTEGER DEFAULT 0,
    fast_piles INTEGER DEFAULT 0,
    slow_piles INTEGER DEFAULT 0,
    operator TEXT DEFAULT '依威能源',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chargers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    charger_code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('fast', 'slow')),
    power_rating REAL NOT NULL,
    protocol TEXT DEFAULT 'GB/T',
    ocpp_version TEXT DEFAULT '1.6',
    status TEXT DEFAULT 'offline',
    connector_count INTEGER DEFAULT 1,
    installation_date DATE,
    last_maintenance_date DATE,
    health_score REAL DEFAULT 100,
    total_charging_count INTEGER DEFAULT 0,
    total_energy REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS charger_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    charger_id INTEGER NOT NULL,
    voltage REAL,
    current REAL,
    power REAL,
    temperature REAL,
    soc REAL,
    fault_code TEXT,
    fault_message TEXT,
    occupied_duration INTEGER DEFAULT 0,
    is_occupied INTEGER DEFAULT 0,
    is_charging INTEGER DEFAULT 0,
    is_offline INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (charger_id) REFERENCES chargers(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar TEXT,
    balance REAL DEFAULT 0,
    total_charging_count INTEGER DEFAULT 0,
    total_energy REAL DEFAULT 0,
    preferred_charger_type TEXT DEFAULT 'fast',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plate_number TEXT UNIQUE NOT NULL,
    brand TEXT,
    model TEXT,
    battery_capacity REAL,
    current_range INTEGER,
    max_range INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS charging_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    charger_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    start_soc REAL,
    end_soc REAL,
    energy REAL DEFAULT 0,
    duration INTEGER DEFAULT 0,
    peak_energy REAL DEFAULT 0,
    flat_energy REAL DEFAULT 0,
    valley_energy REAL DEFAULT 0,
    peak_cost REAL DEFAULT 0,
    flat_cost REAL DEFAULT 0,
    valley_cost REAL DEFAULT 0,
    service_fee REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (charger_id) REFERENCES chargers(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS charging_power_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    charger_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    voltage REAL,
    current REAL,
    power REAL,
    soc REAL,
    temperature REAL,
    FOREIGN KEY (order_id) REFERENCES charging_orders(id),
    FOREIGN KEY (charger_id) REFERENCES chargers(id)
  );

  CREATE TABLE IF NOT EXISTS price_strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'time_of_use',
    effective_date DATE,
    expire_date DATE,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS price_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_id INTEGER NOT NULL,
    period_type TEXT NOT NULL CHECK(period_type IN ('peak', 'flat', 'valley')),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    electricity_price REAL NOT NULL,
    service_price REAL NOT NULL,
    FOREIGN KEY (strategy_id) REFERENCES price_strategies(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    charger_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    scheduled_start_time DATETIME NOT NULL,
    scheduled_end_time DATETIME,
    target_soc REAL DEFAULT 80,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (charger_id) REFERENCES chargers(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS alarm_work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order_no TEXT UNIQUE NOT NULL,
    charger_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    alarm_type TEXT NOT NULL,
    alarm_code TEXT,
    alarm_message TEXT,
    alarm_level TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'pending',
    assignee TEXT,
    description TEXT,
    resolution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (charger_id) REFERENCES chargers(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS daily_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    report_date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_energy REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    peak_energy REAL DEFAULT 0,
    flat_energy REAL DEFAULT 0,
    valley_energy REAL DEFAULT 0,
    peak_amount REAL DEFAULT 0,
    flat_amount REAL DEFAULT 0,
    valley_amount REAL DEFAULT 0,
    service_fee REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, report_date),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS monthly_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    report_month TEXT NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_energy REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    service_fee REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, report_month),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS ocpp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    charger_code TEXT NOT NULL,
    message_type TEXT NOT NULL,
    action TEXT,
    payload TEXT,
    direction TEXT CHECK(direction IN ('in', 'out')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_charger_status_charger_id ON charger_status(charger_id);
  CREATE INDEX IF NOT EXISTS idx_charger_status_timestamp ON charger_status(timestamp);
  CREATE INDEX IF NOT EXISTS idx_charging_orders_user_id ON charging_orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_charging_orders_charger_id ON charging_orders(charger_id);
  CREATE INDEX IF NOT EXISTS idx_charging_orders_status ON charging_orders(status);
  CREATE INDEX IF NOT EXISTS idx_charging_power_data_order_id ON charging_power_data(order_id);
  CREATE INDEX IF NOT EXISTS idx_charging_power_data_timestamp ON charging_power_data(timestamp);
  CREATE INDEX IF NOT EXISTS idx_alarm_work_orders_status ON alarm_work_orders(status);
  CREATE INDEX IF NOT EXISTS idx_daily_revenue_report_date ON daily_revenue(report_date);
  CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
  CREATE INDEX IF NOT EXISTS idx_reservations_charger_id ON reservations(charger_id);
`);

console.log('数据库初始化完成');
db.close();
