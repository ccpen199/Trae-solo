import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.resolve(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cid TEXT UNIQUE NOT NULL,
      username TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      status TEXT DEFAULT 'offline',
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      is_recent INTEGER DEFAULT 0,
      last_interaction_at DATETIME,
      relation_source TEXT DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, contact_id),
      FOREIGN KEY (user_id) REFERENCES accounts(id),
      FOREIGN KEY (contact_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS call_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      caller_id INTEGER NOT NULL,
      callee_id INTEGER NOT NULL,
      status TEXT DEFAULT 'dialing',
      start_time DATETIME,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      call_type TEXT DEFAULT 'video',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caller_id) REFERENCES accounts(id),
      FOREIGN KEY (callee_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS video_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_ids TEXT NOT NULL,
      text_content TEXT,
      video_url TEXT,
      duration INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      is_group INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS message_center (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message_type TEXT NOT NULL,
      related_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS invite_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      invitee_phone TEXT NOT NULL,
      invite_type TEXT DEFAULT 'sms',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inviter_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS login_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES accounts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_contact ON contacts(contact_id);
    CREATE INDEX IF NOT EXISTS idx_calls_caller ON call_sessions(caller_id);
    CREATE INDEX IF NOT EXISTS idx_calls_callee ON call_sessions(callee_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON video_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_message_center_user ON message_center(user_id);
  `);

  console.log('数据库表初始化完成');
};

export { db, initTables };
