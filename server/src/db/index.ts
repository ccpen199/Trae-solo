import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';

let db: Database.Database;

export const getDb = () => {
  if (!db) {
    const dbDir = path.dirname(path.resolve(config.db.path));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new Database(path.resolve(config.db.path));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
};

export const initDatabase = () => {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      id_card_no TEXT,
      phone TEXT,
      user_type TEXT DEFAULT 'individual',
      enterprise_name TEXT,
      unified_social_credit_code TEXT,
      password_hash TEXT,
      auth_level TEXT DEFAULT 'L1',
      is_verified INTEGER DEFAULT 0,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ca_certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      cert_sn TEXT UNIQUE,
      cert_type TEXT DEFAULT 'SM2',
      issuer TEXT,
      subject TEXT,
      valid_from TEXT,
      valid_to TEXT,
      status TEXT DEFAULT 'active',
      public_key TEXT,
      private_key_enc TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS form_templates (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      estimated_days INTEGER DEFAULT 3,
      required_materials TEXT,
      form_fields TEXT,
      approval_process TEXT,
      is_hot INTEGER DEFAULT 0,
      icon TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS apply_records (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES form_templates(id),
      item_name TEXT,
      item_code TEXT,
      applicant_id TEXT NOT NULL REFERENCES users(id),
      applicant_name TEXT,
      enterprise_name TEXT,
      form_data TEXT,
      materials TEXT,
      status TEXT DEFAULT 'draft',
      current_step INTEGER DEFAULT 1,
      total_steps INTEGER DEFAULT 5,
      reject_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS approval_nodes (
      id TEXT PRIMARY KEY,
      apply_id TEXT NOT NULL REFERENCES apply_records(id),
      node_name TEXT,
      node_role TEXT,
      node_level INTEGER,
      assignee_id TEXT REFERENCES users(id),
      assignee_name TEXT,
      status TEXT DEFAULT 'pending',
      comment TEXT,
      operated_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sign_documents (
      id TEXT PRIMARY KEY,
      apply_id TEXT NOT NULL REFERENCES apply_records(id),
      apply_name TEXT,
      title TEXT,
      document_type TEXT,
      content TEXT,
      file_url TEXT,
      pages INTEGER DEFAULT 1,
      sign_positions TEXT,
      require_signer_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      deadline TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sign_logs (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES sign_documents(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      user_name TEXT,
      action TEXT,
      action_timestamp TEXT DEFAULT (datetime('now')),
      device_info TEXT,
      ip TEXT,
      location TEXT,
      biometric_type TEXT,
      biometric_verified INTEGER DEFAULT 0,
      biometric_score REAL,
      tsa_timestamp TEXT,
      tsa_hash TEXT,
      tsa_serial TEXT,
      signature_data TEXT,
      signature_type TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      module TEXT,
      action TEXT,
      target_id TEXT,
      detail TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'notification',
      level TEXT DEFAULT 'normal',
      publisher TEXT,
      published_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT,
      title TEXT,
      description TEXT,
      related_id TEXT,
      priority TEXT DEFAULT 'medium',
      is_read INTEGER DEFAULT 0,
      deadline TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS electronic_licenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      license_type TEXT,
      license_no TEXT,
      holder_name TEXT,
      issuer TEXT,
      issue_date TEXT,
      valid_from TEXT,
      valid_to TEXT,
      status TEXT DEFAULT 'valid',
      image_url TEXT,
      can_be_shared INTEGER DEFAULT 1,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS archives (
      id TEXT PRIMARY KEY,
      apply_id TEXT NOT NULL REFERENCES apply_records(id),
      archive_name TEXT,
      file_hash TEXT,
      file_path TEXT,
      file_size INTEGER,
      items TEXT,
      cloud_storage_key TEXT,
      archived_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_apply_applicant ON apply_records(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_apply_status ON apply_records(status);
    CREATE INDEX IF NOT EXISTS idx_sign_logs_doc ON sign_logs(document_id);
    CREATE INDEX IF NOT EXISTS idx_approval_apply ON approval_nodes(apply_id);
    CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
  `);
  console.log('[DB] Database initialized successfully.');
};

export default getDb;
