import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      wechat TEXT,
      role TEXT DEFAULT 'user',
      plan TEXT DEFAULT 'free',
      meeting_number TEXT UNIQUE,
      recording_space INTEGER DEFAULT 0,
      max_recording_space INTEGER DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      host_id INTEGER NOT NULL,
      status TEXT DEFAULT 'scheduled',
      start_time DATETIME,
      end_time DATETIME,
      duration INTEGER DEFAULT 60,
      max_participants INTEGER DEFAULT 100,
      enable_recording INTEGER DEFAULT 0,
      enable_chat INTEGER DEFAULT 1,
      enable_screen_share INTEGER DEFAULT 1,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      user_id INTEGER,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'participant',
      join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      leave_time DATETIME,
      is_online INTEGER DEFAULT 1,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      user_id INTEGER,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  if ((adminExists as any).count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, email, password, role, plan, meeting_number, max_recording_space)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('admin', 'admin@meeting.com', hashedPassword, 'admin', 'pro', '100000', 10000);
  }
}

export default db;
