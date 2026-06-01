import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS claim_tasks (
      id TEXT PRIMARY KEY,
      task_no TEXT UNIQUE NOT NULL,
      source TEXT NOT NULL,
      accident_location TEXT NOT NULL,
      accident_time DATETIME NOT NULL,
      policy_no TEXT NOT NULL,
      policy_holder TEXT NOT NULL,
      vehicle_info TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      appointment_time DATETIME,
      status TEXT NOT NULL DEFAULT 'pending',
      current_handler_id TEXT,
      is_overdue INTEGER DEFAULT 0,
      overdue_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_transfer_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      from_handler_id TEXT,
      to_handler_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES claim_tasks(id),
      FOREIGN KEY (from_handler_id) REFERENCES users(id),
      FOREIGN KEY (to_handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      category TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      location_address TEXT,
      watermark_info TEXT,
      shoot_time DATETIME NOT NULL,
      is_retake INTEGER DEFAULT 0,
      original_photo_id TEXT,
      retake_reason TEXT,
      uploaded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES claim_tasks(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS loss_items (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      part TEXT NOT NULL,
      part_name TEXT NOT NULL,
      accessory TEXT,
      accessory_name TEXT,
      labor_fee REAL NOT NULL DEFAULT 0,
      residual_value REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      price_source TEXT NOT NULL,
      manual_adjust_reason TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES claim_tasks(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_versions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES claim_tasks(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS review_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      reviewer_id TEXT NOT NULL,
      review_result TEXT NOT NULL,
      review_comments TEXT,
      historical_risk TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES claim_tasks(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_claim_tasks_status ON claim_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_claim_tasks_handler ON claim_tasks(current_handler_id);
    CREATE INDEX IF NOT EXISTS idx_photos_task ON photos(task_id);
    CREATE INDEX IF NOT EXISTS idx_loss_items_task ON loss_items(task_id);
    CREATE INDEX IF NOT EXISTS idx_review_logs_task ON review_logs(task_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const initUsers = db.prepare(`
      INSERT INTO users (id, username, password, name, role, phone) VALUES
      ('admin', 'admin', '$2a$10$EixZaY3s7jRzjMRCs7jR/.XvK1K1yK1K1yK1K1yK1K1yK1yK1yK1y', '系统管理员', 'admin', '13800000000'),
      ('surveyor1', 'surveyor1', '$2a$10$EixZaY3s7jRzjMRCs7jR/.XvK1K1yK1K1yK1K1yK1K1yK1yK1y', '查勘员张三', 'surveyor', '13800000001'),
      ('surveyor2', 'surveyor2', '$2a$10$EixZaY3s7jRzjMRCs7jR/.XvK1K1yK1K1yK1K1yK1K1yK1yK1y', '查勘员李四', 'surveyor', '13800000002'),
      ('assessor1', 'assessor1', '$2a$10$EixZaY3s7jRzjMRCs7jR/.XvK1K1yK1K1yK1K1yK1K1yK1yK1y', '定损员王五', 'assessor', '13800000003'),
      ('reviewer1', 'reviewer1', '$2a$10$EixZaY3s7jRzjMRCs7jR/.XvK1K1yK1K1yK1K1yK1K1yK1yK1y', '审核员赵六', 'reviewer', '13800000004'),
      ('service1', 'service1', '$2a$10$EixZaY3s7jRzjMRCs7jR/.XvK1K1yK1K1yK1K1yK1K1yK1yK1y', '客服钱七', 'service', '13800000005')
    `);
    initUsers.run();
  }
}

export default db;
