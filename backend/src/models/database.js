const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      avatar TEXT,
      personal_meeting_id TEXT UNIQUE,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      phone TEXT,
      email TEXT,
      code TEXT,
      type TEXT,
      expires_at INTEGER,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      meeting_number TEXT UNIQUE,
      title TEXT,
      host_id TEXT,
      start_time INTEGER,
      end_time INTEGER,
      is_recurring INTEGER DEFAULT 0,
      recurring_rule TEXT,
      status TEXT DEFAULT 'scheduled',
      use_personal_id INTEGER DEFAULT 0,
      password TEXT,
      settings TEXT,
      created_at INTEGER,
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_participants (
      id TEXT PRIMARY KEY,
      meeting_id TEXT,
      user_id TEXT,
      name TEXT,
      role TEXT DEFAULT 'participant',
      status TEXT DEFAULT 'waiting',
      audio_enabled INTEGER DEFAULT 1,
      video_enabled INTEGER DEFAULT 1,
      is_in_waiting_room INTEGER DEFAULT 0,
      joined_at INTEGER,
      left_at INTEGER,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_settings (
      id TEXT PRIMARY KEY,
      meeting_id TEXT UNIQUE,
      lock_enabled INTEGER DEFAULT 0,
      waiting_room_enabled INTEGER DEFAULT 1,
      share_permission TEXT DEFAULT 'host_only',
      chat_permission TEXT DEFAULT 'all',
      record_permission TEXT DEFAULT 'host_only',
      allow_unmute INTEGER DEFAULT 1,
      red_packet_enabled INTEGER DEFAULT 0,
      audio_enhance INTEGER DEFAULT 0,
      video_enhance INTEGER DEFAULT 0,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      meeting_id TEXT,
      role TEXT,
      joined_at INTEGER,
      left_at INTEGER,
      duration INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (meeting_id) REFERENCES meetings(id)
    );
  `);

  console.log('Database initialized successfully');
};

module.exports = { db, initDatabase };
