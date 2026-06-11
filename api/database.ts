import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'pension.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS certifications (
      certification_id TEXT PRIMARY KEY,
      id_card TEXT NOT NULL,
      name TEXT NOT NULL,
      social_security_no TEXT,
      status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'pending', 'reviewing')),
      failure_reason TEXT,
      device_fingerprint TEXT,
      cert_no TEXT,
      verify_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      alert_id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('high_frequency', 'remote_cluster', 'face_mismatch')),
      level TEXT NOT NULL CHECK(level IN ('warning', 'critical')),
      id_card TEXT,
      detail TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed')),
      trigger_time DATETIME
    );

    CREATE TABLE IF NOT EXISTS review_orders (
      order_id TEXT PRIMARY KEY,
      certification_id TEXT,
      id_card TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'transferred')),
      review_comment TEXT,
      reviewer TEXT,
      review_time DATETIME,
      FOREIGN KEY (certification_id) REFERENCES certifications(certification_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id TEXT PRIMARY KEY,
      certification_id TEXT,
      id_card TEXT,
      action TEXT NOT NULL,
      device_fingerprint TEXT,
      ip_address TEXT,
      detail TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (certification_id) REFERENCES certifications(certification_id)
    );

    CREATE TABLE IF NOT EXISTS screenshots (
      screenshot_id TEXT PRIMARY KEY,
      certification_id TEXT NOT NULL,
      frame_url TEXT NOT NULL,
      frame_order INTEGER NOT NULL,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (certification_id) REFERENCES certifications(certification_id)
    );

    CREATE INDEX IF NOT EXISTS idx_certifications_id_card ON certifications(id_card);
    CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);
    CREATE INDEX IF NOT EXISTS idx_certifications_verify_time ON certifications(verify_time);
    CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_certification_id ON audit_logs(certification_id);
    CREATE INDEX IF NOT EXISTS idx_screenshots_certification_id ON screenshots(certification_id);
    CREATE INDEX IF NOT EXISTS idx_review_orders_certification_id ON review_orders(certification_id);
    CREATE INDEX IF NOT EXISTS idx_review_orders_status ON review_orders(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_id_card ON audit_logs(id_card);
  `)
}

export default db
