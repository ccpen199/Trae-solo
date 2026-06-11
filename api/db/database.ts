import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'weather.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT,
      country TEXT DEFAULT '中国',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      adcode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_current (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id TEXT NOT NULL,
      temperature REAL,
      feels_like REAL,
      weather TEXT,
      weather_code TEXT,
      humidity REAL,
      wind_direction TEXT,
      wind_speed REAL,
      pressure REAL,
      visibility REAL,
      uv_index REAL,
      precipitation REAL,
      data_sources TEXT,
      update_time DATETIME,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS weather_hourly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id TEXT NOT NULL,
      forecast_time DATETIME NOT NULL,
      temperature REAL,
      weather TEXT,
      weather_code TEXT,
      precipitation REAL,
      wind_direction TEXT,
      wind_speed REAL,
      humidity REAL,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS weather_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id TEXT NOT NULL,
      forecast_date DATE NOT NULL,
      day_weather TEXT,
      night_weather TEXT,
      temp_high REAL,
      temp_low REAL,
      precipitation REAL,
      precip_probability REAL,
      uv_index REAL,
      sunrise TEXT,
      sunset TEXT,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS weather_alerts (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      type TEXT NOT NULL,
      type_code TEXT,
      level TEXT NOT NULL,
      level_code INTEGER,
      title TEXT,
      content TEXT,
      defense_guide TEXT,
      start_time DATETIME,
      end_time DATETIME,
      publish_time DATETIME,
      source TEXT,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS minutely_precipitation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id TEXT NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      step_minutes INTEGER DEFAULT 5,
      grid_size INTEGER DEFAULT 500,
      grid_data TEXT,
      precipitation_data TEXT,
      summary TEXT,
      update_time DATETIME,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS life_indices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id TEXT NOT NULL,
      index_type TEXT NOT NULL,
      index_name TEXT NOT NULL,
      value TEXT,
      level TEXT,
      level_code INTEGER,
      description TEXT,
      update_time DATETIME,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'online',
      uptime REAL DEFAULT 99.9,
      latency INTEGER DEFAULT 100,
      success_rate REAL DEFAULT 99.5,
      quality_score REAL DEFAULT 95,
      last_update DATETIME,
      circuit_break_reason TEXT,
      circuit_break_time DATETIME,
      error_count INTEGER DEFAULT 0,
      weight REAL DEFAULT 1.0
    );

    CREATE TABLE IF NOT EXISTS quality_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      field TEXT NOT NULL,
      operator TEXT NOT NULL,
      threshold TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      enabled INTEGER DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS circuit_break_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES data_sources(id)
    );

    CREATE TABLE IF NOT EXISTS index_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      index_type TEXT NOT NULL UNIQUE,
      index_name TEXT NOT NULL,
      parameters TEXT NOT NULL,
      version TEXT,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'active',
      rate_limit INTEGER DEFAULT 1000,
      call_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      detail TEXT,
      ip TEXT,
      created_at TEXT DEFAULT (DATETIME('now'))
    );

    CREATE TABLE IF NOT EXISTS api_call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id TEXT,
      endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      response_time INTEGER,
      call_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    );

    CREATE TABLE IF NOT EXISTS user_cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_session TEXT NOT NULL,
      city_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE INDEX IF NOT EXISTS idx_weather_current_city ON weather_current(city_id);
    CREATE INDEX IF NOT EXISTS idx_weather_hourly_city ON weather_hourly(city_id);
    CREATE INDEX IF NOT EXISTS idx_weather_daily_city ON weather_daily(city_id);
    CREATE INDEX IF NOT EXISTS idx_weather_alerts_city ON weather_alerts(city_id);
    CREATE INDEX IF NOT EXISTS idx_life_indices_city ON life_indices(city_id);
    CREATE INDEX IF NOT EXISTS idx_api_call_logs_key ON api_call_logs(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_cities_session ON user_cities(user_session);
  `);
}
