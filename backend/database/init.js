module.exports = (db) => {
  const bcrypt = require('bcryptjs');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT,
      nickname TEXT,
      member_level INTEGER DEFAULT 1,
      wechat_openid TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      host_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER,
      password TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      waiting_room_enabled INTEGER DEFAULT 0,
      mute_on_entry INTEGER DEFAULT 0,
      recording_enabled INTEGER DEFAULT 0,
      is_recording INTEGER DEFAULT 0,
      is_sharing INTEGER DEFAULT 0,
      document_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      user_id INTEGER,
      guest_name TEXT,
      role TEXT DEFAULT 'participant',
      status TEXT DEFAULT 'waiting',
      audio_enabled INTEGER DEFAULT 1,
      video_enabled INTEGER DEFAULT 1,
      is_speaking INTEGER DEFAULT 0,
      is_muted INTEGER DEFAULT 0,
      join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      leave_time DATETIME,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      user_id INTEGER,
      guest_name TEXT,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_id);
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
    CREATE INDEX IF NOT EXISTS idx_meetings_number ON meetings(meeting_number);
    CREATE INDEX IF NOT EXISTS idx_participants_meeting ON meeting_participants(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_participants_status ON meeting_participants(status);
    CREATE INDEX IF NOT EXISTS idx_verification_target ON verification_codes(target);
    CREATE INDEX IF NOT EXISTS idx_chat_meeting ON chat_messages(meeting_id);
  `);

  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get('13800000000');
  if (!existingUser) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (phone, username, password, nickname)
      VALUES (?, ?, ?, ?)
    `).run('13800000000', 'demo', hashedPassword, '演示用户');
    console.log('Default test user created: phone=13800000000, password=123456');
  }

  console.log('Database tables initialized successfully');
};
