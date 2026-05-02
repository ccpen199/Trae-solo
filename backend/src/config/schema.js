const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'maintenance_worker',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  capacity_kw REAL NOT NULL DEFAULT 0,
  address TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  installed_date DATE,
  owner_id TEXT NOT NULL,
  investor_id TEXT,
  status TEXT NOT NULL DEFAULT 'operating',
  health_level TEXT DEFAULT 'good',
  pr_target REAL DEFAULT 0.85,
  efficiency_ratio REAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (investor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inverters (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT,
  capacity_kw REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'offline',
  installation_date DATE,
  vendor TEXT,
  firmware_version TEXT,
  last_communication TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS strings (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  inverter_id TEXT NOT NULL,
  string_number INTEGER NOT NULL,
  panels_count INTEGER NOT NULL DEFAULT 0,
  capacity_kw REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (inverter_id) REFERENCES inverters(id)
);

CREATE TABLE IF NOT EXISTS inverter_data (
  id TEXT PRIMARY KEY,
  inverter_id TEXT NOT NULL,
  station_id TEXT NOT NULL,
  collect_time TIMESTAMP NOT NULL,
  dc_voltage REAL,
  dc_current REAL,
  ac_voltage REAL,
  ac_current REAL,
  active_power REAL,
  reactive_power REAL,
  power_factor REAL,
  efficiency REAL,
  temperature REAL,
  daily_generation_kwh REAL DEFAULT 0,
  total_generation_kwh REAL DEFAULT 0,
  status_code TEXT,
  alarm_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inverter_id) REFERENCES inverters(id),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE INDEX IF NOT EXISTS idx_inverter_data_time ON inverter_data(collect_time);
CREATE INDEX IF NOT EXISTS idx_inverter_data_station ON inverter_data(station_id);

CREATE TABLE IF NOT EXISTS weather_data (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  collect_time TIMESTAMP NOT NULL,
  irradiance REAL,
  ambient_temp REAL,
  wind_speed REAL,
  humidity REAL,
  cloud_cover REAL,
  expected_generation_kwh REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS generation_records (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  record_date DATE NOT NULL,
  actual_generation_kwh REAL NOT NULL DEFAULT 0,
  expected_generation_kwh REAL NOT NULL DEFAULT 0,
  pr_value REAL,
  deviation REAL,
  deviation_percent REAL,
  status TEXT DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  UNIQUE(station_id, record_date)
);

CREATE TABLE IF NOT EXISTS cleaning_orders (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  assigned_worker_id TEXT,
  cause TEXT NOT NULL DEFAULT 'dust',
  expected_efficiency_improvement REAL,
  current_degradation_percent REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  dispatch_time TIMESTAMP,
  accept_time TIMESTAMP,
  start_time TIMESTAMP,
  complete_time TIMESTAMP,
  verify_time TIMESTAMP,
  before_cleaning_image TEXT,
  after_cleaning_image TEXT,
  worker_notes TEXT,
  verifier_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (assigned_worker_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS maintenance_orders (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  fault_id TEXT,
  assigned_worker_id TEXT,
  problem_description TEXT NOT NULL,
  estimated_repair_time_hours REAL,
  actual_repair_time_hours REAL,
  mttr_minutes REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 2,
  dispatch_time TIMESTAMP,
  accept_time TIMESTAMP,
  on_site_time TIMESTAMP,
  start_repair_time TIMESTAMP,
  complete_time TIMESTAMP,
  verify_time TIMESTAMP,
  parts_used TEXT,
  worker_feedback TEXT,
  verifier_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (fault_id) REFERENCES faults(id),
  FOREIGN KEY (assigned_worker_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS faults (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  inverter_id TEXT,
  string_id TEXT,
  detected_time TIMESTAMP NOT NULL,
  fault_code TEXT,
  fault_description TEXT,
  severity TEXT NOT NULL DEFAULT 'major',
  status TEXT NOT NULL DEFAULT 'detected',
  root_cause TEXT,
  resolved_time TIMESTAMP,
  resolution_notes TEXT,
  maintenance_order_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (inverter_id) REFERENCES inverters(id),
  FOREIGN KEY (string_id) REFERENCES strings(id),
  FOREIGN KEY (maintenance_order_id) REFERENCES maintenance_orders(id)
);

CREATE TABLE IF NOT EXISTS daily_settlements (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  settlement_date DATE NOT NULL,
  grid_generation_kwh REAL NOT NULL DEFAULT 0,
  self_consumption_kwh REAL DEFAULT 0,
  feed_in_kwh REAL DEFAULT 0,
  grid_price_per_kwh REAL NOT NULL DEFAULT 0,
  subsidy_price_per_kwh REAL DEFAULT 0,
  grid_revenue REAL NOT NULL DEFAULT 0,
  subsidy_revenue REAL DEFAULT 0,
  total_revenue REAL NOT NULL DEFAULT 0,
  investor_share_percent REAL DEFAULT 1.0,
  owner_share_percent REAL DEFAULT 0,
  investor_revenue REAL DEFAULT 0,
  owner_revenue REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  UNIQUE(station_id, settlement_date)
);

CREATE TABLE IF NOT EXISTS investor_revenue_summary (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_generation_kwh REAL NOT NULL DEFAULT 0,
  total_revenue REAL NOT NULL DEFAULT 0,
  investor_share REAL NOT NULL DEFAULT 0,
  irr_percent REAL,
  payback_period_months REAL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (investor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS asset_valuations (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  valuation_date DATE NOT NULL,
  current_capacity_kw REAL NOT NULL,
  remaining_life_years REAL,
  historical_pr_value REAL,
  predicted_future_generation_kwh REAL,
  predicted_future_revenue REAL,
  estimated_value REAL,
  depreciation_rate REAL DEFAULT 0.05,
  health_score REAL,
  quality_level TEXT,
  report_file TEXT,
  status TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  is_read INTEGER DEFAULT 0,
  read_time TIMESTAMP,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  hash_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_object ON audit_logs(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS inverter_messages (
  id TEXT PRIMARY KEY,
  inverter_id TEXT NOT NULL,
  station_id TEXT NOT NULL,
  message_time TIMESTAMP NOT NULL,
  message_type TEXT NOT NULL,
  raw_message TEXT NOT NULL,
  parsed_data TEXT,
  hash_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inverter_id) REFERENCES inverters(id),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id TEXT PRIMARY KEY,
  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  station_id TEXT,
  value REAL NOT NULL,
  unit TEXT,
  trend_direction TEXT,
  trend_percent REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_date, metric_type, station_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_date ON dashboard_metrics(metric_date, metric_type);
`;

module.exports = schema;
