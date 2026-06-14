const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../', process.env.DB_PATH || './data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS battery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      device_model TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      voltage REAL,
      current REAL,
      temperature REAL,
      level INTEGER,
      health TEXT,
      status TEXT,
      plugged TEXT,
      power_source TEXT,
      usb_protocol TEXT,
      is_charging INTEGER DEFAULT 0,
      measurement_baseline TEXT,
      sampling_rate INTEGER
    );

    CREATE TABLE IF NOT EXISTS optimization_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      start_level INTEGER,
      end_level INTEGER,
      total_time INTEGER,
      efficiency REAL,
      strategy_used TEXT,
      is_active INTEGER DEFAULT 1,
      avg_voltage REAL,
      avg_current REAL,
      avg_temperature REAL,
      max_temperature REAL,
      estimated_full_time INTEGER,
      strategy_snapshot TEXT
    );

    CREATE TABLE IF NOT EXISTS device_adaptations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_model TEXT NOT NULL,
      soc_manufacturer TEXT,
      soc_model TEXT,
      optimal_voltage REAL,
      optimal_temperature REAL,
      max_charge_current REAL,
      temperature_high_threshold REAL DEFAULT 45,
      temperature_low_threshold REAL DEFAULT 5,
      strategy_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      low_battery_hours TEXT,
      charging_patterns TEXT,
      avg_daily_charge_count INTEGER,
      avg_charge_duration INTEGER,
      common_charge_levels TEXT,
      learning_score REAL DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS safety_fuse_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      session_id INTEGER,
      trigger_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      trigger_reason TEXT,
      trigger_value REAL,
      threshold REAL,
      action_taken TEXT,
      resolved INTEGER DEFAULT 0,
      resolved_time DATETIME
    );

    CREATE TABLE IF NOT EXISTS strategy_adjustment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      device_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      trigger_metric TEXT,
      trigger_value REAL,
      before_adjustment TEXT,
      after_adjustment TEXT,
      adjustment_reason TEXT
    );
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM device_adaptations');
  if (stmt.get().count === 0) {
    const insertAdapt = db.prepare(`
      INSERT INTO device_adaptations (device_model, soc_manufacturer, soc_model, optimal_voltage, optimal_temperature, max_charge_current, strategy_config)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const adaptations = [
      ['Default', 'Generic', 'Generic', 4.2, 25.0, 2.0, JSON.stringify({
        screenTimeout: 30,
        wifiScanInterval: 120,
        backgroundWakeup: false,
        cpuThrottling: false,
        syncDisabled: false
      })],
      ['Xiaomi Mi 11', 'Qualcomm', 'Snapdragon 888', 4.4, 28.0, 3.0, JSON.stringify({
        screenTimeout: 25,
        wifiScanInterval: 180,
        backgroundWakeup: false,
        cpuThrottling: true,
        syncDisabled: true
      })],
      ['iPhone 15', 'Apple', 'A17 Bionic', 4.35, 26.0, 2.5, JSON.stringify({
        screenTimeout: 30,
        wifiScanInterval: 150,
        backgroundWakeup: false,
        cpuThrottling: false,
        syncDisabled: true
      })],
      ['Samsung Galaxy S24', 'Qualcomm', 'Snapdragon 8 Gen 3', 4.4, 27.0, 3.3, JSON.stringify({
        screenTimeout: 20,
        wifiScanInterval: 200,
        backgroundWakeup: false,
        cpuThrottling: true,
        syncDisabled: true
      })],
      ['Huawei Mate 60', 'HiSilicon', 'Kirin 9000S', 4.25, 26.5, 2.8, JSON.stringify({
        screenTimeout: 25,
        wifiScanInterval: 160,
        backgroundWakeup: false,
        cpuThrottling: true,
        syncDisabled: true
      })]
    ];

    adaptations.forEach(a => insertAdapt.run(...a));
  }
};

initDb();

module.exports = db;
