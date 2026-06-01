const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS monitoring_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    device_code TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    pm25_threshold REAL DEFAULT 35,
    pm10_threshold REAL DEFAULT 70,
    noise_threshold REAL DEFAULT 70,
    construction_stage TEXT,
    responsible_unit TEXT,
    status TEXT DEFAULT 'online',
    last_heartbeat DATETIME,
    calibration_expiry DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monitoring_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    point_id INTEGER NOT NULL,
    pm25 REAL,
    pm10 REAL,
    noise REAL,
    wind_speed REAL,
    temperature REAL,
    humidity REAL,
    is_anomaly INTEGER DEFAULT 0,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (point_id) REFERENCES monitoring_points(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    point_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    alert_level TEXT DEFAULT 'warning',
    parameter TEXT,
    value REAL,
    threshold REAL,
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (point_id) REFERENCES monitoring_points(id)
  );

  CREATE TABLE IF NOT EXISTS rectification_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,
    task_no TEXT UNIQUE NOT NULL,
    sprinkler_activated INTEGER DEFAULT 0,
    work_stopped INTEGER DEFAULT 0,
    measures TEXT,
    photo_url TEXT,
    review_result TEXT,
    review_remark TEXT,
    reviewed_at DATETIME,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES alerts(id),
    FOREIGN KEY (point_id) REFERENCES monitoring_points(id)
  );

  CREATE TABLE IF NOT EXISTS sprinkler_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    point_id INTEGER NOT NULL,
    task_id INTEGER,
    action TEXT NOT NULL,
    operator TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (point_id) REFERENCES monitoring_points(id),
    FOREIGN KEY (task_id) REFERENCES rectification_tasks(id)
  );

  CREATE INDEX IF NOT EXISTS idx_data_point_time ON monitoring_data(point_id, collected_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON rectification_tasks(status);
`);

module.exports = db;
