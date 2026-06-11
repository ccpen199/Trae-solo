import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "..", "health-data.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const initSQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user','admin','sysadmin')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  name TEXT NOT NULL,
  firmware_version TEXT,
  battery_level INTEGER DEFAULT 0,
  connection_status TEXT DEFAULT 'disconnected' CHECK(connection_status IN ('connected','disconnected','pairing')),
  last_sync_time TEXT,
  signal_strength INTEGER,
  sync_status TEXT DEFAULT 'idle' CHECK(sync_status IN ('idle','syncing','completed','failed')),
  abstraction_status TEXT DEFAULT 'pending' CHECK(abstraction_status IN ('pending','adapted','unsupported','partial')),
  privacy_status TEXT DEFAULT 'not_processed' CHECK(privacy_status IN ('not_processed','masked','encrypted','anonymized')),
  archive_status TEXT DEFAULT 'not_generated' CHECK(archive_status IN ('not_generated','generating','completed','failed')),
  last_sync_result_json TEXT,
  supported_features_json TEXT,
  protocol_version TEXT,
  UNIQUE(user_id, brand, model)
);

CREATE TABLE IF NOT EXISTS vital_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  heart_rate INTEGER,
  hrv REAL,
  blood_oxygen REAL,
  stress_index REAL,
  resting_heart_rate INTEGER,
  timestamp TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vitals_user_time ON vital_records(user_id, timestamp);

CREATE TABLE IF NOT EXISTS sleep_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  total_time INTEGER,
  deep_sleep INTEGER,
  light_sleep INTEGER,
  rem_sleep INTEGER,
  awake_time INTEGER,
  noise_level_avg REAL,
  noise_level_json TEXT,
  quality_score REAL,
  stages_json TEXT,
  raw_data_encrypted TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS exercise_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration INTEGER,
  distance REAL,
  calories INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  trajectory_encrypted TEXT,
  heart_rate_zones_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exercise_user_time ON exercise_records(user_id, start_time);

CREATE TABLE IF NOT EXISTS exercise_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  daily_plans_json TEXT NOT NULL,
  completion_rate REAL DEFAULT 0,
  recommendation TEXT,
  adaptive_reasoning TEXT,
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('critical','warning','info')),
  title TEXT NOT NULL,
  description TEXT,
  value REAL,
  threshold REAL,
  started_at TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','acknowledged','dismissed','pending_review','needs_referral')),
  created_at TEXT DEFAULT (datetime('now')),
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  disposition_status TEXT CHECK(disposition_status IN ('observed','medication_adjusted','lifestyle_change','referral_suggested','no_action')),
  disposition_note TEXT,
  review_scheduled_at TEXT,
  review_completed_at TEXT,
  referral_needed INTEGER DEFAULT 0,
  referral_appointment_id TEXT,
  dismissed_by TEXT,
  dismissed_at TEXT,
  dismiss_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);

CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  metric TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK(condition IN ('gt','lt','gte','lte','spike_percent')),
  threshold REAL NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  severity TEXT DEFAULT 'warning' CHECK(severity IN ('critical','warning','info')),
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS health_archives (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date_start TEXT NOT NULL,
  date_end TEXT NOT NULL,
  data_types_json TEXT NOT NULL,
  format TEXT DEFAULT 'json' CHECK(format IN ('json','pdf')),
  standard TEXT DEFAULT '移动健康终端设备数据交互规范',
  generated_at TEXT DEFAULT (datetime('now')),
  file_path TEXT,
  download_url TEXT,
  status TEXT DEFAULT 'generating' CHECK(status IN ('generating','completed','failed'))
);

CREATE TABLE IF NOT EXISTS data_authorizations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  target_org TEXT NOT NULL,
  target_org_name TEXT NOT NULL,
  scope_json TEXT NOT NULL,
  scope_description TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  revoked INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS his_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS his_doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  department_id TEXT NOT NULL,
  title TEXT NOT NULL,
  available_slots_json TEXT
);

CREATE TABLE IF NOT EXISTS his_appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  hospital_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled')),
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO users (id, phone, email, name, hashed_password, role) VALUES 
('user-001', '13800138000', 'user@example.com', '张三', 'hash_placeholder', 'user');
`;

db.exec(initSQL);

function columnExists(tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return columns.some((c) => c.name === columnName);
}

function addColumnIfNotExists(tableName: string, columnDef: string): void {
  const columnName = columnDef.split(" ")[0];
  if (!columnExists(tableName, columnName)) {
    try {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`).run();
    } catch (e) {
      console.warn(`Migration: failed to add ${tableName}.${columnName}:`, e);
    }
  }
}

function runMigrations() {
  addColumnIfNotExists("devices", "signal_strength INTEGER");
  addColumnIfNotExists("devices", "sync_status TEXT DEFAULT 'idle'");
  addColumnIfNotExists("devices", "abstraction_status TEXT DEFAULT 'pending'");
  addColumnIfNotExists("devices", "privacy_status TEXT DEFAULT 'not_processed'");
  addColumnIfNotExists("devices", "archive_status TEXT DEFAULT 'not_generated'");
  addColumnIfNotExists("devices", "last_sync_result_json TEXT");
  addColumnIfNotExists("devices", "supported_features_json TEXT");
  addColumnIfNotExists("devices", "protocol_version TEXT");

  addColumnIfNotExists("alerts", "acknowledged_by TEXT");
  addColumnIfNotExists("alerts", "acknowledged_at TEXT");
  addColumnIfNotExists("alerts", "disposition_status TEXT");
  addColumnIfNotExists("alerts", "disposition_note TEXT");
  addColumnIfNotExists("alerts", "review_scheduled_at TEXT");
  addColumnIfNotExists("alerts", "review_completed_at TEXT");
  addColumnIfNotExists("alerts", "referral_needed INTEGER DEFAULT 0");
  addColumnIfNotExists("alerts", "referral_appointment_id TEXT");
  addColumnIfNotExists("alerts", "dismissed_by TEXT");
  addColumnIfNotExists("alerts", "dismissed_at TEXT");
  addColumnIfNotExists("alerts", "dismiss_reason TEXT");

  try {
    const checkResult = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='alerts'
    `).get() as { sql: string } | undefined;
    
    const needsAlertTableRebuild = checkResult?.sql && 
      !checkResult.sql.includes("pending_review") && 
      !checkResult.sql.includes("needs_referral");

    if (needsAlertTableRebuild) {
      console.log("Migration: rebuilding alerts table to update status check constraint");
      db.exec(`
        CREATE TABLE IF NOT EXISTS alerts_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          type TEXT NOT NULL,
          severity TEXT NOT NULL CHECK(severity IN ('critical','warning','info')),
          title TEXT NOT NULL,
          description TEXT,
          value REAL,
          threshold REAL,
          started_at TEXT NOT NULL,
          duration_minutes INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK(status IN ('active','acknowledged','dismissed','pending_review','needs_referral')),
          created_at TEXT DEFAULT (datetime('now')),
          acknowledged_by TEXT,
          acknowledged_at TEXT,
          disposition_status TEXT CHECK(disposition_status IN ('observed','medication_adjusted','lifestyle_change','referral_suggested','no_action')),
          disposition_note TEXT,
          review_scheduled_at TEXT,
          review_completed_at TEXT,
          referral_needed INTEGER DEFAULT 0,
          referral_appointment_id TEXT,
          dismissed_by TEXT,
          dismissed_at TEXT,
          dismiss_reason TEXT
        );
        INSERT INTO alerts_new SELECT * FROM alerts;
        DROP TABLE alerts;
        ALTER TABLE alerts_new RENAME TO alerts;
        CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);
      `);
    }
  } catch (e) {
    console.warn("Migration: alerts table rebuild failed:", e);
  }

  const deviceCount = (db.prepare("SELECT COUNT(*) as cnt FROM devices").get() as { cnt: number }).cnt;
  if (deviceCount > 0) {
    const hasSyncStatus = columnExists("devices", "sync_status");
    if (hasSyncStatus) {
      db.prepare(`
        UPDATE devices 
        SET sync_status = COALESCE(sync_status, 'idle'),
            abstraction_status = COALESCE(abstraction_status, 'pending'),
            privacy_status = COALESCE(privacy_status, 'not_processed'),
            archive_status = COALESCE(archive_status, 'not_generated')
        WHERE sync_status IS NULL 
           OR abstraction_status IS NULL 
           OR privacy_status IS NULL 
           OR archive_status IS NULL
      `).run();
    }
  }

  console.log("Database migrations completed");
}

runMigrations();

export default db;
