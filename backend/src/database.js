import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      avatar TEXT,
      real_name TEXT,
      id_card TEXT,
      verified INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      frozen_balance REAL DEFAULT 0,
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      device_fingerprint TEXT,
      risk_score INTEGER DEFAULT 100,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      legal_notice TEXT,
      default_reward REAL,
      default_duration INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publisher_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      reward REAL NOT NULL,
      total_count INTEGER NOT NULL,
      remaining_count INTEGER NOT NULL,
      duration INTEGER,
      status TEXT DEFAULT 'pending',
      audit_status TEXT DEFAULT 'pending',
      escrow_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      FOREIGN KEY (publisher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_accepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      status TEXT DEFAULT 'accepted',
      submitted_at TEXT,
      completed_at TEXT,
      ai_verified INTEGER DEFAULT 0,
      manual_verified INTEGER DEFAULT 0,
      reject_reason TEXT,
      submission_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (worker_id) REFERENCES users(id),
      UNIQUE(task_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL,
      balance_after REAL,
      related_id INTEGER,
      related_type TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      fee REAL DEFAULT 0,
      actual_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      account_info TEXT,
      audit_by INTEGER,
      audit_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_accept_id INTEGER NOT NULL,
      complainant_id INTEGER NOT NULL,
      respondent_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      handled_by INTEGER,
      handled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_accept_id) REFERENCES task_accepts(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS red_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sponsor_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      count INTEGER NOT NULL,
      remaining_amount REAL NOT NULL,
      remaining_count INTEGER NOT NULL,
      min_amount REAL,
      max_amount REAL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      FOREIGN KEY (sponsor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS red_packet_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      red_packet_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (red_packet_id) REFERENCES red_packets(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(red_packet_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM task_templates');
  if (stmt.get().count === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO task_templates (name, category, description, requirements, legal_notice, default_reward, default_duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertTemplate.run('问卷调研', 'survey', '发布线上问卷，收集用户反馈', '1. 问卷不少于10题\n2. 需提供问卷链接', '发布者需确保问卷内容合规，不得涉及隐私敏感信息', 5, 3600);
    insertTemplate.run('视频观看', 'video', '观看指定视频并完成验证', '1. 完整观看视频\n2. 截图证明', '视频内容需合规，不得包含广告欺诈', 2, 1800);
    insertTemplate.run('地推打卡', 'promotion', '线下地点打卡推广', '1. 到达指定地点\n2. 拍摄现场照片', '需遵守当地法律法规，不得扰民', 15, 7200);
    insertTemplate.run('祝福征集', 'blessing', '收集祝福语或生日祝福', '1. 提交原创祝福内容\n2. 不少于20字', '内容需积极健康，不得包含违规内容', 1, 300);
  }

  const adminStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
  if (adminStmt.get().count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, real_name, verified, is_admin)
      VALUES (?, ?, ?, 1, 1)
    `).run('admin', hashedPassword, '系统管理员');
  }
}

export { db, initDatabase };
